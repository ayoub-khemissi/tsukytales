import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { auth } from "@/lib/auth/auth";
import * as orderService from "@/lib/services/order.service";

export const POST = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await auth();
  const { id } = await context!.params;

  const result = await orderService.confirmOrder(
    parseInt(id),
    session?.user?.customerId ?? null,
  );

  return NextResponse.json(result);
});
