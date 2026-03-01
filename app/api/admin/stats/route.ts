import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { cached } from "@/lib/cache";
import { orderRepository } from "@/lib/repositories/order.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const stats = await cached("admin:stats", 300, async () => {
    const [
      totalRevenue,
      orderStats,
      lowStockProducts,
      totalCustomers,
      dailySales,
      totalProducts,
    ] = await Promise.all([
      orderRepository.sumTotal(),
      orderRepository.getOrderStats(),
      productRepository.countLowStock(),
      customerRepository.count(),
      orderRepository.getDailySales(7),
      productRepository.count(),
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

    return {
      totalRevenue,
      totalOrders: orderStats.total,
      totalCustomers,
      totalProducts,
      pendingOrders: orderStats.pending,
      lowStockProducts,
      dailySales,
      recentOrders,
    };
  });

  return NextResponse.json(stats);
});
