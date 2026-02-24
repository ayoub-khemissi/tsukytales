import type { ProductRow } from "@/types/db.types";

import { ResultSetHeader } from "mysql2";

import * as paymentService from "./payment.service";
import * as shippingService from "./shipping.service";
import * as mailService from "./mail.service";
import * as stripeCustomerService from "./stripe-customer.service";

import { withTransaction } from "@/lib/db/connection";
import { orderRepository } from "@/lib/repositories/order.repository";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { logger } from "@/lib/utils/logger";
import { AppError } from "@/lib/errors/app-error";

interface CreateOrderInput {
  items: { id: number; price: number; quantity?: number; name?: string }[];
  total: number;
  method: "home" | "relay";
  country?: string;
  relay?: unknown;
  shipping_address?: Record<string, unknown>;
  email: string;
  promo_code?: string;
}

export async function createOrder(
  customerId: number,
  userEmail: string,
  data: CreateOrderInput,
) {
  return withTransaction(async (connection) => {
    let finalTotal = data.total;

    // Apply discount
    if (data.promo_code) {
      const discount = await discountRepository.findByCode(data.promo_code);

      if (discount) {
        const itemsTotal = data.items.reduce(
          (sum, i) => sum + i.price * (i.quantity || 1),
          0,
        );
        let reduction = 0;

        if (discount.rule.type === "percentage") {
          reduction = itemsTotal * (discount.rule.value / 100);
        } else {
          reduction = discount.rule.value;
        }
        reduction = Math.min(reduction, itemsTotal);
        finalTotal = data.total - reduction;
        await discountRepository.incrementUsage(discount.id);
      }
    }

    const normalizedEmail = (data.email || userEmail).toLowerCase().trim();

    // Fetch products for weight/dimensions
    const productIds = data.items.map((i) => i.id);
    const [dbProducts] = await connection.execute<ProductRow[]>(
      `SELECT * FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`,
      productIds,
    );

    let totalWeight = 0;
    const enrichedItems = data.items.map((item) => {
      const p = dbProducts.find((dbP) => dbP.id === item.id);
      const weight = p ? Number(p.weight) : 1.0;
      const quantity = item.quantity || 1;

      totalWeight += weight * quantity;

      return {
        ...item,
        name: item.name || p?.name || "Produit",
        quantity,
        weight,
        length: p ? Number(p.length) : 21,
        width: p ? Number(p.width) : 15,
        height: p ? Number(p.height) : 3,
      };
    });

    // Calculate shipping
    const shipCountry = (data.country || "FR").toUpperCase();
    const shippingRates = shippingService.getShippingRates(
      totalWeight,
      shipCountry,
    );
    const shippingCost =
      data.method === "home" || !shippingRates.relay
        ? shippingRates.home.price
        : shippingRates.relay.price;

    const shippingAddress =
      data.method === "home" && data.shipping_address
        ? data.shipping_address
        : {
            relay:
              typeof data.relay === "string"
                ? { name: data.relay }
                : data.relay,
          };

    // Create order
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (email, customer_id, total, shipping_address, items, status, payment_status, metadata)
       VALUES (?, ?, ?, ?, ?, 'pending', 'awaiting', ?)`,
      [
        normalizedEmail,
        customerId,
        finalTotal,
        JSON.stringify(shippingAddress),
        JSON.stringify(enrichedItems),
        JSON.stringify({
          shipping_method: data.method,
          shipping_country: shipCountry,
          shipping_cost: shippingCost,
          total_weight: totalWeight,
          promo_code: data.promo_code,
          discount_amount: data.total - finalTotal,
        }),
      ],
    );

    const orderId = result.insertId;
    const order = await orderRepository.findById(orderId);

    if (!order) throw new AppError("Erreur création commande", 500);

    // Get Stripe customer
    const customer = await customerRepository.findById(customerId);

    if (!customer) throw new AppError("Client introuvable", 404);
    const stripeCustomerId =
      await stripeCustomerService.getOrCreateStripeCustomer(customer);

    // Create PaymentIntent
    const orderData = {
      id: orderId,
      items: enrichedItems,
      metadata: order.metadata,
      stripe_customer_id: stripeCustomerId,
      email: normalizedEmail,
      order_number: `TSK-${orderId}`,
    };
    const paymentResult = await paymentService.createPaymentIntent(orderData);

    // Store payment_intent_id
    await orderRepository.update(orderId, {
      metadata: JSON.stringify({
        ...(order.metadata || {}),
        payment_intent_id: paymentResult.payment_intent_id,
      }),
    });

    return {
      order: { ...order, order_number: `TSK-${orderId}` },
      client_secret: paymentResult.client_secret,
    };
  });
}

export async function confirmOrder(orderId: number, customerId: number) {
  const order = await orderRepository.findById(orderId);

  if (!order || order.customer_id !== customerId) {
    throw new AppError("Commande introuvable", 404);
  }

  const paymentIntentId = order.metadata?.payment_intent_id;

  if (!paymentIntentId)
    throw new AppError("Aucun paiement associé à cette commande", 400);

  const intent = await paymentService.stripe.paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ["payment_method"],
    },
  );

  if (intent.status !== "succeeded") {
    throw new AppError("Le paiement n'a pas été confirmé", 400);
  }

  const pmType =
    typeof intent.payment_method === "object"
      ? intent.payment_method?.type
      : "card";
  const updatedMetadata = { ...(order.metadata || {}), payment_method: pmType };

  await orderRepository.update(orderId, {
    status: "completed",
    payment_status: "captured",
    metadata: JSON.stringify(updatedMetadata),
  });

  // Send confirmation email (fire-and-forget)
  const orderData = {
    id: order.id,
    email: order.email,
    items: order.items || [],
    total: Number(order.total),
    metadata: updatedMetadata,
  };

  mailService
    .sendOrderConfirmation(orderData)
    .catch((err) =>
      logger.error(
        "Email error: " + (err instanceof Error ? err.message : String(err)),
      ),
    );

  // Auto-ship (skip preorders)
  if (!order.metadata?.preorder) {
    shippingService
      .createShipment(order.id)
      .catch((err) =>
        logger.error(
          `[Auto-ship] Order TSK-${order.id}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
  }

  return { success: true, order };
}

export async function listCustomerOrders(
  customerId: number,
  email: string,
  options?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  },
) {
  // Sync customer_id for orders with this email
  await orderRepository.updateCustomerIdByEmail(email, customerId);

  return orderRepository.findByCustomerIdOrEmail(customerId, email, options);
}
