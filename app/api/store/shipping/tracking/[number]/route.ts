import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { getTrackingInfo } from "@/lib/services/shipping.service";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  const { number } = await context!.params;
  const data = await getTrackingInfo(number);

  return NextResponse.json(data);
});
