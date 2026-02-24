import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { productRepository } from "@/lib/repositories/product.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? undefined;
  const size = searchParams.get("size") ?? undefined;

  const data = await productRepository.findAndCountAll({
    orderBy: "createdAt DESC",
    page,
    size,
  });

  return NextResponse.json(data);
});
