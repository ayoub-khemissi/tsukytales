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
          subscription_revenue: number;
          oneoff_revenue: number;
          subscription_count: number;
          pending_amount: number;
          pending_count: number;
          discount_total: number;
          churned_count: number;
          mrr: number;
        })[]
      >(
        `SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'captured' THEN total ELSE 0 END), 0) as revenue,
        SUM(CASE WHEN payment_status = 'captured' THEN 1 ELSE 0 END) as orders_count,
        COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN total ELSE 0 END), 0) as refunds,
        COALESCE(SUM(CASE WHEN payment_status = 'captured' AND is_subscription_order = 1 THEN total ELSE 0 END), 0) as subscription_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'captured' AND is_subscription_order = 0 THEN total ELSE 0 END), 0) as oneoff_revenue,
        COUNT(DISTINCT CASE WHEN payment_status = 'captured' AND is_subscription_order = 1 THEN email ELSE NULL END) as subscription_count,
        COALESCE(SUM(CASE WHEN payment_status = 'awaiting' THEN total ELSE 0 END), 0) as pending_amount,
        SUM(CASE WHEN payment_status = 'awaiting' THEN 1 ELSE 0 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'captured' THEN discount_amount ELSE 0 END), 0) as discount_total,
        COUNT(DISTINCT CASE WHEN is_subscription_order = 1 AND status = 'canceled' THEN email ELSE NULL END) as churned_count,
        COALESCE(SUM(CASE WHEN payment_status = 'captured' AND is_subscription_order = 1
          AND DATE_FORMAT(createdAt, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN total ELSE 0 END), 0) as mrr
      FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)`,
        [months],
      );

      const [trend] = await pool.execute<
        (RowDataPacket & {
          month: string;
          revenue: number;
          orders_count: number;
        })[]
      >(
        `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month,
        COALESCE(SUM(CASE WHEN payment_status = 'captured' THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as orders_count
      FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month ORDER BY month`,
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
        subscription_revenue: Number(stats.subscription_revenue) || 0,
        oneoff_revenue: Number(stats.oneoff_revenue) || 0,
        subscription_count: Number(stats.subscription_count) || 0,
        pending_amount: Number(stats.pending_amount) || 0,
        pending_count: Number(stats.pending_count) || 0,
        discount_total: Number(stats.discount_total) || 0,
        churned_count: Number(stats.churned_count) || 0,
        churn_rate:
          Number(stats.subscription_count) + Number(stats.churned_count) > 0
            ? (Number(stats.churned_count) /
                (Number(stats.subscription_count) +
                  Number(stats.churned_count))) *
              100
            : 0,
        mrr: Number(stats.mrr) || 0,
        monthly_trend: trend.map((row) => ({
          month: row.month,
          revenue: Number(row.revenue) || 0,
          orders_count: Number(row.orders_count) || 0,
        })),
      };
    },
  );

  return NextResponse.json(data);
});
