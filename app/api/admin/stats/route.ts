import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const [revenue, ordersCount, lowStock, newCustomers, salesHistory] =
    await Promise.all([
      orderRepository.sumTotal(),
      orderRepository.count(),
      productRepository.countLowStock(),
      customerRepository.count(),
      orderRepository.getDailySales(7),
    ]);

  // Order type breakdown
  const allOrders = await orderRepository.findAll();

  const subCount = allOrders.filter(
    (o) => (o.metadata as any)?.subscription,
  ).length;
  const preorderCount = allOrders.filter(
    (o) =>
      !(o.metadata as any)?.subscription &&
      o.items?.some((i: any) => i.is_preorder),
  ).length;
  const standardCount = allOrders.length - subCount - preorderCount;

  return NextResponse.json({
    revenue,
    ordersCount,
    lowStock,
    newCustomers,
    salesHistory,
    orderTypes: {
      subscription: subCount,
      preorder: preorderCount,
      standard: standardCount,
    },
  });
});
