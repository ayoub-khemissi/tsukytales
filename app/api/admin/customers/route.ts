import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size =
    searchParams.get("size") || searchParams.get("limit") || undefined;
  const search = searchParams.get("search") || undefined;
  const has_account = searchParams.get("has_account") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;

  const result = await customerRepository.adminSearch({
    page,
    size,
    search,
    has_account,
    sortBy,
    sortOrder,
  });

  return NextResponse.json({
    items: result.items,
    total: result.totalItems,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    limit: size ? +size : 10,
  });
});
