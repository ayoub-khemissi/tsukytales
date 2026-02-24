import { Resend } from "resend";

import { logger } from "@/lib/utils/logger";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  logger.info("MailService initialized with Resend API Key");
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface OrderLike {
  id: number;
  email: string;

  items: any[];
  total: number;
  metadata?: { label_url?: string; [key: string]: unknown } | null;
}

export async function sendOrderConfirmation(order: OrderLike) {
  if (!resend) {
    logger.error(
      "Resend not initialized. Cannot send order confirmation email.",
    );

    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(88, 22, 104, 0.1); border: 1px solid #f0e6f2;">
      <div style="background: linear-gradient(135deg, #581668 0%, #2d0b35 100%); padding: 50px 20px; text-align: center;">
        <div style="background-color: rgba(255,255,255,0.1); display: inline-block; padding: 10px 20px; border-radius: 8px; margin-bottom: 15px;">
          <span style="color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Confirmation</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">TSUKY TALES</h1>
      </div>
      <div style="padding: 40px 35px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">Merci pour votre confiance !</h2>
          <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">Commande TSK-${order.id}</p>
        </div>
        <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Bonjour,</p>
        <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Nous avons bien reçu votre commande. Notre équipe s'affaire déjà à préparer vos précieux livres avec tout le soin qu'ils méritent.</p>
        <div style="margin: 35px 0; padding: 25px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2;">
          <h3 style="color: #581668; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #e8d5eb; padding-bottom: 10px;">Récapitulatif</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${order.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 12px 0; color: #4a3a4d; font-size: 15px;">
                  <span style="font-weight: 600;">${item.name}</span>
                  <br><span style="font-size: 12px; color: #8e7a91;">Quantité : ${item.quantity || 1}</span>
                </td>
                <td style="padding: 12px 0; color: #581668; text-align: right; font-weight: 600; font-size: 15px;">${item.price}€</td>
              </tr>
            `,
              )
              .join("")}
            <tr>
              <td style="padding: 20px 0 0 0; font-weight: 700; color: #2d0b35; font-size: 20px; border-top: 2px solid #e8d5eb;">Total</td>
              <td style="padding: 20px 0 0 0; font-weight: 700; color: #581668; text-align: right; font-size: 22px; border-top: 2px solid #e8d5eb;">${order.total}€</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 40px;">
          <a href="${BASE_URL}/compte" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2);">Suivre ma commande</a>
        </div>
      </div>
      <div style="background-color: #fcfaff; padding: 30px; text-align: center; border-top: 1px solid #f0e6f2;">
        <p style="margin: 0; color: #8e7a91; font-size: 12px;">&copy; 2026 Tsuky Tales. Créateur d'imaginaires.</p>
      </div>
    </div>`;

  const { data, error } = await resend.emails.send({
    from: "Tsuky Tales <hello@tsukytales.com>",
    to: [order.email],
    subject: `Confirmation de commande TSK-${order.id} - Tsuky Tales`,
    html,
  });

  if (error) logger.error(`Resend email error: ${error.message}`);
  else logger.info(`Order confirmation sent: ${data?.id}`);
}

export async function sendShippingNotification(
  order: OrderLike,
  trackingNumber: string,
) {
  if (!resend) return;

  const labelUrl = order.metadata?.label_url;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(88, 22, 104, 0.1); border: 1px solid #f0e6f2;">
      <div style="background: linear-gradient(135deg, #581668 0%, #2d0b35 100%); padding: 50px 20px; text-align: center;">
        <div style="background-color: rgba(255,255,255,0.1); display: inline-block; padding: 10px 20px; border-radius: 8px; margin-bottom: 15px;">
          <span style="color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Expédition</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">TSUKY EN ROUTE !</h1>
      </div>
      <div style="padding: 40px 35px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2d0b35; margin: 0; font-size: 24px; font-weight: 700;">Votre colis a décollé !</h2>
          <p style="color: #8e7a91; font-size: 16px; margin-top: 8px;">Commande TSK-${order.id}</p>
        </div>
        <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Bonne nouvelle ! Votre commande a été remise à notre transporteur partenaire et entame son voyage vers vous.</p>
        <div style="margin: 35px 0; padding: 35px; background: linear-gradient(to bottom, #fdfaff, #f8f2f9); border-radius: 16px; border: 1px solid #f0e6f2; text-align: center;">
          <p style="color: #581668; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 15px;">Numéro de suivi Boxtal</p>
          <div style="font-size: 32px; font-weight: 800; color: #2d0b35; margin: 15px 0; font-family: monospace; letter-spacing: 1px; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px dashed #d4b5db;">${trackingNumber}</div>
        </div>
        <div style="text-align: center; margin-top: 40px;">
          <a href="${BASE_URL}/compte" style="background: linear-gradient(135deg, #581668 0%, #7a218f 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(88, 22, 104, 0.2); width: 250px;">Suivre ma commande</a>
          ${labelUrl ? `<br><a href="${labelUrl}" style="color: #581668; font-size: 0.9rem; text-decoration: underline; font-weight: 600; margin-top: 15px; display: inline-block;">Télécharger mon étiquette</a>` : ""}
        </div>
      </div>
      <div style="background-color: #fcfaff; padding: 30px; text-align: center; border-top: 1px solid #f0e6f2;">
        <p style="margin: 0; color: #8e7a91; font-size: 12px;">&copy; 2026 Tsuky Tales. Merci de votre confiance.</p>
      </div>
    </div>`;

  const { error } = await resend.emails.send({
    from: "Tsuky Tales <hello@tsukytales.com>",
    to: [order.email],
    subject: `Votre commande TSK-${order.id} est en route !`,
    html,
  });

  if (error) logger.error(`Resend email error: ${error.message}`);
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!resend) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 20px;">
      <h2 style="color: #581668; border-bottom: 2px solid #f0e6f2; padding-bottom: 10px;">Nouveau message de contact</h2>
      <p><strong>De :</strong> ${data.name} (${data.email})</p>
      <p><strong>Sujet :</strong> ${data.subject}</p>
      <div style="background: #fdf7ff; padding: 20px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #581668;">
        <p style="white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
      </div>
      <p style="font-size: 12px; color: #888; margin-top: 30px;">Envoyé depuis le formulaire de contact Tsuky Tales.</p>
    </div>`;

  const contactEmail = process.env.CONTACT_EMAIL;

  if (!contactEmail) return;

  const { error } = await resend.emails.send({
    from: "Formulaire Contact <hello@tsukytales.com>",
    to: [contactEmail],
    replyTo: data.email,
    subject: `[Contact] ${data.subject}`,
    html,
  });

  if (error) logger.error(`Resend email error: ${error.message}`);
}
