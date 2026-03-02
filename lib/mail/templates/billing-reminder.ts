import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

interface BillingReminderParams {
  firstName?: string | null;
  formattedDate: string;
  accountUrl: string;
  t: EmailTranslations;
}

export function billingReminderHtml({
  firstName,
  formattedDate,
  accountUrl,
  t,
}: BillingReminderParams): string {
  const greeting = firstName
    ? `${t.greeting} ${firstName} !`
    : `${t.greeting} !`;

  return emailLayout({
    badge: t.billing_badge,
    headline: "TSUKY TALES",
    locale: t.locale,
    footerTagline: t.footer_tagline,
    body: `
      <h2 style="color: #2d0b35; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${greeting}</h2>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.billing_body.replace("{date}", formattedDate)}</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.billing_auto}</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">${t.billing_skip}</p>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${accountUrl}" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">${t.billing_cta}</a>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px; margin-top: 30px;">${t.billing_closing}<br/>${t.billing_team}</p>`,
  });
}
