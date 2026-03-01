import type { CustomerRow } from "@/types/db.types";

import { RowDataPacket } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { cached, cacheKey, invalidateByPrefix } from "@/lib/cache";
import { getPagination, getPagingData } from "@/lib/utils/pagination";

type Params = any[];

class CustomerRepository extends BaseRepository<CustomerRow> {
  constructor() {
    super("customers");
  }

  async findByEmail(email: string): Promise<CustomerRow | null> {
    const normalized = email.toLowerCase().trim();

    return cached(cacheKey("customer:email", normalized), 1800, async () => {
      const [rows] = await pool.execute<CustomerRow[]>(
        "SELECT * FROM customers WHERE email = ? LIMIT 1",
        [normalized],
      );

      return rows[0] ?? null;
    });
  }

  async findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<CustomerRow | null> {
    return cached(
      cacheKey("customer:stripe", stripeCustomerId),
      1800,
      async () => {
        const [rows] = await pool.execute<CustomerRow[]>(
          "SELECT * FROM customers WHERE stripe_customer_id = ? LIMIT 1",
          [stripeCustomerId],
        );

        return rows[0] ?? null;
      },
    );
  }

  async findByEmails(emails: string[]): Promise<CustomerRow[]> {
    if (emails.length === 0) return [];
    const placeholders = emails.map(() => "?").join(",");
    const [rows] = await pool.execute<CustomerRow[]>(
      `SELECT * FROM customers WHERE email IN (${placeholders})`,
      emails,
    );

    return rows;
  }

  async adminSearch(options: {
    page?: number | string;
    size?: number | string;
    search?: string;
    has_account?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { limit, offset } = getPagination(options.page, options.size);
    const conditions: string[] = [];
    const params: Params = [];

    if (options.search) {
      conditions.push(
        "(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)",
      );
      const like = `%${options.search}%`;

      params.push(like, like, like);
    }

    if (options.has_account && options.has_account !== "all") {
      conditions.push("has_account = ?");
      params.push(options.has_account === "yes" ? 1 : 0);
    }

    const where = conditions.length ? conditions.join(" AND ") : "1=1";

    const allowedSort = ["email", "createdAt", "orders_count", "total_spent"];
    let orderClause = "c.createdAt DESC";

    if (options.sortBy && allowedSort.includes(options.sortBy)) {
      const dir = options.sortOrder === "asc" ? "ASC" : "DESC";
      const col = ["orders_count", "total_spent"].includes(options.sortBy)
        ? options.sortBy
        : `c.${options.sortBy}`;

      orderClause = `${col} ${dir}`;
    }

    // Prefix conditions with table alias
    const aliasedWhere = where
      .replace(/\b(email)\b/g, "c.$1")
      .replace(/\b(first_name)\b/g, "c.$1")
      .replace(/\b(last_name)\b/g, "c.$1")
      .replace(/\b(has_account)\b/g, "c.$1");

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(
      `SELECT COUNT(*) as total FROM customers c WHERE ${aliasedWhere}`,
      params,
    );
    const [rows] = await pool.execute<CustomerRow[]>(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.has_account, c.metadata, c.createdAt, c.updatedAt,
              COUNT(o.id) AS orders_count,
              COALESCE(SUM(o.total), 0) AS total_spent
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       WHERE ${aliasedWhere}
       GROUP BY c.id
       ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)],
    );

    return getPagingData(rows, countRow.total, options.page, limit);
  }

  async updateMetadata(
    id: number,
    metadata: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.update(id, {
      metadata: JSON.stringify(metadata),
    });

    // Invalidate customer cache
    await Promise.all([
      invalidateByPrefix("customer:email"),
      invalidateByPrefix("customer:stripe"),
    ]);

    return result;
  }

  async getOrCreateGuest(email: string): Promise<CustomerRow> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) return existing;

    const id = await this.create({
      email: normalizedEmail,
      password: "",
      has_account: false,
      first_name: null,
      last_name: null,
      metadata: JSON.stringify({}),
    });

    // Invalidate email cache for the new customer
    await invalidateByPrefix("customer:email");

    const customer = await this.findById(id);

    if (!customer) throw new Error("Failed to create guest customer");

    return customer;
  }
}

export const customerRepository = new CustomerRepository();
