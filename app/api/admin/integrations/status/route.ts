import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";

interface IntegrationResult {
  status: "ok" | "error";
  message: string;
}

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const results: Record<string, IntegrationResult> = {};

  // Stripe
  try {
    await stripe.accounts.retrieve();
    results.stripe = { status: "ok", message: "Connecté" };
  } catch (e) {
    results.stripe = { status: "error", message: (e instanceof Error ? e.message : String(e)).substring(0, 100) };
  }

  // Boxtal
  try {
    const creds = Buffer.from(`${process.env.BOXTAL_CLIENT_ID}:${process.env.BOXTAL_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://api.boxtal.com/iam/account-app/token", {
      method: "POST",
      headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/json" },
    });
    results.boxtal = tokenRes.ok
      ? { status: "ok", message: "Connecté" }
      : { status: "error", message: `HTTP ${tokenRes.status}` };
  } catch (e) {
    results.boxtal = { status: "error", message: (e instanceof Error ? e.message : String(e)).substring(0, 100) };
  }

  // Resend
  try {
    const resendRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    results.resend = resendRes.ok
      ? { status: "ok", message: "Connecté" }
      : { status: "error", message: `HTTP ${resendRes.status}` };
  } catch (e) {
    results.resend = { status: "error", message: (e instanceof Error ? e.message : String(e)).substring(0, 100) };
  }

  return NextResponse.json(results);
});
