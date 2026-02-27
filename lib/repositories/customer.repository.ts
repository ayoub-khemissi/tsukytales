import type { CustomerRow } from "@/types/db.types";

import { RowDataPacket } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { getPagination, getPagingData } from "@/lib/utils/pagination";

type Params = any[];

class CustomerRepository extends BaseRepository<CustomerRow> {
  constructor() {
    super("customers");
  }

  async findByEmail(email: string): Promise<CustomerRow | null> {
    const [rows] = await pool.execute<CustomerRow[]>(
      "SELECT * FROM customers WHERE email = ? LIMIT 1",
      [email.toLowerCase().trim()],
    );

    return rows[0] ?? null;
  }

  async findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<CustomerRow | null> {
    const [rows] = await pool.execute<CustomerRow[]>(
      "SELECT * FROM customers WHERE stripe_customer_id = ? LIMIT 1",
      [stripeCustomerId],
    );

    return rows[0] ?? null;
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

    const allowedSort = ["email", "createdAt"];
    let orderClause = "createdAt DESC";

    if (options.sortBy && allowedSort.includes(options.sortBy)) {
      const dir = options.sortOrder === "asc" ? "ASC" : "DESC";

      orderClause = `${options.sortBy} ${dir}`;
    }

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(`SELECT COUNT(*) as total FROM customers WHERE ${where}`, params);
    const [rows] = await pool.execute<CustomerRow[]>(
      `SELECT id, first_name, last_name, email, has_account, metadata, createdAt, updatedAt FROM customers WHERE ${where} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)],
    );

    return getPagingData(rows, countRow.total, options.page, limit);
  }

  async updateMetadata(
    id: number,
    metadata: Record<string, unknown>,
  ): Promise<boolean> {
    return this.update(id, { metadata: JSON.stringify(metadata) });
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

    const customer = await this.findById(id);

    if (!customer) throw new Error("Failed to create guest customer");

    return customer;
  }
}

export const customerRepository = new CustomerRepository();
