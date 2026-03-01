import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { stripe } from "@/lib/services/payment.service";
import { pool } from "@/lib/db/connection";
import { settingsRepository } from "@/lib/repositories/settings.repository";

interface SubscriptionOrder {
  id: number;
  total: number;
  createdAt: Date | string;
  stripe_invoice_id: string | null;
}

interface SubscriptionInvoice {
  date: string;
  amount: number;
  invoice_pdf: string | null;
  hosted_url: string | null;
}

async function getHistory(
  customerId: number,
): Promise<{ orders: SubscriptionOrder[]; invoices: SubscriptionInvoice[] }> {
  // Subscription orders (history)
  const [rows] = await pool.execute<(RowDataPacket & SubscriptionOrder)[]>(
    `SELECT id, total, createdAt, stripe_invoice_id
     FROM orders
     WHERE customer_id = ? AND is_subscription_order = 1
     ORDER BY createdAt DESC`,
    [customerId],
  );

  const orders = rows.map((r) => ({
    id: r.id,
    total: Number(r.total),
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
    stripe_invoice_id: r.stripe_invoice_id,
  }));

  // Fetch last 6 Stripe invoices for receipts
  const invoiceIds = orders
    .map((o) => o.stripe_invoice_id)
    .filter((id): id is string => !!id)
    .slice(0, 6);

  const invoices: SubscriptionInvoice[] = [];

  if (invoiceIds.length > 0) {
    const results = await Promise.allSettled(
      invoiceIds.map((id) => stripe.invoices.retrieve(id)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const inv = result.value;

        invoices.push({
          date: new Date((inv.created || 0) * 1000).toISOString(),
          amount: (inv.amount_paid || 0) / 100,
          invoice_pdf: inv.invoice_pdf ?? null,
          hosted_url: inv.hosted_invoice_url ?? null,
        });
      }
    }
  }

  return { orders, invoices };
}

export const GET = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer)
    return NextResponse.json({
      active: false,
      history: [],
      invoices: [],
    });

  const scheduleId = customer.metadata?.subscription_schedule_id;
  const shippingInfo = (customer.metadata?.subscription_shipping ||
    {}) as Record<string, unknown>;
  const skippedPhases = (customer.metadata?.subscription_skipped ||
    []) as string[];

  // Always fetch history + invoices
  const { orders: history, invoices } = await getHistory(customer.id);

  // No active subscription
  if (!scheduleId) {
    return NextResponse.json({
      active: false,
      history,
      invoices,
    });
  }

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
      history,
      invoices,
    });
  } catch {
    // Stripe unavailable — fallback to local DB data
  }

  // Fallback: build response from local orders + subscription product
  if (history.length === 0) {
    return NextResponse.json({
      active: false,
      history,
      invoices,
    });
  }

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
    history,
    invoices,
  });
});
