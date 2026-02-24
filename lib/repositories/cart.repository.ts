import type { CartRow } from "@/types/db.types";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";

class CartRepository extends BaseRepository<CartRow> {
  constructor() {
    super("carts");
  }

  async findByIdWithItems(id: string): Promise<CartRow | null> {
    const [rows] = await pool.execute<CartRow[]>(
      "SELECT * FROM carts WHERE id = ? LIMIT 1",
      [id],
    );

    return rows[0] ?? null;
  }

  async findByCustomerId(customerId: number): Promise<CartRow | null> {
    const [rows] = await pool.execute<CartRow[]>(
      "SELECT * FROM carts WHERE customer_id = ? AND completed_at IS NULL ORDER BY createdAt DESC LIMIT 1",
      [customerId],
    );

    return rows[0] ?? null;
  }
}

export const cartRepository = new CartRepository();
