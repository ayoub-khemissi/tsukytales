import { emailLayout } from "./layout";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface ShippingNotificationParams {
  orderId: number;
  trackingNumber: string;
  labelUrl?: string;
}

export function shippingNotificationHtml({
  orderId,
  trackingNumber,
  labelUrl,
}: ShippingNotificationParams): string {
  return emailLayout({
    badge: "Exp&eacute;dition",
    headline: "TSUKY EN ROUTE !",
    body: `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">Votre colis a d&eacute;coll&eacute; !</h2>
        <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">Commande TSK-${orderId}</p>
      </div>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Bonne nouvelle ! Votre commande a &eacute;t&eacute; remise &agrave; notre transporteur partenaire et entame son voyage vers vous.</p>
      <div style="margin: 35px 0; padding: 35px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2; text-align: center;">
        <p style="color: #581668; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 15px;">Num&eacute;ro de suivi</p>
        <div style="font-size: 32px; font-weight: 800; color: #2d0b35; margin: 15px 0; font-family: monospace; letter-spacing: 1px; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px dashed #d4b5db;">${trackingNumber}</div>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${BASE_URL}/account?tab=orders" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2); width: 250px;">Suivre ma commande</a>
        ${labelUrl ? `<br><a href="${labelUrl}" style="color: #581668; font-size: 0.9rem; text-decoration: underline; font-weight: 600; margin-top: 15px; display: inline-block;">T&eacute;l&eacute;charger mon &eacute;tiquette</a>` : ""}
      </div>`,
  });
}
