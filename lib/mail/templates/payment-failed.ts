import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface PaymentFailedParams {
  firstName?: string | null;
  hostedInvoiceUrl: string;
  t: EmailTranslations;
}

export function paymentFailedHtml({
  firstName,
  hostedInvoiceUrl,
  t,
}: PaymentFailedParams): string {
  const greeting = firstName ? `${t.greeting} ${firstName},` : `${t.greeting},`;

  return emailLayout({
    badge: t.payment_badge,
    headline: "TSUKY TALES",
    locale: t.locale,
    footerTagline: t.footer_tagline,
    body: `
      <h2 style="color: #2d0b35; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${greeting}</h2>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.payment_body}</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.payment_reassure} ${t.payment_action}</p>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${hostedInvoiceUrl}" style="background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); font-size: 16px;">${t.payment_cta}</a>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px; margin-top: 30px; text-align: center;">${t.payment_card_expired}</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${BASE_URL}/account?tab=payments" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2); font-size: 14px;">${t.payment_update_card}</a>
      </div>
      <p style="color: #8e7a91; line-height: 1.7; font-size: 13px; margin-top: 30px; text-align: center;">${t.payment_error_contact}</p>`,
  });
}
