import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";

export const GET = withErrorHandler(async () => {
  return NextResponse.json({
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});
