import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { pool } from "@/lib/db/connection";
import { invalidate, cacheKey } from "@/lib/cache";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { current_password, new_password } = await req.json();

  if (!current_password || !new_password) {
    throw new AppError("Tous les champs sont requis", 400);
  }
  if (new_password.length < 8) {
    throw new AppError("8 caractères minimum", 400);
  }

  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) {
    throw new AppError("Compte introuvable", 404);
  }

  // Verify current password
  const valid = await bcrypt.compare(current_password, customer.password);

  if (!valid) {
    throw new AppError("Mot de passe actuel incorrect", 401);
  }

  // Hash new password
  const hashed = await bcrypt.hash(new_password, 12);

  await pool.execute("UPDATE customers SET password = ? WHERE id = ?", [
    hashed,
    customer.id,
  ]);

  // Invalidate cache
  await invalidate(
    cacheKey("customer:email", customer.email.toLowerCase().trim()),
  );

  return NextResponse.json({ success: true });
});
