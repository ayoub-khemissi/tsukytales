import type { DiscountRow } from "@/types/db.types";

import { ResultSetHeader } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { cached, cacheKey } from "@/lib/cache";

class DiscountRepository extends BaseRepository<DiscountRow> {
  constructor() {
    super("discounts");
  }

  async findByCode(code: string): Promise<DiscountRow | null> {
    return cached(
      cacheKey("discount:code", code.toUpperCase()),
      300,
      async () => {
        const [rows] = await pool.execute<DiscountRow[]>(
          "SELECT * FROM discounts WHERE code = ? LIMIT 1",
          [code.toUpperCase()],
        );

        return rows[0] ?? null;
      },
    );
  }

  // NOT cached — depends on NOW() and usage_count
  async findValidByCode(code: string): Promise<DiscountRow | null> {
    const [rows] = await pool.execute<DiscountRow[]>(
      `SELECT * FROM discounts WHERE code = ? AND is_disabled = 0
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       AND (usage_limit IS NULL OR usage_count < usage_limit)
       LIMIT 1`,
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
