import { createHash } from "crypto";

import { redis, isCacheAvailable } from "./client";

import { logger } from "@/lib/utils/logger";

/**
 * Build a readable cache key. Objects/arrays are hashed (SHA-256 truncated).
 */
export function cacheKey(prefix: string, ...parts: unknown[]): string {
  const segments = parts.map((p) => {
    if (p === null || p === undefined) return "_";
    if (typeof p === "object") {
      return createHash("sha256")
        .update(JSON.stringify(p))
        .digest("hex")
        .slice(0, 12);
    }

    return String(p);
  });

  return [prefix, ...segments].join(":");
}

/**
 * Read-through cache. Falls back to fetcher transparently when Redis is unavailable.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!isCacheAvailable()) return fetcher();

  try {
    const raw = await redis!.get(key);

    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Cache read failed — fall through to DB
  }

  const data = await fetcher();

  // SET fire-and-forget
  try {
    redis!.set(key, JSON.stringify(data), "EX", ttlSeconds).catch(() => {});
  } catch {
    // ignore write failure
  }

  return data;
}

/**
 * Delete a single exact key.
 */
export async function invalidate(key: string): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    await redis!.del(key);
  } catch {
    logger.warn(`[Cache] Failed to invalidate key: ${key}`);
  }
}

/**
 * Delete all keys matching a prefix using SCAN (never KEYS).
 * Keys are deleted in batches of 100.
 */
export async function invalidateByPrefix(prefix: string): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    // keyPrefix "tsuky:" is added by ioredis, so we SCAN for the full pattern
    const pattern = `tsuky:${prefix}*`;
    let cursor = "0";

    do {
      const [next, keys] = await redis!.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );

      cursor = next;

      if (keys.length > 0) {
        // Keys returned by SCAN include the prefix, but ioredis DEL also prepends keyPrefix
        // We need to strip "tsuky:" from the keys before passing to del()
        const stripped = keys.map((k) => k.replace(/^tsuky:/, ""));

        await redis!.del(...stripped);
      }
    } while (cursor !== "0");
  } catch {
    logger.warn(`[Cache] Failed to invalidate prefix: ${prefix}`);
  }
}

/**
 * Invalidate multiple prefixes in parallel.
 */
export async function invalidateMany(...prefixes: string[]): Promise<void> {
  await Promise.all(prefixes.map(invalidateByPrefix));
}
