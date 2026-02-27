import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface RefundConfirmationParams {
  orderId: number;
  total: number;
}

export function refundConfirmationHtml({
  orderId,
  total,
}: RefundConfirmationParams): string {
  return emailLayout({
    badge: "Remboursement",
    headline: "TSUKY TALES",
    body: `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">Votre remboursement a &eacute;t&eacute; effectu&eacute;</h2>
        <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">Commande TSK-${orderId}</p>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Bonjour,</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Nous vous confirmons le remboursement de votre commande. Le montant sera cr&eacute;dit&eacute; sur votre moyen de paiement d'origine sous quelques jours ouvrables.</p>
      <div style="margin: 35px 0; padding: 25px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2;">
        <h3 style="color: #581668; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e8d5eb; padding-bottom: 10px;">D&eacute;tail</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px; font-weight: 600;">Montant rembours&eacute;</td>
            <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 700; font-size: 22px;">${total}&euro;</td>
          </tr>
        </table>
      </div>
      <p style="color: #8e7a91; line-height: 1.7; font-size: 14px;">Si vous avez des questions, n'h&eacute;sitez pas &agrave; nous contacter.</p>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${BASE_URL}/compte" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">Mon compte</a>
      </div>`,
  });
}
