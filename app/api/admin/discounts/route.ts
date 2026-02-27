import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { invalidateByPrefix } from "@/lib/cache";
import { validateSort } from "@/lib/utils/sort";

const SORTABLE_COLUMNS = ["code", "usage_count", "ends_at"];

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? 1;
  const size = searchParams.get("limit") ?? 20;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  const conditions: string[] = [];
  const params: string[] = [];

  if (search) {
    conditions.push("code LIKE ?");
    params.push(`%${search.toUpperCase()}%`);
  }
  if (status && status !== "all") {
    if (status === "active") {
      conditions.push("is_disabled = 0");
    } else if (status === "inactive") {
      conditions.push("is_disabled = 1");
    }
  }

  const where = conditions.length ? conditions.join(" AND ") : undefined;
  const sort = validateSort(sortBy, sortOrder, SORTABLE_COLUMNS);
  const orderBy = sort?.orderBy ?? "createdAt DESC";

  const data = await discountRepository.findAndCountAll({
    where,
    params: params.length ? params : undefined,
    orderBy,
    page,
    size,
  });

  const items = data.items.map((d) => {
    const rule = typeof d.rule === "string" ? JSON.parse(d.rule) : d.rule;

    return {
      id: d.id,
      code: d.code,
      type: rule?.type ?? "percentage",
      value: rule?.value ?? 0,
      usage_count: d.usage_count,
      max_usage: d.usage_limit,
      expires_at: d.ends_at,
      is_active: !d.is_disabled,
    };
  });

  return NextResponse.json({
    items,
    total: data.totalItems,
    page: data.currentPage,
    limit: Number(size),
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();

  const data: Record<string, unknown> = {
    code: body.code,
    rule: JSON.stringify({ type: body.type, value: Number(body.value) }),
  };

  if (body.max_usage != null) data.usage_limit = Number(body.max_usage);
  if (body.expires_at) data.ends_at = body.expires_at;

  const id = await discountRepository.create(data);
  const discount = await discountRepository.findById(id);

  await invalidateByPrefix("discount:code");

  return NextResponse.json(discount, { status: 201 });
});
