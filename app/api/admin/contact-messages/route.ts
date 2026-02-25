import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { contactMessageRepository } from "@/lib/repositories/contact-message.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size = searchParams.get("size") || undefined;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const result = await contactMessageRepository.adminSearch({
    page,
    size,
    search,
    status,
  });

  return NextResponse.json({
    items: result.rows,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
  });
});
