import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { AppError } from "@/lib/errors/app-error";

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const discount = await discountRepository.findById(parseInt(id));
  if (!discount) throw new AppError("Code promo introuvable", 404);

  await discountRepository.delete(parseInt(id));
  return NextResponse.json({ success: true });
});
