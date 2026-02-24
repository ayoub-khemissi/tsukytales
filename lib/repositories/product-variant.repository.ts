import { pool } from "@/lib/db/connection";
import { BaseRepository } from "./base.repository";
import type { ProductVariantRow } from "@/types/db.types";

class ProductVariantRepository extends BaseRepository<ProductVariantRow> {
  constructor() {
    super("product_variants");
  }

  async findByProductId(productId: number): Promise<ProductVariantRow[]> {
    const [rows] = await pool.execute<ProductVariantRow[]>(
      "SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC",
      [productId],
    );
    return rows;
  }

  async findBySku(sku: string): Promise<ProductVariantRow | null> {
    const [rows] = await pool.execute<ProductVariantRow[]>(
      "SELECT * FROM product_variants WHERE sku = ? LIMIT 1",
      [sku],
    );
    return rows[0] ?? null;
  }
}

export const productVariantRepository = new ProductVariantRepository();
