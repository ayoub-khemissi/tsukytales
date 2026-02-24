import { NextRequest } from "next/server";

import { AppError } from "@/lib/errors/app-error";

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  });
}, 5 * 60_000);

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {},
) {
  const { windowMs = 15 * 60_000, max = 100 } = options;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const route = req.nextUrl.pathname;
  const key = `${ip}:${route}`;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count++;

  if (entry.count > max) {
    throw new AppError("Trop de requêtes, veuillez réessayer plus tard", 429);
  }
}
