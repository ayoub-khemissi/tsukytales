import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface OrderItem {
  name: string;
  quantity?: number;
  price: number;
}

interface OrderConfirmationParams {
  orderId: number;
  items: OrderItem[];
  shippingCost?: number;
  total: number;
  t: EmailTranslations;
}

export function orderConfirmationHtml({
  orderId,
  items,
  shippingCost,
  total,
  t,
}: OrderConfirmationParams): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px;">
            <span style="font-weight: 600;">${item.name}</span>
            <br><span style="font-size: 12px; color: #8e7a91;">${t.order_quantity} : ${item.quantity || 1}</span>
          </td>
          <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 600; font-size: 15px;">${item.price}&euro;</td>
        </tr>`,
    )
    .join("");

  return emailLayout({
    badge: t.order_badge,
    headline: "TSUKY TALES",
    locale: t.locale,
    footerTagline: t.footer_tagline,
    body: `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">${t.order_thanks}</h2>
        <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">${t.order_ref} TSK-${orderId}</p>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.greeting},</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.order_body}</p>
      <div style="margin: 35px 0; padding: 25px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2;">
        <h3 style="color: #581668; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e8d5eb; padding-bottom: 10px;">${t.order_summary}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${rows}
          ${
            shippingCost != null
              ? `<tr>
            <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px; font-weight: 600;">${t.order_shipping}</td>
            <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 600; font-size: 15px;">${shippingCost === 0 ? t.order_shipping_free : `${shippingCost}&euro;`}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 20px 0 0 0; font-weight: 700; color: #2d0b35; font-size: 20px; border-top: 2px solid #e8d5eb;">${t.order_total}</td>
            <td style="padding: 20px 0 0 0; font-weight: 700; color: #581668; text-align: right; font-size: 22px; border-top: 2px solid #e8d5eb;">${total}&euro;</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${BASE_URL}/account?tab=orders" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">${t.order_cta}</a>
      </div>`,
  });
}
