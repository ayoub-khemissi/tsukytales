import { emailLayout } from "./layout";

interface PaymentFailedParams {
  firstName?: string | null;
  hostedInvoiceUrl: string;
}

export function paymentFailedHtml({
  firstName,
  hostedInvoiceUrl,
}: PaymentFailedParams): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return emailLayout({
    badge: "Paiement",
    headline: "TSUKY TALES",
    body: `
      <h2 style="color: #2d0b35; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${greeting}</h2>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;">Nous n'avons pas pu traiter le paiement de votre abonnement Tsuky Tales.</p>
      <p style="color: #4a3a4d; line-height: 1.7; font-size: 15px;"><strong>Pas d'inqui&eacute;tude, cela peut arriver !</strong> Il vous suffit de mettre &agrave; jour vos informations de paiement pour continuer &agrave; recevoir vos box.</p>
      <div style="text-align: center; margin-top: 40px;">
        <a href="${hostedInvoiceUrl}" style="background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); font-size: 16px;">R&eacute;gulariser mon paiement</a>
      </div>
      <p style="color: #8e7a91; line-height: 1.7; font-size: 13px; margin-top: 30px; text-align: center;">Si vous pensez qu'il s'agit d'une erreur, n'h&eacute;sitez pas &agrave; nous contacter.</p>`,
  });
}
