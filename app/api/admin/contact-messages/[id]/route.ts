import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { contactMessageRepository } from "@/lib/repositories/contact-message.repository";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const message = await contactMessageRepository.findById(parseInt(id));

  if (!message) throw new AppError("Message introuvable", 404);

  return NextResponse.json(message);
});

export const PUT = withErrorHandler(async (req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const body = await req.json();

  const message = await contactMessageRepository.findById(parseInt(id));

  if (!message) throw new AppError("Message introuvable", 404);

  const updateData: Record<string, unknown> = {};

  if (body.status) updateData.status = body.status;

  await contactMessageRepository.update(parseInt(id), updateData);

  const updated = await contactMessageRepository.findById(parseInt(id));

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const deleted = await contactMessageRepository.delete(parseInt(id));

  if (!deleted) throw new AppError("Message introuvable", 404);

  return NextResponse.json({ success: true });
});
