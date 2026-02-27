import type Mail from "nodemailer/lib/mailer";

import { transport } from "./transport";

import { logger } from "@/lib/utils/logger";

const DEFAULT_FROM =
  process.env.MAIL_FROM || "Tsuky Tales <hello@tsukytales.com>";

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Mail.Attachment[];
}

export async function sendMail(opts: SendMailOptions) {
  const info = await transport.sendMail({
    from: opts.from ?? DEFAULT_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });

  // JSON transport — log the message for dev
  if (
    info.envelope?.from === false ||
    info.messageId?.endsWith("@jsonTransport")
  ) {
    logger.info(`[Mail/dev] "${opts.subject}" → ${String(opts.to)}`);
  } else {
    logger.info(
      `[Mail] Sent "${opts.subject}" → ${String(opts.to)} (${info.messageId})`,
    );
  }
}
