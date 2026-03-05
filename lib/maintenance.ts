import type { SettingsRow } from "@/types/db.types";

import { pool } from "@/lib/db/connection";

let _cached: boolean | null = null;
let _cachedAt = 0;
const TTL_MS = 30_000; // 30 seconds

export async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();

  if (_cached !== null && now - _cachedAt < TTL_MS) return _cached;

  try {
    const [rows] = await pool.execute<SettingsRow[]>(
      "SELECT `value` FROM `settings` WHERE `key` = 'maintenance_mode' LIMIT 1",
    );

    _cached = rows[0]?.value === true;
  } catch {
    _cached = false;
  }

  _cachedAt = now;

  return _cached;
}

export function invalidateMaintenanceCache(): void {
  _cached = null;
  _cachedAt = 0;
}
