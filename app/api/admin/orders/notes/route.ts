import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { id, notes } = await req.json();
  const order = await orderRepository.findById(id);

  if (!order) throw new AppError("Commande introuvable", 404);

  await orderRepository.update(order.id, {
    metadata: JSON.stringify({
      ...(order.metadata || {}),
      internal_notes: notes,
    }),
  });

  return NextResponse.json({ success: true });
});
