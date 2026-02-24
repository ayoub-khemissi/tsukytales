import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import * as orderService from "@/lib/services/order.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { searchParams } = req.nextUrl;

  const data = await orderService.listCustomerOrders(
    session.user.customerId!,
    session.user.email,
    {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      size: searchParams.get("size") ? parseInt(searchParams.get("size")!) : undefined,
      status: searchParams.get("status") ?? undefined,
      dateFrom: searchParams.get("date_from") ?? undefined,
      dateTo: searchParams.get("date_to") ?? undefined,
    },
  );

  return NextResponse.json(data);
});
