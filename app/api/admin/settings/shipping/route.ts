import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/helpers";
import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { invalidateByPrefix } from "@/lib/cache";
import { SHIPPING_DEFAULT_RATES } from "@/lib/services/shipping.service";

const RATE_KEYS = [
  "shipping_rates_relay_fr",
  "shipping_rates_relay_eu",
  "shipping_rates_home_fr",
  "shipping_rates_home_eu1",
  "shipping_rates_home_eu2",
  "shipping_rates_home_om",
  "shipping_rates_home_world",
] as const;

interface RateTier {
  maxWeight: number;
  price: number;
}

function validateRates(rates: unknown): rates is RateTier[] {
  if (!Array.isArray(rates) || rates.length === 0) return false;

  return rates.every(
    (r) =>
      typeof r === "object" &&
      r !== null &&
      typeof r.maxWeight === "number" &&
      r.maxWeight > 0 &&
      typeof r.price === "number" &&
      r.price >= 0,
  );
}

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const dbRates = await settingsRepository.getMultiple([...RATE_KEYS]);
  const result: Record<string, RateTier[]> = {};

  for (const key of RATE_KEYS) {
    result[key] = dbRates[key] || SHIPPING_DEFAULT_RATES[key];
  }

  return NextResponse.json(result);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();

  for (const key of RATE_KEYS) {
    if (body[key] !== undefined) {
      if (!validateRates(body[key])) {
        throw new AppError(`Format invalide pour ${key}`, 400);
      }
    }
  }

  for (const key of RATE_KEYS) {
    if (body[key] !== undefined) {
      await settingsRepository.set(key, body[key]);
    }
  }

  await invalidateByPrefix("shipping:rates");

  return NextResponse.json({ success: true });
});
