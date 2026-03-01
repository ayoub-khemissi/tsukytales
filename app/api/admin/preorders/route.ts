import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { pool } from "@/lib/db/connection";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { getPagination } from "@/lib/utils/pagination";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const fulfillmentFilter = searchParams.get("fulfillment_status") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const pageParam = Number(searchParams.get("page") || 1);
  const limitParam = Number(searchParams.get("limit") || 20);

  const { limit, offset } = getPagination(pageParam, limitParam);

  // Get preorder product IDs
  const [preorderProducts] = await pool.execute<
    (RowDataPacket & { id: number })[]
  >("SELECT id FROM products WHERE is_preorder = 1");
  const preorderProductIds = preorderProducts.map((p) => p.id);

  if (preorderProductIds.length === 0) {
    return NextResponse.json({ items: [], total: 0 });
  }

  // Build conditions
  const conditions: string[] = [
    "(status != ? OR payment_status = ?)",
    "is_subscription_order = 0",
  ];
  const params: any[] = ["canceled", "refunded"];

  if (search) {
    const numericId = parseInt(search.replace(/[^0-9]/g, ""), 10);

    if (!isNaN(numericId) && numericId > 0) {
      conditions.push("(email LIKE ? OR id = ?)");
      params.push(`%${search}%`, numericId);
    } else {
      conditions.push("email LIKE ?");
      params.push(`%${search}%`);
    }
  }

  if (fulfillmentFilter && fulfillmentFilter !== "all") {
    conditions.push("fulfillment_status = ?");
    params.push(fulfillmentFilter);
  }

  const where = conditions.join(" AND ");

  // Sort
  const allowedSort: Record<string, string> = {
    order_number: "id",
    created_at: "createdAt",
    total: "total",
  };
  const col = (sortBy && allowedSort[sortBy]) || "createdAt";
  const dir = sortOrder === "asc" ? "ASC" : "DESC";

  // Count + fetch in parallel
  const [[countRow]] = await pool.execute<
    (RowDataPacket & { total: number })[]
  >(`SELECT COUNT(*) as total FROM orders WHERE ${where}`, params);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, display_id, customer_id, email, items, total, fulfillment_status, payment_status, createdAt
     FROM orders WHERE ${where} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)],
  );

  // Lookup customers by email for name + id
  const customers = await customerRepository.findAll();
  const customerByEmail = new Map(customers.map((c) => [c.email, c]));

  // Map to response shape, filtering items to preorder products only
  const preorderIdSet = new Set(preorderProductIds);
  const items = rows
    .map((o) => {
      const orderItems =
        (typeof o.items === "string" ? JSON.parse(o.items) : o.items) || [];
      const preorderItems = orderItems.filter(
        (i: any) => i.is_preorder || preorderIdSet.has(i.product_id),
      );

      if (preorderItems.length === 0) return null;

      const customer = customerByEmail.get(o.email);

      return {
        id: o.id,
        order_number: `TSK-${o.id}`,
        customer_id: customer?.id ?? null,
        customer_email: o.email,
        customer_name: customer
          ? [customer.first_name, customer.last_name]
              .filter(Boolean)
              .join(" ") || null
          : null,
        items: preorderItems.map((i: any) => ({
          product_id: i.product_id,
          product_name: i.name,
          quantity: i.quantity,
        })),
        total: Number(o.total),
        status: o.fulfillment_status,
        payment_status: o.payment_status,
        created_at: o.createdAt,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items, total: countRow.total });
});
