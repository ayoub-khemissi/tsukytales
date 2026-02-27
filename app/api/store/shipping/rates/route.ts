import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { getShippingRates } from "@/lib/services/shipping.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const weight = parseFloat(req.nextUrl.searchParams.get("weight") || "1.0");
  const country = req.nextUrl.searchParams.get("country") || "FR";
  const rates = await getShippingRates(weight, country);

  return NextResponse.json(rates);
});
