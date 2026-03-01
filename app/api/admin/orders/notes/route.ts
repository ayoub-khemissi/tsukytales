import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { orderId, note } = await req.json();

  if (!note || typeof note !== "string" || !note.trim()) {
    throw new AppError("Note vide", 400);
  }

  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);

  const meta = { ...(order.metadata || {}) };
  const notes = (meta.internal_notes as Array<Record<string, unknown>>) || [];

  notes.push({
    id: Date.now(),
    note: note.trim(),
    createdAt: new Date().toISOString(),
  });

  meta.internal_notes = notes;

  await orderRepository.update(order.id, {
    metadata: JSON.stringify(meta),
  });

  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { orderId, noteId } = await req.json();
  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);

  const meta = { ...(order.metadata || {}) };
  const notes = (meta.internal_notes as Array<Record<string, unknown>>) || [];

  meta.internal_notes = notes.filter((n) => n.id !== noteId);

  await orderRepository.update(order.id, {
    metadata: JSON.stringify(meta),
  });

  return NextResponse.json({ success: true });
});
