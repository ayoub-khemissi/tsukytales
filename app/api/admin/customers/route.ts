import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size = searchParams.get("size") || undefined;
  const search = searchParams.get("search") || undefined;

  const result = await customerRepository.adminSearch({ page, size, search });
  return NextResponse.json(result);
});
