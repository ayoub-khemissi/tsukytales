import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/helpers";
import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { invalidateMaintenanceCache } from "@/lib/maintenance";

const SETTINGS_KEY = "maintenance_mode";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const value = await settingsRepository.get<boolean>(SETTINGS_KEY);

  return NextResponse.json({ maintenance_mode: value ?? false });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { maintenance_mode } = await req.json();

  if (typeof maintenance_mode !== "boolean") {
    throw new AppError("Le champ maintenance_mode doit être un booléen.", 400);
  }

  await settingsRepository.set(SETTINGS_KEY, maintenance_mode);

  invalidateMaintenanceCache();

  return NextResponse.json({ maintenance_mode });
});
