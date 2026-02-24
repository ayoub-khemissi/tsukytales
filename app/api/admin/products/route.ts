import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const products = await productRepository.findAll({
    orderBy: "createdAt DESC",
  });

  return NextResponse.json(products);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const id = await productRepository.create(body);
  const product = await productRepository.findById(id);

  return NextResponse.json(product, { status: 201 });
});
