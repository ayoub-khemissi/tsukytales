import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/helpers";
import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { invalidateByPrefix } from "@/lib/cache";
import { syncAllSchedules } from "@/lib/services/subscription-sync.service";

const SETTINGS_KEY = "subscription_dates";

function isValidISODate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const dates = (await settingsRepository.get<string[]>(SETTINGS_KEY)) ?? [];

  return NextResponse.json({ dates: dates.sort() });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { dates } = await req.json();

  if (!Array.isArray(dates)) {
    throw new AppError("Le champ dates doit être un tableau.", 400);
  }

  const today = new Date().toISOString().split("T")[0];

  for (const d of dates) {
    if (typeof d !== "string" || !isValidISODate(d)) {
      throw new AppError(`Date invalide : ${d}`, 400);
    }
    if (d < today) {
      throw new AppError(`La date ${d} est dans le passé.`, 400);
    }
  }

  const unique = Array.from(new Set(dates));

  if (unique.length !== dates.length) {
    throw new AppError("Des doublons ont été détectés.", 400);
  }

  const sorted = unique.sort();

  await settingsRepository.set(SETTINGS_KEY, sorted);

  await invalidateByPrefix("products:list");

  const sync = await syncAllSchedules(sorted);

  return NextResponse.json({ dates: sorted, sync });
});
