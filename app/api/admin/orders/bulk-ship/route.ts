import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import * as shippingService from "@/lib/services/shipping.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { orderIds } = (await req.json()) as { orderIds: number[] };

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json(
      { error: "orderIds must be a non-empty array" },
      { status: 400 },
    );
  }

  const results: Array<{ orderId: number; success: boolean; error?: string }> =
    [];

  for (const orderId of orderIds) {
    try {
      const order = await orderRepository.findById(orderId);

      if (!order) {
        results.push({ orderId, success: false, error: "Order not found" });
        continue;
      }

      if (
        order.status !== "completed" ||
        order.fulfillment_status !== "not_fulfilled" ||
        order.payment_status !== "captured"
      ) {
        results.push({
          orderId,
          success: false,
          error: "Order not eligible for shipping",
        });
        continue;
      }

      await shippingService.createShipment(orderId);

      // Add history entry
      const updatedOrder = await orderRepository.findById(orderId);
      const meta = (updatedOrder?.metadata || {}) as Record<string, unknown>;
      const history = (meta.history as Array<Record<string, string>>) || [];

      history.push({
        date: new Date().toISOString(),
        status: "shipped",
        label: "Commande expédiée via Boxtal (bulk)",
      });

      await orderRepository.update(orderId, {
        metadata: JSON.stringify({ ...meta, history }),
      });

      results.push({ orderId, success: true });
    } catch (err) {
      results.push({
        orderId,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
});
