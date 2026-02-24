import type { DiscountRow } from "@/types/db.types";

import { ResultSetHeader } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";

class DiscountRepository extends BaseRepository<DiscountRow> {
  constructor() {
    super("discounts");
  }

  async findByCode(code: string): Promise<DiscountRow | null> {
    const [rows] = await pool.execute<DiscountRow[]>(
      "SELECT * FROM discounts WHERE code = ? LIMIT 1",
      [code.toUpperCase()],
    );

    return rows[0] ?? null;
  }

  async incrementUsage(id: number): Promise<void> {
    await pool.execute<ResultSetHeader>(
      "UPDATE discounts SET usage_count = usage_count + 1 WHERE id = ?",
      [id],
    );
  }
}

export const discountRepository = new DiscountRepository();
