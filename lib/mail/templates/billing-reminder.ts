import { emailLayout } from "./layout";

interface BillingReminderParams {
  firstName?: string | null;
  formattedDate: string;
  accountUrl: string;
}

export function billingReminderHtml({
  firstName,
  formattedDate,
  accountUrl,
}: BillingReminderParams): string {
  const greeting = firstName ? `Bonjour ${firstName} !` : "Bonjour !";

  return emailLayout({
    badge: "Rappel",
    headline: "TSUKY TALES",
    body: `
      <h2 style="color: #2d0b35; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${greeting}</h2>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Votre prochain envoi Tsuky Tales est pr&eacute;vu pour le <strong>${formattedDate}</strong>.</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Le pr&eacute;l&egrave;vement sera effectu&eacute; automatiquement.</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Si vous souhaitez passer cet envoi, vous pouvez le faire depuis votre espace personnel jusqu'&agrave; 24h avant la date.</p>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${accountUrl}" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">G&eacute;rer mon abonnement</a>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px; margin-top: 30px;">&Agrave; bient&ocirc;t !<br/>L'&eacute;quipe Tsuky Tales</p>`,
  });
}
