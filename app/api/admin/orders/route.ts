import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { pool } from "@/lib/db/connection";
import { cached } from "@/lib/cache";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size =
    searchParams.get("size") || searchParams.get("limit") || undefined;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const fulfillment_status =
    searchParams.get("fulfillment_status") || undefined;
  const payment_status = searchParams.get("payment_status") || undefined;
  const type = searchParams.get("type") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;

  const result = await orderRepository.adminSearch({
    page,
    size,
    search,
    status,
    fulfillment_status,
    payment_status,
    sortBy,
    sortOrder,
  });
  let { rows } = result;

  // Filter by type in memory (metadata is JSON)
  if (type && type !== "all") {
    // Only load preorder product IDs when needed
    let preorderProductIds: Set<number> | null = null;

    if (type === "preorder" || type === "standard") {
      const ids = await cached("products:preorder-ids", 300, async () => {
        const [rows] = await pool.execute<(RowDataPacket & { id: number })[]>(
          "SELECT id FROM products WHERE is_preorder = 1",
        );

        return rows.map((p) => p.id);
      });

      preorderProductIds = new Set(ids);
    }

    const isPreorder = (o: any) => {
      if (!preorderProductIds) return false;
      const orderItems =
        (typeof o.items === "string" ? JSON.parse(o.items) : o.items) || [];

      return orderItems.some(
        (i: any) => i.is_preorder || preorderProductIds!.has(i.product_id),
      );
    };

    rows = rows.filter((o) => {
      const meta = o.metadata as any;

      if (type === "subscription") return !!meta?.subscription;
      if (type === "preorder") return !meta?.subscription && isPreorder(o);
      if (type === "standard") return !meta?.subscription && !isPreorder(o);
      if (type === "wordpress") return !!meta?.wordpress_import;

      return true;
    });
  }

  return NextResponse.json({
    items: rows,
    total: result.totalItems,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    limit: size ? +size : 10,
  });
});
