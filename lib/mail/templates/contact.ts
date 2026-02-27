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
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 20px;">
      <h2 style="color: #581668; border-bottom: 2px solid #f0e6f2; padding-bottom: 10px;">Nouveau message de contact</h2>
      <p><strong>De :</strong> ${name} (${email})</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <div style="background: #fdf7ff; padding: 20px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #581668;">
        <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
      </div>
      ${attachmentFilename ? `<p style="font-size: 13px; color: #581668; margin-top: 20px;">&#x1F4CE; Pi&egrave;ce jointe : ${attachmentFilename}</p>` : ""}
      <p style="font-size: 12px; color: #888; margin-top: 30px;">Envoy&eacute; depuis le formulaire de contact Tsuky Tales.</p>
    </div>`;
}
