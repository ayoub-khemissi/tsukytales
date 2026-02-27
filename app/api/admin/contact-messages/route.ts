import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { contactMessageRepository } from "@/lib/repositories/contact-message.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size =
    searchParams.get("size") || searchParams.get("limit") || undefined;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;

  const result = await contactMessageRepository.adminSearch({
    page,
    size,
    search,
    status,
    sortBy,
    sortOrder,
  });

  return NextResponse.json({
    items: result.rows,
    total: result.totalItems,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    limit: size ? +size : 10,
  });
});
