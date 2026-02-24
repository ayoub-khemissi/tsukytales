import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const customer = await customerRepository.findById(parseInt(id));
  if (!customer) throw new AppError("Client introuvable", 404);

  const orders = await orderRepository.findAll({
    where: "customer_id = ?",
    params: [parseInt(id)],
    orderBy: "createdAt DESC",
  });

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Exclude password from response
  const { password: _, ...customerData } = customer;

  return NextResponse.json({
    ...customerData,
    orders: orders.slice(0, 20),
    totalSpent: totalSpent.toFixed(2),
  });
});
