import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { adminRepository } from "@/lib/repositories/admin.repository";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    throw new AppError(
      "Le mot de passe doit contenir au moins 8 caractères",
      400,
    );
  }

  const admin = await adminRepository.findByUsername("admin");

  if (!admin) throw new AppError("Administrateur introuvable", 404);

  const isMatch = await bcrypt.compare(currentPassword, admin.password);

  if (!isMatch) throw new AppError("Mot de passe actuel incorrect", 401);

  const hashed = await bcrypt.hash(newPassword, 12);

  await adminRepository.update(admin.id, { password: hashed });

  return NextResponse.json({ success: true });
});
