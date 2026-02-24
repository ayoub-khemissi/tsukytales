import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const orders = await orderRepository.findAll({
    where: "status != ?",
    params: ["canceled"],
    orderBy: "createdAt DESC",
  });

  const preorders = orders.filter(
    (o) =>
      !(o.metadata as any)?.subscription &&
      o.items?.some((i: any) => i.is_preorder),
  );

  return NextResponse.json(preorders);
});
