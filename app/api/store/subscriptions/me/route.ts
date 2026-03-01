import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { stripe } from "@/lib/services/payment.service";
import { pool } from "@/lib/db/connection";
import { settingsRepository } from "@/lib/repositories/settings.repository";

export const GET = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) return NextResponse.json({ active: false });

  const scheduleId = customer.metadata?.subscription_schedule_id;

  if (!scheduleId) return NextResponse.json({ active: false });

  const shippingInfo = (customer.metadata?.subscription_shipping ||
    {}) as Record<string, unknown>;
  const skippedPhases = (customer.metadata?.subscription_skipped ||
    []) as string[];

  // Try Stripe first
  try {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const productId = customer.metadata?.subscription_product_id;
    const product = productId
      ? await productRepository.findById(parseInt(productId as string))
      : null;

    const productPrice = product
      ? Number(product.subscription_price ?? product.price)
      : 35;

    const showProductDetail =
      (await settingsRepository.get<boolean>("show_product_detail")) ?? true;

    return NextResponse.json({
      active: schedule.status === "active" || schedule.status === "not_started",
      status: schedule.status,
      product_name: product?.name ?? null,
      product_price: productPrice,
      is_preorder: product?.is_preorder ?? false,
      show_product_detail: showProductDetail,
      product_image: product?.image ?? null,
      product_images: product?.images ?? null,
      product_description: product?.description ?? null,
      total_per_quarter: productPrice,
      shipping_method: shippingInfo.method,
      skipped_phases: skippedPhases,
      phases: schedule.phases.map((p) => ({
        start: new Date(p.start_date * 1000).toISOString().split("T")[0],
        end: new Date(p.end_date * 1000).toISOString().split("T")[0],
        skipped: skippedPhases.includes(
          new Date(p.start_date * 1000).toISOString().split("T")[0],
        ),
      })),
    });
  } catch {
    // Stripe unavailable — fallback to local DB data
  }

  // Fallback: build response from local orders + subscription product
  const [subOrders] = await pool.execute<
    (RowDataPacket & { createdAt: Date })[]
  >(
    `SELECT createdAt FROM orders WHERE customer_id = ? AND is_subscription_order = 1 ORDER BY createdAt DESC LIMIT 1`,
    [customer.id],
  );

  if (subOrders.length === 0) return NextResponse.json({ active: false });

  // Find subscription product from customer metadata
  const subProductId = customer.metadata?.subscription_product_id;
  const product = subProductId
    ? await productRepository.findById(parseInt(subProductId as string))
    : null;
  const subscriptionPrice = product
    ? Number(product.subscription_price ?? product.price)
    : null;
  const dates: string[] =
    (await settingsRepository.get<string[]>("subscription_dates")) ?? [];
  const showProductDetail =
    (await settingsRepository.get<boolean>("show_product_detail")) ?? true;

  return NextResponse.json({
    active: true,
    status: "active",
    product_name: product?.name ?? null,
    product_price: subscriptionPrice,
    is_preorder: product?.is_preorder ?? false,
    show_product_detail: showProductDetail,
    product_image: product?.image ?? null,
    product_images: product?.images ?? null,
    product_description: product?.description ?? null,
    total_per_quarter: subscriptionPrice,
    shipping_method: shippingInfo.method ?? null,
    skipped_phases: skippedPhases,
    phases: dates.map((d) => ({
      start: d,
      end: d,
      skipped: skippedPhases.includes(d),
    })),
  });
});
