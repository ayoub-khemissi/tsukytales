import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { getShippingRates } from "@/lib/services/shipping.service";
import { EUROPEAN_COUNTRIES } from "@/lib/constants/countries";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const weight = parseFloat(req.nextUrl.searchParams.get("weight") || "1.0");
  const rawCountry = req.nextUrl.searchParams.get("country") || "FR";
  const country = (EUROPEAN_COUNTRIES as readonly string[]).includes(rawCountry)
    ? rawCountry
    : "FR";
  const rates = await getShippingRates(weight, country);

  return NextResponse.json(rates);
});
