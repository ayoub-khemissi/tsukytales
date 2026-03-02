export { transport } from "./transport";
export { sendMail } from "./send";
export { getEmailT, countryToLocale, getDateLocale } from "./i18n";

import { sendMail } from "./send";
import { getEmailT } from "./i18n";
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
  shippingCost?: number;
  total: number;
  country?: string;
}) {
  const t = getEmailT(params.country || "FR");

  await sendMail({
    to: params.email,
    subject: t.subject_order_confirmation.replace(
      "{orderId}",
      String(params.orderId),
    ),
    html: orderConfirmationHtml({
      orderId: params.orderId,
      items: params.items,
      shippingCost: params.shippingCost,
      total: params.total,
      t,
    }),
  });
}

// ─── Shipping Notification ──────────────────────────────────────

export async function sendShippingNotification(params: {
  email: string;
  orderId: number;
  trackingNumber: string;
  labelUrl?: string;
  country?: string;
}) {
  const t = getEmailT(params.country || "FR");

  await sendMail({
    to: params.email,
    subject: t.subject_shipping.replace("{orderId}", String(params.orderId)),
    html: shippingNotificationHtml({
      orderId: params.orderId,
      trackingNumber: params.trackingNumber,
      labelUrl: params.labelUrl,
      t,
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
  country?: string;
}) {
  const t = getEmailT(params.country || "FR");

  await sendMail({
    to: params.email,
    subject: t.subject_billing_reminder.replace("{date}", params.formattedDate),
    html: billingReminderHtml({
      firstName: params.firstName,
      formattedDate: params.formattedDate,
      accountUrl: params.accountUrl,
      t,
    }),
  });
}

// ─── Refund Confirmation ────────────────────────────────────────

export async function sendRefundConfirmation(params: {
  email: string;
  orderId: number;
  total: number;
  country?: string;
}) {
  const t = getEmailT(params.country || "FR");

  await sendMail({
    to: params.email,
    subject: t.subject_refund.replace("{orderId}", String(params.orderId)),
    html: refundConfirmationHtml({
      orderId: params.orderId,
      total: params.total,
      t,
    }),
  });
}

// ─── Payment Failed ─────────────────────────────────────────────

export async function sendPaymentFailed(params: {
  email: string;
  firstName?: string | null;
  hostedInvoiceUrl: string;
  country?: string;
}) {
  const t = getEmailT(params.country || "FR");

  await sendMail({
    to: params.email,
    subject: t.subject_payment_failed,
    html: paymentFailedHtml({
      firstName: params.firstName,
      hostedInvoiceUrl: params.hostedInvoiceUrl,
      t,
    }),
  });
}
