import type { AdminRow } from "@/types/db.types";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { withErrorHandler } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/app-error";
import { pool } from "@/lib/db/connection";
import { getAdminSession } from "@/lib/auth/admin-session";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { password } = await req.json();

  if (!password) throw new AppError("Mot de passe requis", 400);

  const [rows] = await pool.execute<AdminRow[]>(
    "SELECT * FROM admins WHERE username = ? LIMIT 1",
    ["admin"],
  );
  const admin = rows[0];

  if (!admin) throw new AppError("Identifiants invalides", 401);

  const valid = await bcrypt.compare(password, admin.password);

  if (!valid) throw new AppError("Identifiants invalides", 401);

  const session = await getAdminSession();

  session.isLoggedIn = true;
  session.adminId = admin.id;
  session.email = "admin@tsukytales.com";
  await session.save();

  return NextResponse.json({ success: true });
});
