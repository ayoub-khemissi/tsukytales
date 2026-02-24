import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import * as shippingService from "@/lib/services/shipping.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { id } = await req.json();
  const order = await orderRepository.findById(id);
  if (!order) throw new AppError("Commande introuvable", 404);

  // If relay point has no address, try Boxtal lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (order.shipping_address || {}) as any;
  const relay = addr.relay;
  const isRelay = !!(relay || order.metadata?.shipping_method === "relay");

  if (isRelay && relay && !relay.address) {
    const foundPoint = await shippingService.findRelayByCode(relay.code);
    if (!foundPoint) {
      return NextResponse.json(
        { error: "relay_not_found", message: `Point relais "${relay.name}" (${relay.code}) introuvable dans le réseau Boxtal.` },
        { status: 400 },
      );
    }
    await orderRepository.update(order.id, {
      shipping_address: JSON.stringify({ ...addr, relay: { ...relay, address: foundPoint.address } }),
    });
  }

  const result = await shippingService.createShipment(id);

  // Add history entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (order.metadata || {}) as any;
  const history = meta.history || [];
  history.push({ date: new Date().toISOString(), status: "shipped", label: "Commande expédiée via Boxtal" });
  await orderRepository.update(order.id, {
    metadata: JSON.stringify({ ...meta, history }),
  });

  return NextResponse.json({ success: true, shippingOrderId: result.shippingOrderId });
});
