import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { rateLimit } from "@/lib/middleware/rate-limit";
import * as orderService from "@/lib/services/order.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await rateLimit(req, { windowMs: 60_000, max: 10 });
  const session = await requireCustomer();
  const body = await req.json();

  const result = await orderService.createOrder(
    session.user.customerId!,
    session.user.email,
    body,
  );

  return NextResponse.json({ success: true, ...result }, { status: 201 });
});
