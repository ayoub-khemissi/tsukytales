import { RowDataPacket } from "mysql2";

import { pool } from "@/lib/db/connection";
import { BaseRepository } from "./base.repository";
import { getPagination, getPagingData } from "@/lib/utils/pagination";
import type { CustomerRow } from "@/types/db.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async adminSearch(options: { page?: number | string; size?: number | string; search?: string }) {
    const { limit, offset } = getPagination(options.page, options.size);
    const conditions: string[] = [];
    const params: Params = [];

    if (options.search) {
      conditions.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
      const like = `%${options.search}%`;
      params.push(like, like, like);
    }

    const where = conditions.length ? conditions.join(" AND ") : "1=1";

    const [[countRow]] = await pool.execute<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) as total FROM customers WHERE ${where}`,
      params,
    );
    const [rows] = await pool.execute<CustomerRow[]>(
      `SELECT id, first_name, last_name, email, has_account, metadata, preferences, createdAt, updatedAt FROM customers WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return getPagingData(rows, countRow.total, options.page, limit);
  }

  async updateMetadata(id: number, metadata: Record<string, unknown>): Promise<boolean> {
    return this.update(id, { metadata: JSON.stringify(metadata) });
  }

  async updatePreferences(id: number, preferences: Record<string, unknown>): Promise<boolean> {
    return this.update(id, { preferences: JSON.stringify(preferences) });
  }
}

export const customerRepository = new CustomerRepository();
