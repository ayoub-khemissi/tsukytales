import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";
import { orderRepository } from "@/lib/repositories/order.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { logger } from "@/lib/utils/logger";
import { env } from "@/lib/utils/env";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const statusFilter = searchParams.get("status") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const pageParam = Number(searchParams.get("page") || 1);
  const limitParam = Number(searchParams.get("limit") || 20);

  // 1. Get subscription orders from DB
  const orders = await orderRepository.findAll({
    where: "is_subscription_order = 1",
    orderBy: "createdAt DESC",
  });

  // 2. Group by customer email (latest order per customer)
  const byEmail = new Map<string, (typeof orders)[0][]>();

  for (const o of orders) {
    const list = byEmail.get(o.email) || [];

    list.push(o);
    byEmail.set(o.email, list);
  }

  // 3. Try to fetch Stripe statuses for known subscription IDs
  const stripeStatuses = new Map<
    string,
    {
      status: string;
      current_period_end: number | null;
      cancel_at_period_end: boolean;
    }
  >();

  const stripeSubIds = orders
    .map(
      (o) => (o.metadata as any)?.stripe_subscription_id as string | undefined,
    )
    .filter((id): id is string => !!id && !id.startsWith("sub_test_"));

  for (const subId of Array.from(new Set(stripeSubIds))) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);

      stripeStatuses.set(subId, {
        status: sub.status,
        current_period_end: (sub as any).current_period_end ?? null,
        cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
      });
    } catch {
      logger.warn(`[Subscriptions] Could not fetch Stripe sub ${subId}`);
    }
  }

  // 4. Build response items (one per customer)
  const customers = await customerRepository.findAll();
  const customerByEmail = new Map(customers.map((c) => [c.email, c]));

  let items = Array.from(byEmail.entries()).map(([email, customerOrders]) => {
    const latest = customerOrders[0];
    const meta = latest.metadata as any;
    const stripeSubId = meta?.stripe_subscription_id as string | undefined;
    const stripeInfo = stripeSubId ? stripeStatuses.get(stripeSubId) : null;
    const customer = customerByEmail.get(email);

    // Determine status: Stripe source of truth if available, else derive from DB
    let status: string;

    if (stripeInfo) {
      status = stripeInfo.status;
    } else if (latest.status === "canceled") {
      status = "canceled";
    } else {
      status = "active";
    }

    // Build Stripe Dashboard URL if account ID and subscription ID are available
    const stripeDashboardUrl =
      env.STRIPE_ACCOUNT_ID && stripeSubId && !stripeSubId.startsWith("db_")
        ? `https://dashboard.stripe.com/${env.STRIPE_ACCOUNT_ID}/subscriptions/${stripeSubId}`
        : null;

    const total_spent = customerOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const oldest = customerOrders[customerOrders.length - 1];

    return {
      id: stripeSubId || `db_${latest.id}`,
      customer_id: customer?.id ?? null,
      customer_email: email,
      customer_name: customer
        ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
          null
        : null,
      plan_name: "Box Littéraire Tsuky Tales",
      status,
      stripe_status: stripeInfo?.status ?? null,
      stripe_dashboard_url: stripeDashboardUrl,
      next_billing_date: stripeInfo?.current_period_end
        ? new Date(stripeInfo.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: stripeInfo?.cancel_at_period_end ?? false,
      orders_count: customerOrders.length,
      last_order_date: latest.createdAt,
      amount: Number(latest.total),
      total_spent,
      created_at: oldest.createdAt,
    };
  });

  // 5. In-memory filters
  if (search) {
    const s = search.toLowerCase();

    items = items.filter(
      (i) =>
        i.customer_email.toLowerCase().includes(s) ||
        (i.customer_name && i.customer_name.toLowerCase().includes(s)),
    );
  }
  if (statusFilter && statusFilter !== "all") {
    items = items.filter((i) => i.status === statusFilter);
  }

  // 6. In-memory sorting
  const allowedSort = [
    "customer_email",
    "amount",
    "last_order_date",
    "total_spent",
    "created_at",
  ];

  if (sortBy && allowedSort.includes(sortBy)) {
    const dir = sortOrder === "asc" ? 1 : -1;

    items.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return av.localeCompare(bv) * dir;

      return (av - bv) * dir;
    });
  }

  // 7. In-memory pagination
  const total = items.length;
  const start = (pageParam - 1) * limitParam;
  const paged = items.slice(start, start + limitParam);

  return NextResponse.json({ items: paged, total });
});
