import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";
import { AppError } from "@/lib/errors/app-error";

export const PUT = withErrorHandler(async (req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const product = await productRepository.findById(parseInt(id));

  if (!product) throw new AppError("Produit introuvable", 404);

  const body = await req.json();

  await productRepository.update(parseInt(id), body);
  const updated = await productRepository.findById(parseInt(id));

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const product = await productRepository.findById(parseInt(id));

  if (!product) throw new AppError("Produit introuvable", 404);

  await productRepository.delete(parseInt(id));

  return NextResponse.json({ success: true });
});
