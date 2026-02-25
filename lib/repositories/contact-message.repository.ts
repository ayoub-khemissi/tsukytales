import type { ContactMessageRow } from "@/types/db.types";

import { RowDataPacket } from "mysql2";

import { BaseRepository } from "./base.repository";

import { pool } from "@/lib/db/connection";
import { getPagination, getPagingData } from "@/lib/utils/pagination";

type Params = any[];

class ContactMessageRepository extends BaseRepository<ContactMessageRow> {
  constructor() {
    super("contact_messages");
  }

  async adminSearch(options: {
    page?: number | string;
    size?: number | string;
    search?: string;
    status?: string;
  }) {
    const { limit, offset } = getPagination(options.page, options.size);
    const conditions: string[] = [];
    const params: Params = [];

    if (options.status && options.status !== "all") {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options.search) {
      conditions.push("(name LIKE ? OR email LIKE ? OR subject LIKE ?)");
      const search = `%${options.search}%`;

      params.push(search, search, search);
    }

    const where = conditions.length ? conditions.join(" AND ") : "1=1";

    const [[countRow]] = await pool.execute<
      (RowDataPacket & { total: number })[]
    >(`SELECT COUNT(*) as total FROM contact_messages WHERE ${where}`, params);
    const [rows] = await pool.execute<ContactMessageRow[]>(
      `SELECT * FROM contact_messages WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      ...getPagingData(rows, countRow.total, options.page, limit),
      rows,
    };
  }
}

export const contactMessageRepository = new ContactMessageRepository();
