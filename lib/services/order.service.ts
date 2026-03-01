import type {
  OrderItem,
  OrderMetadata,
  OrderRow,
  ProductRow,
} from "@/types/db.types";
import type { CreateOrderInput } from "@/lib/validators/order.schema";

import { PoolConnection, ResultSetHeader } from "mysql2/promise";

import * as paymentService from "./payment.service";
import * as shippingService from "./shipping.service";
import * as stripeCustomerService from "./stripe-customer.service";

import * as mailService from "@/lib/mail";
import { withTransaction } from "@/lib/db/connection";
import { orderRepository } from "@/lib/repositories/order.repository";
import { discountRepository } from "@/lib/repositories/discount.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { logger } from "@/lib/utils/logger";
import { AppError } from "@/lib/errors/app-error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Append an entry to `metadata.history` for audit trail. */
export function pushOrderHistory(
  metadata: OrderMetadata | null,
  status: string,
): OrderMetadata {
  const meta = { ...(metadata || {}) };
  const history = (meta.history as Array<Record<string, string>>) || [];

  history.push({ date: new Date().toISOString(), status });

  return { ...meta, history } as OrderMetadata;
}

/** Re-increment stock for every item in a cancelled / refunded order (batch). */
export async function restoreStock(
  connection: PoolConnection,
  items: OrderItem[],
): Promise<void> {
  const productItems: { id: number; quantity: number }[] = [];

  for (const item of items) {
    const productId = item.product_id ?? item.id;

    if (productId) {
      productItems.push({ id: productId, quantity: item.quantity });
    }
  }

  if (productItems.length > 0) {
    const caseClauses = productItems.map(() => "WHEN ? THEN ?").join(" ");
    const ids = productItems.map((p) => p.id);
    const params: (number | string)[] = [];

    for (const p of productItems) {
      params.push(p.id, p.quantity);
    }
    params.push(...ids);

    await connection.query<ResultSetHeader>(
      `UPDATE products SET stock = stock + CASE id ${caseClauses} END WHERE id IN (${ids.map(() => "?").join(",")})`,
      params,
    );
  }
}

/** Cancel an order and restore stock in a single transaction. */
export async function cancelOrderWithStockRestore(
  orderId: number,
): Promise<void> {
  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);
  if (order.status === "canceled") return; // already cancelled

  await withTransaction(async (connection) => {
    await restoreStock(connection, order.items || []);

    const updatedMeta = pushOrderHistory(order.metadata, "canceled");

    await connection.execute(
      "UPDATE orders SET status = ?, payment_status = ?, metadata = ? WHERE id = ?",
      ["canceled", "canceled", JSON.stringify(updatedMeta), orderId],
    );
  });

  logger.info(`[Order] TSK-${orderId} cancelled with stock restored`);
}

