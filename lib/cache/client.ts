import Redis from "ioredis";

import { env } from "@/lib/utils/env";
import { logger } from "@/lib/utils/logger";

declare global {
  var _redisClient: Redis | undefined;
  var _redisHealthy: boolean;
}

function createClient(): Redis | null {
  if (!env.REDIS_URL) return null;

  if (globalThis._redisClient) return globalThis._redisClient;

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    keyPrefix: "tsuky:",
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying

      return Math.min(times * 200, 2000);
    },
  });

  client.on("connect", () => {
    globalThis._redisHealthy = true;
    logger.info("[Redis] Connected");
  });

  client.on("ready", () => {
    globalThis._redisHealthy = true;
  });

  client.on("error", (err) => {
    globalThis._redisHealthy = false;
    logger.warn(`[Redis] Error: ${err.message}`);
  });

  client.on("close", () => {
    globalThis._redisHealthy = false;
  });

  // Connect in background — never block app startup
  client.connect().catch(() => {
    globalThis._redisHealthy = false;
  });

  globalThis._redisClient = client;
  globalThis._redisHealthy = false;

  return client;
}

export const redis = createClient();

export function isCacheAvailable(): boolean {
  return !!redis && globalThis._redisHealthy === true;
}
