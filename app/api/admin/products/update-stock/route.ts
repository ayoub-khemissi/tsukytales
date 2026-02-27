import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";
import { invalidateMany } from "@/lib/cache";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { id, stock } = await req.json();

  await productRepository.updateStock(id, stock);

  await invalidateMany("products:list", "admin:stats");

  return NextResponse.json({ success: true });
});
