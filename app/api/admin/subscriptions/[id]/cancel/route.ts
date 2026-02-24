import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";

export const POST = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;

  await stripe.subscriptions.update(id, { cancel_at_period_end: true });

  return NextResponse.json({
    success: true,
    message: "Abonnement annulé en fin de période",
  });
});