export async function createOrder(
  customerId: number | null,
  userEmail: string | null,
  data: CreateOrderInput,
) {
  return withTransaction(async (connection) => {
    const method = data.shipping_method;

    // 1. Load products from DB
    const productIds = data.items.map((i) => i.product_id);
    const [dbProducts] = await connection.execute<ProductRow[]>(
      `SELECT * FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`,
      productIds,
    );

    // Verify all products exist
    for (const item of data.items) {
      const p = dbProducts.find((dbP) => dbP.id === item.product_id);

      if (!p)
        throw new AppError(`Produit introuvable: ${item.product_id}`, 400);
    }

    // 2. Verify stock & build enriched items with DB prices
    let totalWeight = 0;
    let itemsTotal = 0;
    const enrichedItems = data.items.map((item) => {
      const p = dbProducts.find((dbP) => dbP.id === item.product_id)!;

      if (p.stock < item.quantity) {
        throw new AppError(
          `Stock insuffisant pour "${p.name}": ${p.stock} disponible(s), ${item.quantity} demandé(s)`,
          400,
        );
      }

      const unitPrice = Number(p.price);
      const weight = Number(p.weight) || 0.3;
      const quantity = item.quantity;

      totalWeight += weight * quantity;
      itemsTotal += unitPrice * quantity;

      return {
        product_id: item.product_id,
        name: p.name,
        quantity,
        price: unitPrice * quantity,
        unit_price: unitPrice,
        is_preorder: !!p.is_preorder,
        weight,
        length: Number(p.length) || 21,
        width: Number(p.width) || 15,
        height: Number(p.height) || 3,
      };
    });

    // 4. Validate discount
    let discountAmount = 0;
    let discountId: number | null = null;

    if (data.discount_code) {
      const discount = await discountRepository.findValidByCode(
        data.discount_code,
      );

      if (!discount) {
        throw new AppError("Code promo invalide ou expiré", 400);
      }

      let reduction = 0;

      if (discount.rule.type === "percentage") {
        reduction = itemsTotal * (discount.rule.value / 100);
      } else {
        reduction = discount.rule.value;
      }
      discountAmount = Math.min(reduction, itemsTotal);
      discountId = discount.id;
      // NOTE: usage is incremented in confirmOrder / webhook after payment succeeds
    }

    // 5. Calculate shipping
    const shipCountry = (
      (data.shipping_address?.country as string) || "FR"
    ).toUpperCase();
    const shippingRates = await shippingService.getShippingRates(
      totalWeight,
      shipCountry,
    );
    const shippingCost =
      method === "home" || !shippingRates.relay
        ? shippingRates.home.price
        : shippingRates.relay.price;

    // 6. Calculate final total
    const finalTotal = itemsTotal + shippingCost - discountAmount;

    // 7. Decrement stock (batch)
    const ids = data.items.map((i) => i.product_id);
    const caseDec = data.items.map(() => "WHEN ? THEN ?").join(" ");
    const caseGuard = data.items.map(() => "WHEN ? THEN ?").join(" ");
    const params: (number | string)[] = [];

    for (const i of data.items) {
      params.push(i.product_id, i.quantity);
    }
    for (const i of data.items) {
      params.push(i.product_id, i.quantity);
    }
    params.push(...ids);

    const [stockRes] = await connection.query<ResultSetHeader>(
      `UPDATE products SET stock = stock - CASE id ${caseDec} END WHERE id IN (${ids.map(() => "?").join(",")}) AND stock >= CASE id ${caseGuard} END`,
      params,
    );

    if (stockRes.affectedRows !== data.items.length) {
      throw new AppError("Erreur de décrémentation du stock", 500);
    }

    // 8. Resolve customer (guest or authenticated)
    let resolvedCustomerId = customerId;
    let resolvedEmail = userEmail;

    if (resolvedCustomerId === null) {
      // Guest checkout — resolve or create guest customer
      const guestEmail = data.guest_email;

      if (!guestEmail) {
        throw new AppError("Email requis pour les commandes invité", 400);
      }
      const guestCustomer =
        await customerRepository.getOrCreateGuest(guestEmail);

      resolvedCustomerId = guestCustomer.id;
      resolvedEmail = guestCustomer.email;
    }

    const normalizedEmail = resolvedEmail!.toLowerCase().trim();
    const shippingAddress = data.shipping_address;

    // 9. Get/Create Stripe customer BEFORE inserting order.
    //    INSERT orders places a FK shared lock on the customers row;
    //    getOrCreateStripeCustomer may UPDATE customers metadata via pool,
    //    which needs an exclusive lock — so it must run first.
    const customer = await customerRepository.findById(resolvedCustomerId!);

    if (!customer) throw new AppError("Client introuvable", 404);
    const stripeCustomerId =
      await stripeCustomerService.getOrCreateStripeCustomer(customer);

    // 10. Create order
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (email, customer_id, total, shipping_address, items, status, payment_status, metadata)
       VALUES (?, ?, ?, ?, ?, 'pending', 'awaiting', ?)`,
      [
        normalizedEmail,
        resolvedCustomerId,
        finalTotal,
        JSON.stringify(shippingAddress),
        JSON.stringify(enrichedItems),
        JSON.stringify({
          shipping_method: method,
          shipping_country: shipCountry,
          shipping_cost: shippingCost,
          total_weight: totalWeight,
          promo_code: data.discount_code || null,
          discount_amount: discountAmount,
          discount_id: discountId,
          ...(data.relay_code ? { relay_code: data.relay_code } : {}),
          history: [
            {
              date: new Date().toISOString(),
              status: "created",
            },
          ],
        }),
      ],
    );

    const orderId = result.insertId;

    // Read back from the same connection (transaction not yet committed)
    const [orderRows] = await connection.execute<OrderRow[]>(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [orderId],
    );
    const order = orderRows[0];

    if (!order) throw new AppError("ORDER_CREATE_FAILED", 500);

    // Parse JSON columns that come as strings from raw query
    if (typeof order.items === "string") order.items = JSON.parse(order.items);
    if (typeof order.metadata === "string")
      order.metadata = JSON.parse(order.metadata);
    if (typeof order.shipping_address === "string")
      order.shipping_address = JSON.parse(order.shipping_address);

    // 11. Create PaymentIntent with server-calculated total
    const paymentResult = await paymentService.createPaymentIntent({
      id: orderId,
      total: finalTotal,
      stripe_customer_id: stripeCustomerId,
      email: normalizedEmail,
      order_number: `TSK-${orderId}`,
    });

    // Store payment_intent_id (use transaction connection)
    await connection.execute("UPDATE orders SET metadata = ? WHERE id = ?", [
      JSON.stringify({
        ...(order.metadata || {}),
        payment_intent_id: paymentResult.payment_intent_id,
      }),
      orderId,
    ]);

    return {
      order: { ...order, order_number: `TSK-${orderId}` },
      client_secret: paymentResult.client_secret,
    };
  });
}

export async function confirmOrder(orderId: number, customerId: number | null) {
  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);

  // For authenticated users, verify ownership
  if (customerId !== null && order.customer_id !== customerId) {
    throw new AppError("Commande introuvable", 404);
  }

  // Idempotence: if already completed, return early
  if (order.status === "completed" && order.payment_status === "captured") {
    return { success: true, order };
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

  let updatedMetadata = pushOrderHistory(
    { ...(order.metadata || {}), payment_method: pmType },
    "payment_confirmed",
  );

  // Increment discount usage now that payment is confirmed
  const discountId = order.metadata?.discount_id as number | undefined;

  if (discountId) {
    await discountRepository.incrementUsage(discountId);
    updatedMetadata = { ...updatedMetadata, discount_incremented: true };
  }

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
    .sendOrderConfirmation({
      email: orderData.email,
      orderId: orderData.id,
      items: orderData.items,
      total: orderData.total,
    })
    .catch((err) =>
      logger.error(
        "Email error: " + (err instanceof Error ? err.message : String(err)),
      ),
    );

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
