import { RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "@/lib/db/connection";
import { getPagination, getPagingData } from "@/lib/utils/pagination";

// mysql2 expects specific param types — we use this alias for convenience

type Params = any[];

export class BaseRepository<T extends RowDataPacket> {
  constructor(protected readonly table: string) {}

  async findById(id: number | string): Promise<T | null> {
    const [rows] = await pool.execute<T[]>(
      `SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows[0] ?? null;
  }

  async findAll(options?: {
    where?: string;
    params?: Params;
    orderBy?: string;
  }): Promise<T[]> {
    let sql = `SELECT * FROM \`${this.table}\``;
    const params: Params = options?.params ?? [];

    if (options?.where) sql += ` WHERE ${options.where}`;
    if (options?.orderBy) sql += ` ORDER BY ${options.orderBy}`;

    const [rows] = await pool.execute<T[]>(sql, params);

    return rows;
  }

  async findAndCountAll(options?: {
    where?: string;
    params?: Params;
    orderBy?: string;
    page?: number | string;
    size?: number | string;
  }): Promise<{
    items: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { limit, offset } = getPagination(options?.page, options?.size);

    let countSql = `SELECT COUNT(*) as total FROM \`${this.table}\``;
    let dataSql = `SELECT * FROM \`${this.table}\``;
    const params: Params = options?.params ?? [];

    if (options?.where) {
      countSql += ` WHERE ${options.where}`;
      dataSql += ` WHERE ${options.where}`;
    }
    if (options?.orderBy) dataSql += ` ORDER BY ${options.orderBy}`;
    dataSql += ` LIMIT ? OFFSET ?`;

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(countSql, params);
    const [rows] = await pool.execute<T[]>(dataSql, [
      ...params,
      String(limit),
      String(offset),
    ]);

    return getPagingData(rows, countRow.total, options?.page, limit);
  }

  async count(where?: string, params?: Params): Promise<number> {
    let sql = `SELECT COUNT(*) as total FROM \`${this.table}\``;

    if (where) sql += ` WHERE ${where}`;

    const [[row]] = await pool.execute<(RowDataPacket & { total: number })[]>(
      sql,
      params ?? [],
    );

    return row.total;
  }

  async create(data: Record<string, unknown>): Promise<number> {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(data) as Params;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`${this.table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${placeholders})`,
      values,
    );

    return result.insertId;
  }

  async update(
    id: number | string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const keys = Object.keys(data);

    if (keys.length === 0) return false;

    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = [...Object.values(data), id] as Params;

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE \`${this.table}\` SET ${setClause} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  async delete(id: number | string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM \`${this.table}\` WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  }
}
