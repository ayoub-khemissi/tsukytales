import dns from "dns/promises";

import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { validate } from "@/lib/middleware/validate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { contactSchema } from "@/lib/validators/contact.schema";
import * as mailService from "@/lib/mail";
import { AppError } from "@/lib/errors/app-error";
import { contactMessageRepository } from "@/lib/repositories/contact-message.repository";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".doc",
  ".docx",
  ".txt",
  ".zip",
]);

export const POST = withErrorHandler(async (req: NextRequest) => {
  await rateLimit(req, { windowMs: 60_000, max: 5 });

  const formData = await req.formData();

  const body = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  };
  const data = validate(contactSchema, body);

  // Handle attachment
  const file = formData.get("attachment") as File | null;
  let attachment: { filename: string; content: Buffer } | undefined;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        "La pièce jointe dépasse la taille maximale de 10 Mo.",
        400,
      );
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new AppError("Type de fichier non autorisé.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    attachment = { filename: file.name, content: buffer };
  }

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

  // Store in database
  await contactMessageRepository.create({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
  });

  await mailService.sendContactEmail(data, attachment);

  return NextResponse.json({
    success: true,
    message: "Message envoyé avec succès",
  });
});
