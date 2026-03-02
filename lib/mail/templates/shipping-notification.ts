import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface ShippingNotificationParams {
  orderId: number;
  trackingNumber: string;
  labelUrl?: string;
  t: EmailTranslations;
}

export function shippingNotificationHtml({
  orderId,
  trackingNumber,
  labelUrl,
  t,
}: ShippingNotificationParams): string {
  return emailLayout({
    badge: t.shipping_badge,
    headline: t.shipping_headline,
    locale: t.locale,
    footerTagline: t.footer_tagline,
    body: `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">${t.shipping_title}</h2>
        <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">${t.order_ref} TSK-${orderId}</p>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.shipping_body}</p>
      <div style="margin: 35px 0; padding: 35px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2; text-align: center;">
        <p style="color: #581668; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 15px;">${t.shipping_tracking}</p>
        <div style="font-size: 32px; font-weight: 800; color: #2d0b35; margin: 15px 0; font-family: monospace; letter-spacing: 1px; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px dashed #d4b5db;">${trackingNumber}</div>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${BASE_URL}/account?tab=orders" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2); width: 250px;">${t.shipping_cta}</a>
        ${labelUrl ? `<br><a href="${labelUrl}" style="color: #581668; font-size: 0.9rem; text-decoration: underline; font-weight: 600; margin-top: 15px; display: inline-block;">${t.shipping_download_label}</a>` : ""}
      </div>`,
  });
}
