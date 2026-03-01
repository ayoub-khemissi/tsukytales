import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { stripe } from "@/lib/services/payment.service";
import { orderRepository } from "@/lib/repositories/order.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { cached } from "@/lib/cache";
import { logger } from "@/lib/utils/logger";
import { env } from "@/lib/utils/env";
import { pool } from "@/lib/db/connection";
import { CustomerRow } from "@/types/db.types";

interface SubscriptionItem {
  id: string;
  customer_id: number | null;
  customer_email: string;
  customer_name: string | null;
  plan_name: string;
  status: string;
  stripe_status: string | null;
  stripe_dashboard_url: string | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
  orders_count: number;
  last_shipment_date: string | null;
  amount: number;
  total_spent: number;
  created_at: string;
}

/** Extract the "shipped" date from an order's metadata.history array */
function getShippedDate(metadata: any): string | null {
  const history = metadata?.history as { date: string; status: string }[] | undefined;
  if (!history) return null;
  const shipped = history.find((h) => h.status === "shipped");
  return shipped?.date ?? null;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const statusFilter = searchParams.get("status") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const pageParam = Number(searchParams.get("page") || 1);
  const limitParam = Number(searchParams.get("limit") || 20);

  const data = await cached("admin:subscriptions", 120, async () => {
    // 1. Find all customers with an active subscription_schedule_id
    const [subscriberRows] = await pool.execute<CustomerRow[]>(
      "SELECT * FROM customers WHERE subscription_schedule_id IS NOT NULL",
    );

    // 2. Get subscription orders from DB
    const orders = await orderRepository.findAll({
      where: "is_subscription_order = 1",
      orderBy: "createdAt DESC",
    });

    // Group orders by customer email
    const ordersByEmail = new Map<string, (typeof orders)[0][]>();
    for (const o of orders) {
      const list = ordersByEmail.get(o.email) || [];
      list.push(o);
      ordersByEmail.set(o.email, list);
    }

    // 3. Fetch Stripe schedule statuses for all subscribers
    const scheduleStatuses = new Map<
      string,
      {
        status: string;
        current_period_end: number | null;
        cancel_at_period_end: boolean;
      }
    >();

    const scheduleIds = subscriberRows
      .map((c) => c.metadata?.subscription_schedule_id as string | undefined)
      .filter((id): id is string => !!id);

    for (let i = 0; i < scheduleIds.length; i += 10) {
      const chunk = scheduleIds.slice(i, i + 10);
      const results = await Promise.allSettled(
        chunk.map((id) => stripe.subscriptionSchedules.retrieve(id)),
      );

      for (let j = 0; j < chunk.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          const sched = result.value;
          // Find next billing from phases
          const now = Math.floor(Date.now() / 1000);
          let nextBilling: number | null = null;
          for (const phase of sched.phases) {
            if (phase.start_date > now) {
              nextBilling = phase.start_date;
              break;
            }
          }

          scheduleStatuses.set(chunk[j], {
            status: sched.status === "active" || sched.status === "not_started"
              ? "active"
              : sched.status,
            current_period_end: nextBilling,
            cancel_at_period_end: false,
          });
        } else {
          logger.warn(`[Subscriptions] Could not fetch schedule ${chunk[j]}`);
        }
      }
    }

    // Also fetch Stripe subscription statuses from orders
    const stripeSubIds = Array.from(
      new Set(
        orders
          .map((o) => (o.metadata as any)?.stripe_subscription_id as string | undefined)
          .filter((id): id is string => !!id && !id.startsWith("sub_test_")),
      ),
    );

    const stripeSubStatuses = new Map<
      string,
      { status: string; current_period_end: number | null; cancel_at_period_end: boolean }
    >();

    for (let i = 0; i < stripeSubIds.length; i += 10) {
      const chunk = stripeSubIds.slice(i, i + 10);
      const results = await Promise.allSettled(
        chunk.map((subId) => stripe.subscriptions.retrieve(subId)),
      );

      for (let j = 0; j < chunk.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          const sub = result.value;
          stripeSubStatuses.set(chunk[j], {
            status: sub.status,
            current_period_end: (sub as any).current_period_end ?? null,
            cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
          });
        } else {
          logger.warn(`[Subscriptions] Could not fetch Stripe sub ${chunk[j]}`);
        }
      }
    }

    // 4. Collect all subscriber emails and find the last shipment date
    //    from non-preorder orders (subscription orders with status "shipped" in history)
    const allEmails = new Set<string>();
    for (const c of subscriberRows) allEmails.add(c.email);
    for (const e of Array.from(ordersByEmail.keys())) allEmails.add(e);

    // Find last shipped date per email from ALL orders (not just subscription ones)
    const lastShipmentByEmail = new Map<string, string>();
    if (allEmails.size > 0) {
      const emailArr = Array.from(allEmails);
      const placeholders = emailArr.map(() => "?").join(",");
      const [allOrders] = await pool.execute<any[]>(
        `SELECT email, metadata FROM orders
         WHERE email IN (${placeholders}) AND is_subscription_order = 1
         ORDER BY createdAt DESC`,
        emailArr,
      );

      for (const o of allOrders) {
        if (lastShipmentByEmail.has(o.email)) continue;
        const shipped = getShippedDate(o.metadata);
        if (shipped) lastShipmentByEmail.set(o.email, shipped);
      }
    }

    // 5. Build items — start from subscribers (customers with schedules)
    const seenEmails = new Set<string>();
    const items: SubscriptionItem[] = [];

    for (const customer of subscriberRows) {
      seenEmails.add(customer.email);
      const scheduleId = customer.metadata?.subscription_schedule_id as string;
      const scheduleInfo = scheduleId ? scheduleStatuses.get(scheduleId) : null;
      const customerOrders = ordersByEmail.get(customer.email) || [];
      const latest = customerOrders[0];

      let status = "active";
      if (scheduleInfo) {
        status = scheduleInfo.status;
      }

      const stripeDashboardUrl =
        env.STRIPE_ACCOUNT_ID && scheduleId
          ? `https://dashboard.stripe.com/${env.STRIPE_ACCOUNT_ID}/subscription_schedules/${scheduleId}`
          : null;

      const total_spent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0);

      items.push({
        id: scheduleId || `db_${customer.id}`,
        customer_id: customer.id,
        customer_email: customer.email,
        customer_name:
          [customer.first_name, customer.last_name].filter(Boolean).join(" ") || null,
        plan_name: "Box Littéraire Tsuky Tales",
        status,
        stripe_status: scheduleInfo?.status ?? null,
        stripe_dashboard_url: stripeDashboardUrl,
        next_billing_date: scheduleInfo?.current_period_end
          ? new Date(scheduleInfo.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: scheduleInfo?.cancel_at_period_end ?? false,
        orders_count: customerOrders.length,
        last_shipment_date: lastShipmentByEmail.get(customer.email) ?? null,
        amount: latest ? Number(latest.total) : 0,
        total_spent,
        created_at: customer.createdAt.toISOString(),
      });
    }

    // 6. Also add entries from subscription orders whose email isn't already covered
    for (const [email, customerOrders] of Array.from(ordersByEmail.entries())) {
      if (seenEmails.has(email)) continue;

      const latest = customerOrders[0];
      const meta = latest.metadata as any;
      const stripeSubId = meta?.stripe_subscription_id as string | undefined;
      const stripeInfo = stripeSubId ? stripeSubStatuses.get(stripeSubId) : null;
      const customer = await customerRepository.findByEmail(email);

      let status: string;
      if (stripeInfo) {
        status = stripeInfo.status;
      } else if (latest.status === "canceled") {
        status = "canceled";
      } else {
        status = "active";
      }

      const stripeDashboardUrl =
        env.STRIPE_ACCOUNT_ID && stripeSubId && !stripeSubId.startsWith("db_")
          ? `https://dashboard.stripe.com/${env.STRIPE_ACCOUNT_ID}/subscriptions/${stripeSubId}`
          : null;

      const total_spent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const oldest = customerOrders[customerOrders.length - 1];

      items.push({
        id: stripeSubId || `db_${latest.id}`,
        customer_id: customer?.id ?? null,
        customer_email: email,
        customer_name: customer
          ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") || null
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
        last_shipment_date: lastShipmentByEmail.get(email) ?? null,
        amount: Number(latest.total),
        total_spent,
        created_at: oldest.createdAt.toISOString(),
      });
    }

    return items;
  });

  let items = data;

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
    "last_shipment_date",
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
