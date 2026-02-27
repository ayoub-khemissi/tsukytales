import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import * as shippingService from "@/lib/services/shipping.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { orderId, force } = await req.json();
  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);

  // Force re-ship: cancel old shipment and reset state
  if (
    force &&
    (order.metadata?.shipping_order_id || order.metadata?.shipping_failed)
  ) {
    if (order.metadata?.shipping_order_id) {
      await shippingService.cancelShipment(
        order.metadata.shipping_order_id as string,
      );
    }

    const cleanMeta = { ...(order.metadata || {}) } as Record<string, unknown>;

    delete cleanMeta.shipping_order_id;
    delete cleanMeta.shipping_failed;
    delete cleanMeta.shipping_error;

    await orderRepository.update(orderId, {
      fulfillment_status: "not_fulfilled",
      metadata: JSON.stringify(cleanMeta),
    });
  }

  // If relay point has no address, try Boxtal lookup
  // Re-fetch order after potential force reset
  const freshOrder = force ? await orderRepository.findById(orderId) : order;
  const addr = (freshOrder?.shipping_address || {}) as any;
  const relay = addr.relay;
  const isRelay = !!(
    relay || freshOrder?.metadata?.shipping_method === "relay"
  );

  if (isRelay && relay && !relay.address) {
    const foundPoint = await shippingService.findRelayByCode(relay.code);

    if (!foundPoint) {
      return NextResponse.json(
        {
          error: "relay_not_found",
          message: `Point relais "${relay.name}" (${relay.code}) introuvable dans le réseau Boxtal.`,
        },
        { status: 400 },
      );
    }
    await orderRepository.update(orderId, {
      shipping_address: JSON.stringify({
        ...addr,
        relay: { ...relay, address: foundPoint.address },
      }),
    });
  }

  const result = await shippingService.createShipment(orderId);

  // Add history entry (re-fetch to get metadata updated by createShipment)
  const updatedOrder = await orderRepository.findById(orderId);
  const meta = (updatedOrder?.metadata || {}) as any;
  const history = meta.history || [];

  history.push({
    date: new Date().toISOString(),
    status: "shipped",
    label: force
      ? "Commande ré-expédiée via Boxtal"
      : "Commande expédiée via Boxtal",
  });
  await orderRepository.update(orderId, {
    metadata: JSON.stringify({ ...meta, history }),
  });

  return NextResponse.json({
    success: true,
    shippingOrderId: result.shippingOrderId,
  });
});
