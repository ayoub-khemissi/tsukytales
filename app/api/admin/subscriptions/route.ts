import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";
import { customerRepository } from "@/lib/repositories/customer.repository";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
    status: "active",
    expand: ["data.customer"],
  });

  const customers = await customerRepository.findAll();
  const customerMap: Record<string, typeof customers[0]> = {};
  customers.forEach((c) => {
    const stripeId = c.metadata?.stripe_customer_id;
    if (stripeId && typeof stripeId === "string") {
      customerMap[stripeId] = c;
    }
  });

  const result = subscriptions.data.map((sub) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subAny = sub as any;
    const customer = typeof sub.customer === "object" && sub.customer !== null ? sub.customer : null;
    return {
      id: sub.id,
      status: sub.status,
      current_period_end: subAny.current_period_end,
      amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: sub.items.data[0]?.price?.currency || "eur",
      customer_email: customer && "email" in customer ? (customer as { email: string }).email || "" : "",
      customer: customer && "id" in customer ? customerMap[(customer as { id: string }).id] || null : null,
      cancel_at_period_end: subAny.cancel_at_period_end,
    };
  });

  return NextResponse.json({ subscriptions: result, total: result.length });
});
