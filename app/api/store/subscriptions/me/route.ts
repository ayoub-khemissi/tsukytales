import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { stripe } from "@/lib/services/payment.service";

export const GET = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) return NextResponse.json({ active: false });

  const scheduleId = customer.metadata?.subscription_schedule_id;

  if (!scheduleId) return NextResponse.json({ active: false });

  try {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const productId = customer.metadata?.subscription_product_id;
    const product = productId
      ? await productRepository.findById(parseInt(productId as string))
      : null;

    // Get price from Stripe
    const priceId = schedule.phases?.[0]?.items?.[0]?.price;
    let totalPerQuarter = product ? Number(product.subscription_price) : 35;
    let shippingCost = 0;

    if (typeof priceId === "string") {
      try {
        const stripePrice = await stripe.prices.retrieve(priceId);

        totalPerQuarter = (stripePrice.unit_amount || 0) / 100;
        shippingCost =
          totalPerQuarter - (product ? Number(product.subscription_price) : 35);
      } catch {
        /* ignore */
      }
    }

    const shippingInfo = (customer.metadata?.subscription_shipping ||
      {}) as Record<string, unknown>;
    const skippedPhases = (customer.metadata?.subscription_skipped ||
      []) as string[];
    const currentYear = new Date().getFullYear();
    const skipsThisYear = skippedPhases.filter((s: string) =>
      s.startsWith(String(currentYear)),
    ).length;

    return NextResponse.json({
      active: schedule.status === "active" || schedule.status === "not_started",
      status: schedule.status,
      product_name: product?.name,
      product_price: product ? Number(product.subscription_price) : null,
      shipping_cost: shippingCost,
      total_per_quarter: totalPerQuarter,
      shipping_method: shippingInfo.method,
      skips_remaining: Math.max(0, 1 - skipsThisYear),
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
    return NextResponse.json({ active: false });
  }
});
