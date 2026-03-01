import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/helpers";
import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { invalidateByPrefix } from "@/lib/cache";

const SETTINGS_KEY = "show_product_detail";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const value = await settingsRepository.get<boolean>(SETTINGS_KEY);

  return NextResponse.json({ show_product_detail: value ?? true });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { show_product_detail } = await req.json();

  if (typeof show_product_detail !== "boolean") {
    throw new AppError(
      "Le champ show_product_detail doit être un booléen.",
      400,
    );
  }

  await settingsRepository.set(SETTINGS_KEY, show_product_detail);

  await invalidateByPrefix("products:list");

  return NextResponse.json({ show_product_detail });
});
