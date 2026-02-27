import { pool } from "@/lib/db/connection";
import { cached, cacheKey, invalidate, invalidateByPrefix } from "@/lib/cache";
import { SettingsRow } from "@/types/db.types";

class SettingsRepository {
  async get<T = any>(key: string): Promise<T | null> {
    return cached(cacheKey("settings", key), 3600, async () => {
      const [rows] = await pool.execute<SettingsRow[]>(
        "SELECT `value` FROM `settings` WHERE `key` = ? LIMIT 1",
        [key],
      );

      if (!rows[0]) return null;

      return rows[0].value as T;
    });
  }

  async set(key: string, value: unknown): Promise<void> {
    await pool.execute(
      "INSERT INTO `settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
      [key, JSON.stringify(value)],
    );

    await Promise.all([
      invalidate(cacheKey("settings", key)),
      invalidateByPrefix("settings:multi"),
    ]);
  }

  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    if (keys.length === 0) return {};

    return cached(cacheKey("settings:multi", keys), 3600, async () => {
      const placeholders = keys.map(() => "?").join(", ");
      const [rows] = await pool.execute<SettingsRow[]>(
        `SELECT \`key\`, \`value\` FROM \`settings\` WHERE \`key\` IN (${placeholders})`,
        keys,
      );

      const result: Record<string, any> = {};

      for (const row of rows) {
        result[row.key] = row.value;
      }

      return result;
    });
  }
}

export const settingsRepository = new SettingsRepository();
