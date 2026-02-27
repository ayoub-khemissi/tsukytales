export { transport } from "./transport";
export { sendMail } from "./send";

import { sendMail } from "./send";
import { orderConfirmationHtml } from "./templates/order-confirmation";
import { shippingNotificationHtml } from "./templates/shipping-notification";
import { contactHtml } from "./templates/contact";
import { billingReminderHtml } from "./templates/billing-reminder";
import { paymentFailedHtml } from "./templates/payment-failed";
import { refundConfirmationHtml } from "./templates/refund-confirmation";

// ─── Order Confirmation ─────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity?: number;
  price: number;
}

export async function sendOrderConfirmation(params: {
  email: string;
  orderId: number;
  items: OrderItem[];
  total: number;
}) {
  await sendMail({
    to: params.email,
    subject: `Confirmation de commande TSK-${params.orderId} - Tsuky Tales`,
    html: orderConfirmationHtml({
      orderId: params.orderId,
      items: params.items,
      total: params.total,
    }),
  });
}

// ─── Shipping Notification ──────────────────────────────────────

export async function sendShippingNotification(params: {
  email: string;
  orderId: number;
  trackingNumber: string;
  labelUrl?: string;
}) {
  await sendMail({
    to: params.email,
    subject: `Votre commande TSK-${params.orderId} est en route !`,
    html: shippingNotificationHtml({
      orderId: params.orderId,
      trackingNumber: params.trackingNumber,
      labelUrl: params.labelUrl,
    }),
  });
}

// ─── Contact Email (→ admin) ────────────────────────────────────

export async function sendContactEmail(
  data: { name: string; email: string; subject: string; message: string },
  attachment?: { filename: string; content: Buffer },
) {
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!contactEmail) return;

  await sendMail({
    to: contactEmail,
    from: "Formulaire Contact <hello@tsukytales.com>",
    replyTo: data.email,
    subject: `[Contact] ${data.subject}`,
    html: contactHtml({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      attachmentFilename: attachment?.filename,
    }),
    attachments: attachment
      ? [{ filename: attachment.filename, content: attachment.content }]
      : undefined,
  });
}

// ─── Billing Reminder ───────────────────────────────────────────

export async function sendBillingReminder(params: {
  email: string;
  firstName?: string | null;
  formattedDate: string;
  accountUrl: string;
}) {
  await sendMail({
    to: params.email,
    subject: `Rappel : votre prochaine box Tsuky Tales le ${params.formattedDate}`,
    html: billingReminderHtml({
      firstName: params.firstName,
      formattedDate: params.formattedDate,
      accountUrl: params.accountUrl,
    }),
  });
}

// ─── Refund Confirmation ────────────────────────────────────────

export async function sendRefundConfirmation(params: {
  email: string;
  orderId: number;
  total: number;
}) {
  await sendMail({
    to: params.email,
    subject: `Remboursement de votre commande TSK-${params.orderId} - Tsuky Tales`,
    html: refundConfirmationHtml({
      orderId: params.orderId,
      total: params.total,
    }),
  });
}

// ─── Payment Failed ─────────────────────────────────────────────

export async function sendPaymentFailed(params: {
  email: string;
  firstName?: string | null;
  hostedInvoiceUrl: string;
}) {
  await sendMail({
    to: params.email,
    subject: "Problème de paiement pour votre abonnement Tsuky Tales",
    html: paymentFailedHtml({
      firstName: params.firstName,
      hostedInvoiceUrl: params.hostedInvoiceUrl,
    }),
  });
}
