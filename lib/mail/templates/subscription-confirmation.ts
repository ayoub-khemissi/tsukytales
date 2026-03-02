import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface SubscriptionConfirmationParams {
  firstName?: string | null;
  productName: string;
  totalPerQuarter: number;
  shippingCost: number;
  billingDates: string[];
  t: EmailTranslations;
}

export function subscriptionConfirmationHtml({
  firstName,
  productName,
  totalPerQuarter,
  shippingCost,
  billingDates,
  t,
}: SubscriptionConfirmationParams): string {
  const greeting = firstName
    ? `${t.greeting} ${firstName} !`
    : `${t.greeting} !`;

  const productPrice = totalPerQuarter - shippingCost;

  const dateRows = billingDates
    .map(
      (date, i) => `
        <tr>
          <td style="padding: 10px 15px; color: #4a3a4d; font-size: 15px; border-bottom: 1px solid #f0e6f2;">
            <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background: linear-gradient(135deg, rgba(88,22,104,0.1) 0%, rgba(122,33,143,0.08) 100%); border-radius: 50%; font-size: 12px; font-weight: 700; color: #581668; margin-right: 10px;">${i + 1}</span>
            ${date}
          </td>
          <td style="padding: 10px 15px; color: #581668; text-align: right; font-weight: 600; font-size: 15px; border-bottom: 1px solid #f0e6f2;">${totalPerQuarter}&euro;</td>
        </tr>`,
    )
    .join("");

  return emailLayout({
    badge: t.sub_badge,
    headline: "TSUKY TALES",
    locale: t.locale,
    footerTagline: t.footer_tagline,
    body: `
      <h2 style="color: #2d0b35; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${greeting}</h2>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.sub_welcome}</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.sub_body}</p>

      <div style="margin: 35px 0; padding: 25px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2;">
        <h3 style="color: #581668; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e8d5eb; padding-bottom: 10px;">${t.sub_summary}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px; font-weight: 600;">${productName}</td>
            <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 600; font-size: 15px;">${productPrice}&euro;</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px; font-weight: 600;">${t.sub_shipping}</td>
            <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 600; font-size: 15px;">${shippingCost === 0 ? t.sub_shipping_free : `${shippingCost}&euro;`}</td>
          </tr>
          <tr>
            <td style="padding: 20px 0 0 0; font-weight: 700; color: #2d0b35; font-size: 18px; border-top: 2px solid #e8d5eb;">${t.sub_total_quarter}</td>
            <td style="padding: 20px 0 0 0; font-weight: 700; color: #581668; text-align: right; font-size: 20px; border-top: 2px solid #e8d5eb;">${totalPerQuarter}&euro;</td>
          </tr>
        </table>
      </div>

      <div style="margin: 35px 0; padding: 25px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2;">
        <h3 style="color: #581668; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e8d5eb; padding-bottom: 10px;">${t.sub_schedule_title}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${dateRows}
        </table>
      </div>

      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.sub_skip}</p>

      <div style="text-align: center; margin-top: 40px;">
        <a href="${BASE_URL}/account?tab=subscription" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">${t.sub_cta}</a>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px; margin-top: 30px;">${t.sub_closing}<br/>${t.sub_team}</p>`,
  });
}
