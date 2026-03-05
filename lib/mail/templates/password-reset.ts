import type { EmailTranslations } from "../i18n";

import { emailLayout } from "./layout";

interface PasswordResetParams {
  resetUrl: string;
  t: EmailTranslations;
}

export function passwordResetHtml({
  resetUrl,
  t,
}: PasswordResetParams): string {
  const body = `
    <p style="color: #4a3350; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      ${t.reset_body}
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #581668, #7b2d8e); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 30px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">
        ${t.reset_cta}
      </a>
    </div>
    <p style="color: #8e7a91; font-size: 13px; line-height: 1.6; margin: 0;">
      ${t.reset_ignore}
    </p>
  `;

  return emailLayout({
    badge: t.reset_badge,
    headline: t.reset_headline,
    body,
    locale: t.locale,
    footerTagline: t.footer_tagline,
  });
}
