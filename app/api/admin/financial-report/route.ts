import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const months = parseInt(req.nextUrl.searchParams.get("months") || "6") || 6;
  const report = await orderRepository.getFinancialReport(months);

  return NextResponse.json({ months: report });
});
