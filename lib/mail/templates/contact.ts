const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface ContactParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  attachmentFilename?: string;
}

export function contactHtml({
  name,
  email,
  subject,
  message,
  attachmentFilename,
}: ContactParams): string {
  const logoUrl = `${BASE_URL}/assets/img/logo.png`;
  const bgUrl = `${BASE_URL}/assets/img/bg.png`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #FDF7FF;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDF7FF; background-image: url('${bgUrl}'); background-repeat: repeat; background-size: auto;">
        <tr>
          <td align="center" style="padding: 30px 15px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: rgba(255,255,255,0.85); border-radius: 16px 16px 0 0; padding: 35px 20px 25px; border: 1px solid rgba(240,230,242,0.6); border-bottom: none;">
                  <img src="${logoUrl}" alt="Tsuky Tales" width="140" style="display: block; margin: 0 auto 18px;" />
                  <div style="background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%); display: inline-block; padding: 6px 18px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); margin-bottom: 14px;">
                    <span style="color: #B8960C; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 700;">Contact</span>
                  </div>
                  <h1 style="color: #3D0F48; margin: 0; font-size: 26px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.5px; line-height: 1.3;">Nouveau message</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="background-color: #ffffff; padding: 40px 35px; border-left: 1px solid #f0e6f2; border-right: 1px solid #f0e6f2;">
                  <p style="margin: 0 0 8px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #3D0F48;"><strong>De :</strong> ${name} (${email})</p>
                  <p style="margin: 0 0 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #3D0F48;"><strong>Sujet :</strong> ${subject}</p>
                  <div style="background: #fdf7ff; padding: 20px; border-radius: 10px; border-left: 4px solid #581668;">
                    <p style="white-space: pre-wrap; line-height: 1.6; margin: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a2d52;">${message}</p>
                  </div>
                  ${attachmentFilename ? `<p style="font-size: 13px; color: #581668; margin: 20px 0 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">&#x1F4CE; Pi&egrave;ce jointe : ${attachmentFilename}</p>` : ""}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #fcfaff; padding: 25px 20px; border-radius: 0 0 16px 16px; border: 1px solid #f0e6f2; border-top: none;">
                  <p style="margin: 0 0 6px; color: #8e7a91; font-size: 12px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">Cr&eacute;ateur d'imaginaires</p>
                  <a href="${BASE_URL}" style="color: #581668; font-size: 12px; text-decoration: none; font-weight: 600;">tsukytales.com</a>
                  <p style="margin: 10px 0 0; color: #b8a5bb; font-size: 11px;">&copy; 2026 Tsuky Tales</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}
