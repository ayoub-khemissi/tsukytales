import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";
import { transport } from "@/lib/mail";

interface IntegrationResult {
  connected: boolean;
  error?: string;
}

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const results: Record<string, IntegrationResult> = {};

  // Stripe
  try {
    await stripe.accounts.retrieve();
    results.stripe = { connected: true };
  } catch (e) {
    results.stripe = {
      connected: false,
      error: (e instanceof Error ? e.message : String(e)).substring(0, 100),
    };
  }

  // Boxtal
  try {
    const creds = Buffer.from(
      `${process.env.BOXTAL_CLIENT_ID}:${process.env.BOXTAL_CLIENT_SECRET}`,
    ).toString("base64");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const tokenRes = await fetch(
      "https://api.boxtal.com/iam/account-app/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);
    results.boxtal = tokenRes.ok
      ? { connected: true }
      : { connected: false, error: `HTTP ${tokenRes.status}` };
  } catch (e) {
    results.boxtal = {
      connected: false,
      error: (e instanceof Error ? e.message : String(e)).substring(0, 100),
    };
  }

  // Mail (SMTP)
  try {
    await Promise.race([
      transport.verify(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout")), 10000),
      ),
    ]);
    results.mail = { connected: true };
  } catch (e) {
    results.mail = {
      connected: false,
      error: (e instanceof Error ? e.message : String(e)).substring(0, 100),
    };
  }

  return NextResponse.json(results);
});
