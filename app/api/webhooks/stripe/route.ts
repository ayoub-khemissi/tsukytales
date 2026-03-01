import type { CustomerRow } from "@/types/db.types";

import { NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/services/payment.service";
import { orderRepository } from "@/lib/repositories/order.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { invalidateMany, invalidateByPrefix } from "@/lib/cache";
import * as mailService from "@/lib/mail";
import {
  pushOrderHistory,
  cancelOrderWithStockRestore,
  restoreStock,
} from "@/lib/services/order.service";
import { withTransaction } from "@/lib/db/connection";
import { logger } from "@/lib/utils/logger";

async function findCustomerByStripeId(
  stripeCustomerId: string,
): Promise<CustomerRow | null> {
  return customerRepository.findByStripeCustomerId(stripeCustomerId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured");

    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logger.error(
      `[Stripe Webhook] Signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
    );

    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  logger.info(`[Stripe Webhook] Event received: ${event.type}`);

  try {
    switch (event.type) {
      // ---------------------------------------------------------------
      // Payment intent succeeded — primary confirmation path
      // ---------------------------------------------------------------
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const orderId = intent.metadata?.order_id;

        if (!orderId) {
          logger.warn(
            "[Stripe Webhook] payment_intent.succeeded without order_id in metadata",
          );
          break;
        }

        const order = await orderRepository.findById(parseInt(orderId));

        if (!order) {
          logger.warn(
            `[Stripe Webhook] Order not found for payment_intent.succeeded: ${orderId}`,
          );
          break;
        }

        // Idempotence: already completed
        if (
          order.status === "completed" &&
          order.payment_status === "captured"
        ) {
          logger.info(
            `[Stripe Webhook] Order TSK-${orderId} already completed, skipping`,
          );
          break;
        }

        // Increment discount usage if applicable
        const discountId = order.metadata?.discount_id as number | undefined;

        if (discountId && !order.metadata?.discount_incremented) {
          await discountRepository.incrementUsage(discountId);
        }

        const updatedMeta = pushOrderHistory(
          {
            ...(order.metadata || {}),
            payment_method:
              typeof intent.payment_method === "string"
                ? "card"
                : (intent.payment_method as any)?.type || "card",
            discount_incremented: discountId ? true : undefined,
          },
          "payment_confirmed",
        );

        await orderRepository.update(order.id, {
          status: "completed",
          payment_status: "captured",
          metadata: JSON.stringify(updatedMeta),
        });

        logger.info(
          `[Stripe Webhook] Order TSK-${orderId} confirmed via payment_intent.succeeded`,
        );

        await invalidateMany("products:list", "admin:stats", "admin:financial");

        // Send confirmation email (fire-and-forget)
        mailService
          .sendOrderConfirmation({
            email: order.email,
            orderId: order.id,
            items: order.items || [],
            total: Number(order.total),
          })
          .catch((err) =>
            logger.error(
              "Email error: " +
                (err instanceof Error ? err.message : String(err)),
            ),
          );

        break;
      }

      // ---------------------------------------------------------------
      // Payment intent failed — restore stock
      // ---------------------------------------------------------------
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderId = intent.metadata?.order_id;

        if (!orderId) break;

        logger.warn(`[Stripe Webhook] Payment failed for order TSK-${orderId}`);

        await cancelOrderWithStockRestore(parseInt(orderId));
        await invalidateMany("products:list");
        break;
      }

      // ---------------------------------------------------------------
      // Payment intent canceled (expired / abandoned)
      // ---------------------------------------------------------------
      case "payment_intent.canceled": {
        const intent = event.data.object;
        const orderId = intent.metadata?.order_id;

        if (!orderId) break;

        logger.warn(
          `[Stripe Webhook] Payment canceled for order TSK-${orderId}`,
        );

        await cancelOrderWithStockRestore(parseInt(orderId));
        await invalidateMany("products:list");
        break;
      }

      // ---------------------------------------------------------------
      // Charge refunded (from Stripe dashboard or API)
      // ---------------------------------------------------------------
      case "charge.refunded": {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent as string | null;

        let order = null;

        if (paymentIntentId) {
          order = await orderRepository.findByPaymentIntentId(paymentIntentId);
        }

        // Fallback: try finding by invoice
        if (!order && charge.invoice) {
          order = await orderRepository.findByInvoiceId(
            charge.invoice as string,
          );
        }

        if (!order) {
          logger.warn(
            `[Stripe Webhook] charge.refunded: no order found for payment_intent=${paymentIntentId}, invoice=${charge.invoice}`,
          );
          break;
        }

        // Idempotence: already refunded
        if (order.payment_status === "refunded") {
          logger.info(
            `[Stripe Webhook] Order TSK-${order.id} already refunded, skipping charge.refunded`,
          );
          break;
        }

        const isFullRefund = charge.refunded === true;
        const newPaymentStatus = isFullRefund
          ? "refunded"
          : "partially_refunded";

        await withTransaction(async (connection) => {
          if (isFullRefund) {
            await restoreStock(connection, order!.items || []);
          }

          const updatedMeta = pushOrderHistory(
            { ...(order!.metadata || {}) },
            newPaymentStatus,
          );

          await connection.execute(
            "UPDATE orders SET status = ?, payment_status = ?, metadata = ? WHERE id = ?",
            [
              isFullRefund ? "canceled" : order!.status,
              newPaymentStatus,
              JSON.stringify(updatedMeta),
              order!.id,
            ],
          );
        });

        logger.info(
          `[Stripe Webhook] Order TSK-${order.id} marked as ${newPaymentStatus} via charge.refunded`,
        );

        await invalidateMany("admin:stats", "admin:financial", "products:list");

        // Send refund confirmation email (fire-and-forget)
        if (isFullRefund) {
          mailService
            .sendRefundConfirmation({
              email: order.email,
              orderId: order.id,
              total: Number(order.total),
            })
            .catch((err) =>
              logger.error(
                `[Stripe Webhook] Refund email error for TSK-${order!.id}: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
        }

        break;
      }

      // ---------------------------------------------------------------
      // Subscription invoice paid
      // ---------------------------------------------------------------
      case "invoice.paid": {
        const invoice = event.data.object as any;

        if (!invoice.subscription) break;

        // Idempotence: check if order with this invoice already exists
        const existingOrder = await orderRepository.findByInvoiceId(
          invoice.id as string,
        );

        if (existingOrder) {
          logger.info(
            `[Stripe Webhook] Order already exists for invoice ${invoice.id}, skipping`,
          );
          break;
        }

        const stripeCustomerId = invoice.customer as string;
        const foundCustomer = await findCustomerByStripeId(stripeCustomerId);

        if (!foundCustomer) {
          logger.warn(
            `[Stripe Webhook] Customer not found for stripe_customer_id: ${stripeCustomerId}`,
          );
          break;
        }

        const productId = foundCustomer.metadata?.subscription_product_id as
          | string
          | undefined;
        const shippingInfo = (foundCustomer.metadata?.subscription_shipping ||
          {}) as Record<string, unknown>;
        const amount = (invoice.amount_paid as number) / 100;

        const orderId = await orderRepository.create({
          email: foundCustomer.email,
          customer_id: foundCustomer.id,
          total: amount,
          shipping_address: JSON.stringify(
            shippingInfo.shipping_address ||
              (shippingInfo.relay ? { relay: shippingInfo.relay } : null),
          ),
          items: JSON.stringify([
            {
              id: productId ? parseInt(productId) : null,
              name:
                invoice.lines?.data?.[0]?.description ||
                "Abonnement trimestriel",
              price: amount,
              quantity: 1,
            },
          ]),
          status: "completed",
          payment_status: "captured",
          metadata: JSON.stringify({
            payment_method: "subscription",
            shipping_method: shippingInfo.method || "home",
            shipping_country: shippingInfo.country || "FR",
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription,
            subscription: true,
            history: [
              {
                date: new Date().toISOString(),
                status: "created",
              },
            ],
          }),
        });

        logger.info(
          `[Stripe Webhook] Order created from subscription invoice: TSK-${orderId}`,
        );

        if (productId)
          await productRepository.decrementStock(parseInt(productId));

        await invalidateMany(
          "products:list",
          "admin:stats",
          "admin:financial",
          "admin:subscriptions",
        );

        // Send email + auto-ship (fire-and-forget)
        const order = await orderRepository.findById(orderId);

        if (order) {
          mailService
            .sendOrderConfirmation({
              email: order.email,
              orderId: order.id,
              items: order.items || [],
              total: Number(order.total),
            })
            .catch((err) =>
              logger.error(
                "Email error: " +
                  (err instanceof Error ? err.message : String(err)),
              ),
            );
        }
        break;
      }

      // ---------------------------------------------------------------
      // Subscription invoice payment failed
      // ---------------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;

        if (!invoice.subscription) break;

        const stripeCustomerId = invoice.customer as string;
        const customer = await findCustomerByStripeId(stripeCustomerId);

        logger.warn(
          `[Stripe Webhook] Subscription invoice payment failed: ${invoice.id} for stripe customer ${stripeCustomerId}`,
        );

        if (customer) {
          const meta = { ...(customer.metadata || {}) };

          meta.subscription_payment_failed = true;
          meta.subscription_payment_failed_at = new Date().toISOString();
          await customerRepository.updateMetadata(customer.id, meta);

          logger.warn(
            `[Stripe Webhook] Marked payment_failed for customer ${customer.id}`,
          );

          // Send payment-failed email with Stripe hosted invoice link
          if (invoice.hosted_invoice_url) {
            mailService
              .sendPaymentFailed({
                email: customer.email,
                firstName: customer.first_name ?? null,
                hostedInvoiceUrl: invoice.hosted_invoice_url,
              })
              .catch((err) =>
                logger.error(
                  "Payment failed email error: " +
                    (err instanceof Error ? err.message : String(err)),
                ),
              );
          }
        }
        break;
      }

      // ---------------------------------------------------------------
      // Subscription updated (status change from Stripe dashboard)
      // ---------------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const stripeCustomerId = subscription.customer as string;
        const customer = await findCustomerByStripeId(stripeCustomerId);

        if (!customer) {
          logger.warn(
            `[Stripe Webhook] customer.subscription.updated: customer not found for ${stripeCustomerId}`,
          );
          break;
        }

        const meta = { ...(customer.metadata || {}) };
        const newStatus = subscription.status as string;

        logger.info(
          `[Stripe Webhook] Subscription ${subscription.id} updated to status: ${newStatus} for customer ${customer.id}`,
        );

        // Clear payment_failed flag if subscription is back to active
        if (newStatus === "active" && meta.subscription_payment_failed) {
          delete meta.subscription_payment_failed;
          delete meta.subscription_payment_failed_at;
          await customerRepository.updateMetadata(customer.id, meta);
        }

        // If canceled or unpaid, clean up subscription metadata
        if (newStatus === "canceled" || newStatus === "unpaid") {
          delete meta.subscription_schedule_id;
          delete meta.subscription_product_id;
          delete meta.subscription_payment_failed;
          delete meta.subscription_payment_failed_at;
          await customerRepository.updateMetadata(customer.id, meta);
          logger.info(
            `[Stripe Webhook] Cleaned subscription metadata for customer ${customer.id} (status: ${newStatus})`,
          );
        }

        await invalidateByPrefix("admin:subscriptions");
        break;
      }

      // ---------------------------------------------------------------
      // Subscription deleted (fully terminated)
      // ---------------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const stripeCustomerId = subscription.customer as string;
        const customer = await findCustomerByStripeId(stripeCustomerId);

        if (!customer) {
          logger.warn(
            `[Stripe Webhook] customer.subscription.deleted: customer not found for ${stripeCustomerId}`,
          );
          break;
        }

        const meta = { ...(customer.metadata || {}) };

        delete meta.subscription_schedule_id;
        delete meta.subscription_product_id;
        delete meta.subscription_payment_failed;
        delete meta.subscription_payment_failed_at;
        await customerRepository.updateMetadata(customer.id, meta);

        logger.info(
          `[Stripe Webhook] Subscription deleted, cleaned metadata for customer ${customer.id}`,
        );
        await invalidateByPrefix("admin:subscriptions");
        break;
      }

      // ---------------------------------------------------------------
      // Subscription schedule canceled
      // ---------------------------------------------------------------
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
            logger.info(
              `[Stripe Webhook] Subscription schedule cancelled for customer ${custId}`,
            );
          }
        }
        break;
      }

      // ---------------------------------------------------------------
      // Subscription schedule completed (all phases done)
      // ---------------------------------------------------------------
      case "subscription_schedule.completed": {
        const schedule = event.data.object;
        const custId = schedule.metadata?.customer_id;

        if (custId) {
          const cust = await customerRepository.findById(parseInt(custId));

          if (cust) {
            const meta = { ...(cust.metadata || {}) };

            delete meta.subscription_schedule_id;
            delete meta.subscription_product_id;
            delete meta.subscription_skipped;
            await customerRepository.updateMetadata(cust.id, meta);
            logger.info(
              `[Stripe Webhook] Subscription schedule completed for customer ${custId}, metadata cleaned`,
            );
          }
        }
        break;
      }
    }
  } catch (err) {
    logger.error(
      `[Stripe Webhook] Error processing event: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return NextResponse.json({ received: true });
}
