import type { ProductRow } from "@/types/db.types";

import { ResultSetHeader } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { cached, cacheKey } from "@/lib/cache";

class ProductRepository extends BaseRepository<ProductRow> {
  constructor() {
    super("products");
  }

  async findBySlug(slug: string): Promise<ProductRow | null> {
    return cached(cacheKey("product:slug", slug), 1800, async () => {
      const [rows] = await pool.execute<ProductRow[]>(
        "SELECT * FROM products WHERE slug = ? LIMIT 1",
        [slug],
      );

      return rows[0] ?? null;
    });
  }

  async search(
    query: string,
    page?: number,
    size?: number,
  ): Promise<{
    items: ProductRow[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Use FULLTEXT index (idx_products_search) for faster search
    const booleanQuery = query
      .trim()
      .split(/\s+/)
      .map((w) => `+${w}*`)
      .join(" ");

    return this.findAndCountAll({
      where:
        "MATCH(name, description) AGAINST(? IN BOOLEAN MODE) AND (is_deleted = 0 OR is_deleted IS NULL)",
      params: [booleanQuery],
      orderBy: "createdAt DESC",
      page,
      size,
    });
  }

  async updateStock(id: number, stock: number): Promise<boolean> {
    return this.update(id, { stock });
  }

  async countLowStock(threshold: number = 10): Promise<number> {
    return this.count("stock < ?", [threshold]);
  }

  async deactivateAll(): Promise<void> {
    await pool.execute("UPDATE products SET is_active = 0 WHERE is_active = 1");
  }

  async findActiveSubscriptionProduct(): Promise<ProductRow | null> {
    const [rows] = await pool.execute<ProductRow[]>(
      "SELECT * FROM products WHERE is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY createdAt DESC LIMIT 1",
    );

    return rows[0] ?? null;
  }

  async decrementStock(id: number, amount: number = 1): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ? AND stock > 0",
      [amount, id],
    );

    return result.affectedRows > 0;
  }
}

export const productRepository = new ProductRepository();
