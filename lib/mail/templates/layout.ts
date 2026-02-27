interface LayoutOptions {
  badge: string;
  headline: string;
  body: string;
}

export function emailLayout({ badge, headline, body }: LayoutOptions): string {
  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(88, 22, 104, 0.1); border: 1px solid #f0e6f2;">
      <div style="background: linear-gradient(135deg, #581668 0%, #2d0b35 100%); padding: 50px 20px; text-align: center;">
        <div style="background-color: rgba(255,255,255,0.1); display: inline-block; padding: 10px 20px; border-radius: 8px; margin-bottom: 15px;">
          <span style="color: #D4AF37; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700;">${badge}</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">${headline}</h1>
      </div>
      <div style="padding: 40px 35px;">
        ${body}
      </div>
      <div style="background-color: #fcfaff; padding: 30px; text-align: center; border-top: 1px solid #f0e6f2;">
        <p style="margin: 0; color: #8e7a91; font-size: 12px;">&copy; 2026 Tsuky Tales. Cr&eacute;ateur d'imaginaires.</p>
      </div>
    </div>`;
}
