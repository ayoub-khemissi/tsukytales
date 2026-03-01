import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { stripe } from "@/lib/services/payment.service";
import * as shippingService from "@/lib/services/shipping.service";
import { pushOrderHistory, restoreStock } from "@/lib/services/order.service";
import { withTransaction } from "@/lib/db/connection";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/utils/logger";
import * as mailService from "@/lib/mail";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdmin();

  const { orderId } = await req.json();
  const order = await orderRepository.findById(orderId);

  if (!order) throw new AppError("Commande introuvable", 404);

  // Idempotence: already refunded
  if (order.payment_status === "refunded") {
    return NextResponse.json({
      success: true,
      message: "Commande déjà remboursée",
    });
  }

  const paymentIntentId = order.metadata?.payment_intent_id;
  const stripeInvoiceId = order.metadata?.stripe_invoice_id;

  if (stripeInvoiceId) {
    const invoice = (await stripe.invoices.retrieve(
      stripeInvoiceId as string,
    )) as any;
    const invoicePaymentIntent = invoice.payment_intent as string | null;

    if (!invoicePaymentIntent) {
      throw new AppError(
        "Cette facture Stripe n'a pas de payment_intent associé — remboursement impossible",
        400,
      );
    }

    await stripe.refunds.create({
      payment_intent: invoicePaymentIntent,
    });
  } else if (paymentIntentId) {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
  } else {
    throw new AppError("Aucun paiement trouvé pour cette commande", 400);
  }

  // Cancel Boxtal shipment if one exists
  let shippingCancelled = false;
  const shippingOrderId = order.metadata?.shipping_order_id as
    | string
    | undefined;

  if (shippingOrderId) {
    shippingCancelled = await shippingService.cancelShipment(shippingOrderId);
    logger.info(
      `[Refund] Shipping cancel for TSK-${order.id}: ${shippingCancelled ? "success" : "failed (non-blocking)"}`,
    );
  }

  // Restore stock + update order in a single transaction
  // If Stripe refund succeeded but DB fails, the charge.refunded webhook acts as safety net
  const adminEmail = session.user.email || "admin";

  try {
    await withTransaction(async (connection) => {
      await restoreStock(connection, order.items || []);

      let meta = { ...(order.metadata || {}) };

      if (shippingOrderId) {
        meta.shipping_cancelled = shippingCancelled;
      }

      meta.refunded_by = adminEmail;
      meta.refunded_at = new Date().toISOString();

      const updatedMeta = pushOrderHistory(meta, "refunded");

      await connection.execute(
        "UPDATE orders SET status = ?, payment_status = ?, metadata = ? WHERE id = ?",
        ["canceled", "refunded", JSON.stringify(updatedMeta), order.id],
      );
    });
  } catch (dbError) {
    logger.error(
      `[Refund] CRITICAL: Stripe refund succeeded but DB update failed for TSK-${order.id}. ` +
        `The charge.refunded webhook should reconcile. Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
    );
    throw new AppError(
      "Le remboursement Stripe a été effectué mais la mise à jour en base a échoué. " +
        "La synchronisation se fera automatiquement via webhook.",
      500,
    );
  }

  // Send refund confirmation email (fire-and-forget)
  mailService
    .sendRefundConfirmation({
      email: order.email,
      orderId: order.id,
      total: Number(order.total),
    })
    .catch((err) =>
      logger.error(
        `[Refund] Email error for TSK-${order.id}: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );

  return NextResponse.json({ success: true, message: "Commande remboursée" });
});
