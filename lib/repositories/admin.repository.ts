import type { AdminRow } from "@/types/db.types";

import { BaseRepository } from "./base.repository";

class AdminRepository extends BaseRepository<AdminRow> {
  constructor() {
    super("admins");
  }

  async findByUsername(username: string): Promise<AdminRow | null> {
    const [rows] = await (
      await import("@/lib/db/connection")
    ).pool.execute<AdminRow[]>(
      "SELECT * FROM admins WHERE username = ? LIMIT 1",
      [username],
    );

    return rows[0] ?? null;
  }
}

export const adminRepository = new AdminRepository();
