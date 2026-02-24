import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { getRelayPoints } from "@/lib/services/shipping.service";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async (req: NextRequest, context) => {
  const { zipCode } = await context!.params;
  const country = (req.nextUrl.searchParams.get("country") || "FR").toUpperCase();

  if (!zipCode || zipCode.length < 4 || zipCode.length > 10) {
    throw new AppError("Code postal invalide.", 400);
  }

  const result = await getRelayPoints(zipCode, 1.0, country);
  return NextResponse.json(result);
});
