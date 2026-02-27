import nodemailer from "nodemailer";

import { logger } from "@/lib/utils/logger";

function createTransport() {
  const dsn = process.env.MAILER_DSN;

  if (!dsn) {
    logger.warn(
      "MAILER_DSN not set — using JSON transport (emails logged only)",
    );

    return nodemailer.createTransport({ jsonTransport: true });
  }

  try {
    const url = new URL(dsn);
    const secure = url.protocol === "smtps:" || url.port === "465";

    return nodemailer.createTransport({
      host: url.hostname,
      port: Number(url.port) || (secure ? 465 : 587),
      secure,
      auth:
        url.username || url.password
          ? {
              user: decodeURIComponent(url.username),
              pass: decodeURIComponent(url.password),
            }
          : undefined,
    });
  } catch (err) {
    logger.error(
      `Invalid MAILER_DSN — falling back to JSON transport: ${err instanceof Error ? err.message : String(err)}`,
    );

    return nodemailer.createTransport({ jsonTransport: true });
  }
}

export const transport = createTransport();
