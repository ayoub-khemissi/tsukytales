import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { auth } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { invalidateMany } from "@/lib/cache";
import * as orderService from "@/lib/services/order.service";
import { createOrderSchema } from "@/lib/validators/order.schema";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await rateLimit(req, { windowMs: 60_000, max: 10 });
  const session = await auth();
  const body = await req.json();

  const validated = createOrderSchema.parse(body);

  const result = await orderService.createOrder(
    session?.user?.customerId ?? null,
    session?.user?.email ?? null,
    validated,
  );

  await invalidateMany(
    "products:list",
    "admin:stats",
    "admin:financial",
    "discount:code",
  );

  return NextResponse.json({ success: true, ...result }, { status: 201 });
});
