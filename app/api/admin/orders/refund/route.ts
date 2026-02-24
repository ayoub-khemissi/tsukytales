import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderRepository } from "@/lib/repositories/order.repository";
import { stripe } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { id } = await req.json();
  const order = await orderRepository.findById(id);

  if (!order) throw new AppError("Commande introuvable", 404);

  const paymentIntentId = order.metadata?.payment_intent_id;

  const stripeInvoiceId = (order.metadata as any)?.stripe_invoice_id;

  if (stripeInvoiceId) {
    const invoice = (await stripe.invoices.retrieve(stripeInvoiceId)) as any;

    if (invoice.payment_intent) {
      await stripe.refunds.create({
        payment_intent: String(invoice.payment_intent),
      });
    }
  } else if (paymentIntentId) {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
  } else {
    throw new AppError("Aucun paiement trouvé pour cette commande", 400);
  }

  const meta = (order.metadata || {}) as any;
  const history = meta.history || [];

  history.push({
    date: new Date().toISOString(),
    status: "refunded",
    label: "Commande remboursée intégralement",
  });

  await orderRepository.update(order.id, {
    status: "canceled",
    payment_status: "refunded",
    metadata: JSON.stringify({ ...meta, history }),
  });

  return NextResponse.json({ success: true, message: "Commande remboursée" });
});
