import { NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/services/payment.service";
import { orderRepository } from "@/lib/repositories/order.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import * as mailService from "@/lib/services/mail.service";
import * as shippingService from "@/lib/services/shipping.service";
import { logger } from "@/lib/utils/logger";
import type { CustomerRow } from "@/types/db.types";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
      logger.warn("[Stripe Webhook] No STRIPE_WEBHOOK_SECRET configured, skipping signature verification");
    }
  } catch (err) {
    logger.error(`[Stripe Webhook] Signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  logger.info(`[Stripe Webhook] Event received: ${event.type}`);

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const stripeCustomerId = invoice.customer as string;

        // Find customer by stripe_customer_id in metadata JSON
        const allCustomers = await customerRepository.findAll();
        const foundCustomer = allCustomers.find(
          (c: CustomerRow) => c.metadata?.stripe_customer_id === stripeCustomerId,
        );

        if (!foundCustomer) {
          logger.warn(`[Stripe Webhook] Customer not found for stripe_customer_id: ${stripeCustomerId}`);
          break;
        }

        const productId = foundCustomer.metadata?.subscription_product_id as string | undefined;
        const shippingInfo = (foundCustomer.metadata?.subscription_shipping || {}) as Record<string, unknown>;
        const amount = (invoice.amount_paid as number) / 100;

        const orderId = await orderRepository.create({
          email: foundCustomer.email,
          customer_id: foundCustomer.id,
          total: amount,
          shipping_address: JSON.stringify(
            shippingInfo.shipping_address || (shippingInfo.relay ? { relay: shippingInfo.relay } : null),
          ),
          items: JSON.stringify([{
            id: productId ? parseInt(productId) : null,
            name: invoice.lines?.data?.[0]?.description || "Abonnement trimestriel",
            price: amount,
            quantity: 1,
          }]),
          status: "completed",
          payment_status: "captured",
          metadata: JSON.stringify({
            payment_method: "subscription",
            shipping_method: shippingInfo.method || "home",
            shipping_country: shippingInfo.country || "FR",
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription,
            subscription: true,
          }),
        });

        logger.info(`[Stripe Webhook] Order created from subscription invoice: TSK-${orderId}`);

        if (productId) await productRepository.decrementStock(parseInt(productId));

        // Send email + auto-ship (fire-and-forget)
        const order = await orderRepository.findById(orderId);
        if (order) {
          mailService.sendOrderConfirmation({
            id: order.id,
            email: order.email,
            items: order.items || [],
            total: Number(order.total),
          }).catch((err) => logger.error("Email error: " + (err instanceof Error ? err.message : String(err))));

          shippingService.createShipment(order.id).catch((err) =>
            logger.error(`[Auto-ship] Subscription order TSK-${order.id}: ${err instanceof Error ? err.message : String(err)}`),
          );
        }
        break;
      }

      case "subscription_schedule.canceled": {
        const schedule = event.data.object;
        const custId = schedule.metadata?.customer_id;
        if (custId) {
          const cust = await customerRepository.findById(parseInt(custId));
          if (cust) {
            const meta = { ...(cust.metadata || {}) };
            delete meta.subscription_schedule_id;
            delete meta.subscription_product_id;
            await customerRepository.updateMetadata(cust.id, meta);
            logger.info(`[Stripe Webhook] Subscription schedule cancelled for customer ${custId}`);
          }
        }
        break;
      }
    }
  } catch (err) {
    logger.error(`[Stripe Webhook] Error processing event: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({ received: true });
}
