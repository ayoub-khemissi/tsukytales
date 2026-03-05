import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { pool } from "@/lib/db/connection";
import { sendPasswordReset } from "@/lib/mail";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ success: true }); // don't leak existence
  }

  const customer = await customerRepository.findByEmail(email);

  if (!customer || !customer.has_account) {
    // Always return success to avoid email enumeration
    return NextResponse.json({ success: true });
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing tokens for this email
  await pool.execute("DELETE FROM password_reset_tokens WHERE email = ?", [
    customer.email,
  ]);

  // Insert new token
  await pool.execute(
    "INSERT INTO password_reset_tokens (email, token, expires) VALUES (?, ?, ?)",
    [customer.email, token, expires],
  );

  // Send email
  await sendPasswordReset({
    email: customer.email,
    token,
  });

  return NextResponse.json({ success: true });
});
