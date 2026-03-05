import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { pool } from "@/lib/db/connection";
import { invalidate, cacheKey } from "@/lib/cache";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { token, password } = await req.json();

  if (!token || !password) {
    throw new AppError("Token et mot de passe requis", 400);
  }
  if (password.length < 8) {
    throw new AppError("8 caractères minimum", 400);
  }

  // Find valid token
  const [rows] = await pool.execute<(RowDataPacket & { email: string })[]>(
    "SELECT email FROM password_reset_tokens WHERE token = ? AND expires > NOW() LIMIT 1",
    [token],
  );

  if (!rows[0]) {
    throw new AppError("Lien invalide ou expiré", 400);
  }

  const { email } = rows[0];

  // Hash new password
  const hashed = await bcrypt.hash(password, 12);

  // Update customer password
  const customer = await customerRepository.findByEmail(email);

  if (!customer) {
    throw new AppError("Compte introuvable", 404);
  }

  await pool.execute("UPDATE customers SET password = ? WHERE id = ?", [
    hashed,
    customer.id,
  ]);

  // Delete all tokens for this email
  await pool.execute("DELETE FROM password_reset_tokens WHERE email = ?", [
    email,
  ]);

  // Invalidate cache
  await invalidate(cacheKey("customer:email", email.toLowerCase().trim()));

  return NextResponse.json({ success: true });
});
