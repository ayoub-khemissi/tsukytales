import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import * as orderService from "@/lib/services/order.service";

export const POST = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await requireCustomer();
  const { id } = await context!.params;

  const result = await orderService.confirmOrder(
    parseInt(id),
    session.user.customerId!,
  );

  return NextResponse.json(result);
});
