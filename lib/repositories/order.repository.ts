import type { OrderRow } from "@/types/db.types";

import { RowDataPacket } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { getPagination, getPagingData } from "@/lib/utils/pagination";

type Params = any[];

class OrderRepository extends BaseRepository<OrderRow> {
  constructor() {
    super("orders");
  }

  async sumTotal(): Promise<number> {
    const [[row]] = await pool.execute<(RowDataPacket & { total: number })[]>(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders",
    );

    return Number(row.total) || 0;
  }

  async getDailySales(
    days: number = 7,
  ): Promise<{ date: string; total: number }[]> {
    const [rows] = await pool.execute<
      (RowDataPacket & { date: string; total: number })[]
    >(
      `SELECT DATE(createdAt) as date, COALESCE(SUM(total), 0) as total
       FROM orders
       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(createdAt)
       ORDER BY date ASC`,
      [days],
    );

    return rows;
  }

  async adminSearch(options: {
    page?: number | string;
    size?: number | string;
    search?: string;
    status?: string;
    fulfillment_status?: string;
    payment_status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { limit, offset } = getPagination(options.page, options.size);
    const conditions: string[] = [];
    const params: Params = [];

    if (options.status && options.status !== "all") {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options.fulfillment_status && options.fulfillment_status !== "all") {
      conditions.push("fulfillment_status = ?");
      params.push(options.fulfillment_status);
    }
    if (options.payment_status && options.payment_status !== "all") {
      conditions.push("payment_status = ?");
      params.push(options.payment_status);
    }
    if (options.search) {
      const numericId = parseInt(options.search.replace(/[^0-9]/g, ""), 10);

      if (!isNaN(numericId) && numericId > 0) {
        conditions.push("(email LIKE ? OR id = ?)");
        params.push(`%${options.search}%`, numericId);
      } else {
        conditions.push("email LIKE ?");
        params.push(`%${options.search}%`);
      }
    }

    const where = conditions.length ? conditions.join(" AND ") : "1=1";

    const allowedSort = ["id", "total", "createdAt"];
    let orderClause = "createdAt DESC";

    if (options.sortBy && allowedSort.includes(options.sortBy)) {
      const dir = options.sortOrder === "asc" ? "ASC" : "DESC";

      orderClause = `${options.sortBy} ${dir}`;
    }

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(`SELECT COUNT(*) as total FROM orders WHERE ${where}`, params);
    const [rows] = await pool.execute<OrderRow[]>(
      `SELECT * FROM orders WHERE ${where} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)],
    );

    return {
      ...getPagingData(rows, countRow.total, options.page, limit),
      rows,
    };
  }

  async findByIds(ids: number[]): Promise<OrderRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await pool.execute<OrderRow[]>(
      `SELECT * FROM orders WHERE id IN (${placeholders}) ORDER BY createdAt DESC`,
      ids,
    );

    return rows;
  }

  async findByCustomerIdOrEmail(
    customerId: number,
    email: string,
    options?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      size?: number;
    },
  ) {
    const { limit, offset } = getPagination(options?.page, options?.size);
    const conditions: string[] = ["(customer_id = ? OR LOWER(email) = ?)"];
    const params: Params = [customerId, email.toLowerCase().trim()];

    if (options?.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options?.dateFrom) {
      conditions.push("createdAt >= ?");
      params.push(options.dateFrom);
    }
    if (options?.dateTo) {
      conditions.push("createdAt <= ?");
      params.push(options.dateTo);
    }

    const where = conditions.join(" AND ");

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(`SELECT COUNT(*) as total FROM orders WHERE ${where}`, params);
    const [rows] = await pool.execute<OrderRow[]>(
      `SELECT * FROM orders WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)],
    );

    return getPagingData(rows, countRow.total, options?.page, limit);
  }

  async updateCustomerIdByEmail(
    email: string,
    customerId: number,
  ): Promise<void> {
    await pool.execute(
      "UPDATE orders SET customer_id = ? WHERE LOWER(email) = ? AND (customer_id IS NULL OR customer_id != ?)",
      [customerId, email.toLowerCase().trim(), customerId],
    );
  }

  async getSalesHistory(
    months: number = 6,
  ): Promise<{ month: string; revenue: number; count: number }[]> {
    const [rows] = await pool.execute<
      (RowDataPacket & { month: string; revenue: number; count: number })[]
    >(
      `SELECT
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as count
      FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH) AND payment_status = 'captured'
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month DESC`,
      [months],
    );

    return rows;
  }

  async getFinancialReport(months: number = 6) {
    return this.getSalesHistory(months);
  }

  async findByInvoiceId(invoiceId: string): Promise<OrderRow | null> {
    const [rows] = await pool.execute<OrderRow[]>(
      "SELECT * FROM orders WHERE stripe_invoice_id = ? LIMIT 1",
      [invoiceId],
    );

    return rows[0] ?? null;
  }

  async findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<OrderRow | null> {
    const [rows] = await pool.execute<OrderRow[]>(
      "SELECT * FROM orders WHERE payment_intent_id = ? LIMIT 1",
      [paymentIntentId],
    );

    return rows[0] ?? null;
  }

  async findByShippingOrderId(
    shippingOrderId: string,
  ): Promise<OrderRow | null> {
    const [rows] = await pool.execute<OrderRow[]>(
      "SELECT * FROM orders WHERE shipping_order_id = ? LIMIT 1",
      [shippingOrderId],
    );

    return rows[0] ?? null;
  }

  async findByShippingOrderIdOrTracking(
    value: string,
  ): Promise<OrderRow | null> {
    const [rows] = await pool.execute<OrderRow[]>(
      "SELECT * FROM orders WHERE shipping_order_id = ? OR tracking_number = ? LIMIT 1",
      [value, value],
    );

    return rows[0] ?? null;
  }
}

export const orderRepository = new OrderRepository();
