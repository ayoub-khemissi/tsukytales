import Stripe from "stripe";

import { logger } from "@/lib/utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface OrderData {
  id: number;
  items: { price: number; quantity?: number }[];
  metadata?: Record<string, unknown> | null;
  stripe_customer_id?: string;
  email?: string;
  order_number?: string;
}

export async function createPaymentIntent(orderData: OrderData) {
  logger.info(`Creating Stripe PaymentIntent for order: ${orderData.id}`);

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Le panier est vide");
  }

  const itemsTotal = orderData.items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const meta = orderData.metadata as Record<string, unknown> | undefined;
  const discountAmount = (meta?.discount_amount as number) || 0;
  const shippingCost =
    (meta?.shipping_cost as number) ||
    (meta?.shipping_method === "home" ? 7.5 : 4.9);
  const totalAmount = Math.round((itemsTotal + shippingCost - discountAmount) * 100);

  const intentOptions: Stripe.PaymentIntentCreateParams = {
    amount: totalAmount,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      order_id: String(orderData.id),
      order_number: orderData.order_number || `TSK-${orderData.id}`,
    },
  };

  if (orderData.stripe_customer_id) {
    intentOptions.customer = orderData.stripe_customer_id;
  }
  if (orderData.email) {
    intentOptions.receipt_email = orderData.email;
  }

  const paymentIntent = await stripe.paymentIntents.create(intentOptions);

  logger.info(`PaymentIntent created: ${paymentIntent.id}`);
  return {
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
  };
}

export async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.status === "succeeded";
  } catch (err) {
    logger.error("Stripe Verify Error: " + (err instanceof Error ? err.message : String(err)));
    return false;
  }
}

export async function createRefund(paymentIntentId: string) {
  const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
  logger.info(`Refund created: ${refund.id} for PI: ${paymentIntentId}`);
  return refund;
}

export { stripe };
