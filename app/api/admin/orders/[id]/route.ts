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

  return NextResponse.json(order);
});
