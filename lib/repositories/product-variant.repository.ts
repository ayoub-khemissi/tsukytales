import type { ProductVariantRow } from "@/types/db.types";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { cached, cacheKey } from "@/lib/cache";

class ProductVariantRepository extends BaseRepository<ProductVariantRow> {
  constructor() {
    super("product_variants");
  }

  async findByProductId(productId: number): Promise<ProductVariantRow[]> {
    return cached(cacheKey("variants:product", productId), 900, async () => {
      const [rows] = await pool.execute<ProductVariantRow[]>(
        "SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC",
        [productId],
      );

      return rows;
    });
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
