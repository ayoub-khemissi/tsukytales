import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { pool } from "@/lib/db/connection";
import { cached, cacheKey } from "@/lib/cache";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const months = parseInt(req.nextUrl.searchParams.get("months") || "6") || 6;

  const data = await cached(
    cacheKey("admin:financial", months),
    1800,
    async () => {
      const [[stats]] = await pool.execute<
        (RowDataPacket & {
          revenue: number;
          orders_count: number;
          refunds: number;
        })[]
      >(
        `SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'captured' THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as orders_count,
        COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN total ELSE 0 END), 0) as refunds
      FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)`,
        [months],
      );

      const revenue = Number(stats.revenue) || 0;
      const orders_count = Number(stats.orders_count) || 0;
      const refunds = Number(stats.refunds) || 0;
      const average_order = orders_count > 0 ? revenue / orders_count : 0;
      const net_revenue = revenue - refunds;

      return {
        revenue,
        orders_count,
        average_order,
        refunds,
        net_revenue,
      };
    },
  );

  return NextResponse.json(data);
});
