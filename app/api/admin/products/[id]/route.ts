import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";
import { invalidateMany } from "@/lib/cache";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const product = await productRepository.findById(parseInt(id));

  if (!product) throw new AppError("Produit introuvable", 404);

  return NextResponse.json(product);
});

export const PUT = withErrorHandler(async (req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const product = await productRepository.findById(parseInt(id));

  if (!product) throw new AppError("Produit introuvable", 404);

  const body = await req.json();

  if (body.is_active) {
    await productRepository.deactivateAll();
  }

  await productRepository.update(parseInt(id), body);
  const updated = await productRepository.findById(parseInt(id));

  await invalidateMany(
    "products:list",
    "product:slug",
    "product:active-subscription",
    "admin:stats",
  );

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const product = await productRepository.findById(parseInt(id));

  if (!product) throw new AppError("Produit introuvable", 404);

  await productRepository.update(parseInt(id), { is_deleted: true });

  await invalidateMany(
    "products:list",
    "product:slug",
    "product:active-subscription",
    "admin:stats",
  );

  return NextResponse.json({ success: true });
});
