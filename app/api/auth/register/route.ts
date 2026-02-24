import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { withErrorHandler } from "@/lib/errors/handler";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { first_name, last_name, email, password } = await req.json();

  if (!email || !password)
    throw new AppError("Email et mot de passe requis", 400);
  if (password.length < 8) throw new AppError("8 caractères minimum", 400);

  const existing = await customerRepository.findByEmail(email);

  if (existing) throw new AppError("Un compte existe déjà avec cet email", 409);

  const hashed = await bcrypt.hash(password, 12);
  const id = await customerRepository.create({
    first_name: first_name || null,
    last_name: last_name || null,
    email: email.toLowerCase().trim(),
    password: hashed,
    has_account: true,
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
});
