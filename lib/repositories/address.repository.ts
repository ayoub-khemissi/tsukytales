import { ResultSetHeader, PoolConnection } from "mysql2/promise";

import { pool } from "@/lib/db/connection";
import { BaseRepository } from "./base.repository";
import type { AddressRow } from "@/types/db.types";

class AddressRepository extends BaseRepository<AddressRow> {
  constructor() {
    super("addresses");
  }

  async findByCustomerId(customerId: number): Promise<AddressRow[]> {
    const [rows] = await pool.execute<AddressRow[]>(
      "SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, createdAt DESC",
      [customerId],
    );
    return rows;
  }

  async findOneByCustomer(id: number, customerId: number): Promise<AddressRow | null> {
    const [rows] = await pool.execute<AddressRow[]>(
      "SELECT * FROM addresses WHERE id = ? AND customer_id = ? LIMIT 1",
      [id, customerId],
    );
    return rows[0] ?? null;
  }

  async resetDefaults(customerId: number, connection?: PoolConnection): Promise<void> {
    const conn = connection ?? pool;
    await conn.execute<ResultSetHeader>(
      "UPDATE addresses SET is_default = 0 WHERE customer_id = ?",
      [customerId],
    );
  }

  async resetDefaultsExcept(customerId: number, excludeId: number, connection?: PoolConnection): Promise<void> {
    const conn = connection ?? pool;
    await conn.execute<ResultSetHeader>(
      "UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND id != ?",
      [customerId, excludeId],
    );
  }

  async countByCustomer(customerId: number): Promise<number> {
    return this.count("customer_id = ?", [customerId]);
  }
}

export const addressRepository = new AddressRepository();
