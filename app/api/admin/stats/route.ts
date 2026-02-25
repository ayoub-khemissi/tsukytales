import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const [
    totalRevenue,
    totalOrders,
    lowStockProducts,
    totalCustomers,
    dailySales,
    totalProducts,
    pendingOrders,
  ] = await Promise.all([
    orderRepository.sumTotal(),
    orderRepository.count(),
    productRepository.countLowStock(),
    customerRepository.count(),
    orderRepository.getDailySales(7),
    productRepository.count(),
    orderRepository.count("status = ?", ["pending"]),
  ]);

  const recentOrdersResult = await orderRepository.findAndCountAll({
    orderBy: "createdAt DESC",
    page: 1,
    size: 5,
  });
  const recentOrdersRaw = recentOrdersResult.items;

  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o.id,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }));

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    dailySales,
    recentOrders,
  });
});
