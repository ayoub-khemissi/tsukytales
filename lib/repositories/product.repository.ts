import type { ProductRow } from "@/types/db.types";

import { ResultSetHeader } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";

class ProductRepository extends BaseRepository<ProductRow> {
  constructor() {
    super("products");
  }

  async findBySlug(slug: string): Promise<ProductRow | null> {
    const [rows] = await pool.execute<ProductRow[]>(
      "SELECT * FROM products WHERE slug = ? LIMIT 1",
      [slug],
    );

    return rows[0] ?? null;
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
    const like = `%${query}%`;

    return this.findAndCountAll({
      where: "name LIKE ? OR description LIKE ?",
      params: [like, like],
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

  async decrementStock(id: number, amount: number = 1): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ? AND stock > 0",
      [amount, id],
    );

    return result.affectedRows > 0;
  }
}

export const productRepository = new ProductRepository();
