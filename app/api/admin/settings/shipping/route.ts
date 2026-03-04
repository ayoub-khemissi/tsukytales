import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/helpers";
import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { invalidateByPrefix } from "@/lib/cache";
import {
  SHIPPING_DEFAULT_RATES,
  SHIPPING_DEFAULT_OFFER_CODES,
} from "@/lib/services/shipping.service";

const RATE_KEYS = [
  "shipping_rates_relay_fr",
  "shipping_rates_relay_eu",
  "shipping_rates_home_fr",
  "shipping_rates_home_eu1",
  "shipping_rates_home_eu2",
  "shipping_rates_home_om",
  "shipping_rates_home_world",
] as const;

const OFFER_CODE_KEYS = [
  "shipping_offer_relay_fr",
  "shipping_offer_relay_eu",
  "shipping_offer_home_fr",
  "shipping_offer_home_international",
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

  const allKeys = [...RATE_KEYS, ...OFFER_CODE_KEYS];
  const dbValues = await settingsRepository.getMultiple(allKeys);
  const result: Record<string, any> = {};

  for (const key of RATE_KEYS) {
    result[key] = dbValues[key] || SHIPPING_DEFAULT_RATES[key];
  }

  for (const key of OFFER_CODE_KEYS) {
    result[key] =
      dbValues[key] ||
      SHIPPING_DEFAULT_OFFER_CODES[key as keyof typeof SHIPPING_DEFAULT_OFFER_CODES];
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

  for (const key of OFFER_CODE_KEYS) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string" || body[key].trim().length === 0) {
        throw new AppError(`Format invalide pour ${key}`, 400);
      }
    }
  }

  for (const key of RATE_KEYS) {
    if (body[key] !== undefined) {
      await settingsRepository.set(key, body[key]);
    }
  }

  for (const key of OFFER_CODE_KEYS) {
    if (body[key] !== undefined) {
      await settingsRepository.set(key, body[key]);
    }
  }

  await invalidateByPrefix("shipping:rates");

  return NextResponse.json({ success: true });
});
