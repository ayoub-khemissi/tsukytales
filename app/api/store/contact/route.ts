import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

import { withErrorHandler } from "@/lib/errors/handler";
import { validate } from "@/lib/middleware/validate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { contactSchema } from "@/lib/validators/contact.schema";
import * as mailService from "@/lib/services/mail.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await rateLimit(req, { windowMs: 60_000, max: 5 });
  const body = await req.json();
  const data = validate(contactSchema, body);

  const domain = data.email.split("@")[1];

  // DNS validation
  let hasMailServer = false;
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0 && mxRecords[0].exchange !== ".") {
      hasMailServer = true;
    }
  } catch {
    try {
      const aRecords = await dns.resolve4(domain);
      if (aRecords.length > 0) hasMailServer = true;
    } catch {
      hasMailServer = false;
    }
  }

  if (!hasMailServer) {
    throw new AppError(
      `L'adresse e-mail est invalide : le domaine @${domain} n'existe pas ou ne peut pas recevoir d'e-mails.`,
      400,
    );
  }

  await mailService.sendContactEmail(data);
  return NextResponse.json({ success: true, message: "Message envoyé avec succès" });
});
