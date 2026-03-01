import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";
import { invalidateMany } from "@/lib/cache";
import { validateSort } from "@/lib/utils/sort";

const SORTABLE_COLUMNS = ["name", "price", "stock"];

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") || undefined;
  const size =
    searchParams.get("size") || searchParams.get("limit") || undefined;
  const search = searchParams.get("search") || undefined;
  const type = searchParams.get("type") || undefined;
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  const conditions: string[] = ["(is_deleted = 0 OR is_deleted IS NULL)"];
  const params: string[] = [];

  if (search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (type && type !== "all") {
    if (type === "preorder") {
      conditions.push("is_preorder = 1");
    } else if (type === "standard") {
      conditions.push("(is_preorder = 0 OR is_preorder IS NULL)");
    }
  }

  const where = conditions.length ? conditions.join(" AND ") : undefined;
  const sort = validateSort(sortBy, sortOrder, SORTABLE_COLUMNS);
  const orderBy = sort?.orderBy ?? "createdAt DESC";

  const result = await productRepository.findAndCountAll({
    where,
    params: params.length ? params : undefined,
    orderBy,
    page,
    size,
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

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();

  if (body.is_active) {
    await productRepository.deactivateAll();
  }

  const id = await productRepository.create(body);
  const product = await productRepository.findById(id);

  await invalidateMany(
    "products:list",
    "product:slug",
    "product:active-subscription",
    "admin:stats",
  );

  return NextResponse.json(product, { status: 201 });
});
