import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const order = await orderRepository.findById(parseInt(id));

  if (!order) throw new AppError("Commande introuvable", 404);

  const notes =
    (order.metadata?.internal_notes as Array<Record<string, unknown>>) || [];

  return NextResponse.json({ ...order, notes });
});

export const PATCH = withErrorHandler(async (req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const order = await orderRepository.findById(parseInt(id));

  if (!order) throw new AppError("Commande introuvable", 404);

  const { items } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Items invalides", 400);
  }

  for (const item of items) {
    if (!item.name || item.price == null || item.quantity == null) {
      throw new AppError(
        "Chaque article doit avoir un nom, un prix et une quantité",
        400,
      );
    }
  }

  await orderRepository.update(parseInt(id), {
    items: JSON.stringify(items),
  });

  return NextResponse.json({ success: true });
});
