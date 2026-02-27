import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { pool } from "@/lib/db/connection";
import * as shippingService from "@/lib/services/shipping.service";
import { logger } from "@/lib/utils/logger";

export const POST = withErrorHandler(async () => {
  await requireAdmin();

  const [preorderProducts] = await pool.execute<
    (RowDataPacket & { id: number })[]
  >("SELECT id FROM products WHERE is_preorder = 1");
  const preorderProductIds = new Set(preorderProducts.map((p) => p.id));

  const orders = await orderRepository.findAll({
    where: "status = ? AND fulfillment_status = ?",
    params: ["completed", "not_fulfilled"],
  });

  const preorders = orders.filter((o) => {
    if ((o.metadata as any)?.subscription) return false;
    const orderItems =
      (typeof o.items === "string" ? JSON.parse(o.items) : o.items) || [];

    return orderItems.some(
      (i: any) => i.is_preorder || preorderProductIds.has(i.product_id),
    );
  });

  const results: {
    id: number;
    success: boolean;
    shippingOrderId?: string;
    error?: string;
  }[] = [];

  for (const order of preorders) {
    try {
      const result = await shippingService.createShipment(order.id);

      results.push({
        id: order.id,
        success: true,
        shippingOrderId: result.shippingOrderId,
      });
    } catch (err) {
      logger.error(
        `[Admin] Preorder ship TSK-${order.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      results.push({
        id: order.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    shipped: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
});
