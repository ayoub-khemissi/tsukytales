import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { getRelayPoints } from "@/lib/services/shipping.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const zip = req.nextUrl.searchParams.get("zip") || "";
  const country = req.nextUrl.searchParams.get("country") || "FR";
  const data = await getRelayPoints(zip, 1.0, country);

  return NextResponse.json(data);
});
