import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size = searchParams.get("size") || undefined;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;

  const result = await orderRepository.adminSearch({ page, size, search, status });
  let { rows } = result;

  // Filter by type in memory (metadata is JSON)
  if (type && type !== "all") {
    rows = rows.filter((o) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = o.metadata as any;
      if (type === "subscription") return !!meta?.subscription;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (type === "preorder") return !meta?.subscription && o.items?.some((i: any) => i.is_preorder);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (type === "standard") return !meta?.subscription && !o.items?.some((i: any) => i.is_preorder);
      if (type === "wordpress") return !!meta?.wordpress_import;
      return true;
    });
  }

  return NextResponse.json({
    items: rows,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
  });
});
