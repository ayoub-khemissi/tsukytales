import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { discountRepository } from "@/lib/repositories/discount.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const discounts = await discountRepository.findAll({
    orderBy: "createdAt DESC",
  });

  return NextResponse.json(discounts);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();

  // Serialize rule as JSON string for MySQL
  if (body.rule && typeof body.rule === "object") {
    body.rule = JSON.stringify(body.rule);
  }

  const id = await discountRepository.create(body);
  const discount = await discountRepository.findById(id);

  return NextResponse.json(discount, { status: 201 });
});
