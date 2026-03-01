import { z } from "zod/v4";

// Transform empty strings to undefined so optional() works correctly with env vars
const optStr = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().min(1).optional(),
);
const optUrl = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().url().optional(),
);
const optEmail = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().email().optional(),
);

const envSchema = z.object({
  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional())
    .default(""),
  DB_NAME: z.string().min(1),
  DB_POOL_LIMIT: z.coerce.number().default(10),
  DB_QUEUE_LIMIT: z.coerce.number().default(0),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),

  // Google OAuth
  GOOGLE_CLIENT_ID: optStr,
  GOOGLE_CLIENT_SECRET: optStr,

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: optStr,
  STRIPE_ACCOUNT_ID: optStr,

  // Boxtal
  BOXTAL_API_URL: optUrl,
  BOXTAL_CLIENT_ID: optStr,
  BOXTAL_CLIENT_SECRET: optStr,
  BOXTAL_WEBHOOK_SECRET: optStr,
  // Boxtal Sender
  BOXTAL_SENDER_FIRST_NAME: optStr,
  BOXTAL_SENDER_LAST_NAME: optStr,
  BOXTAL_SENDER_EMAIL: optStr,
  BOXTAL_SENDER_PHONE: optStr,
  BOXTAL_SENDER_STREET: optStr,
  BOXTAL_SENDER_POSTAL_CODE: optStr,
  BOXTAL_SENDER_CITY: optStr,
  BOXTAL_SENDER_COUNTRY: optStr,

  // Mail (SMTP)
  MAILER_DSN: optStr,
  MAIL_FROM: optStr,

  // App
  BASE_URL: optUrl,
  CONTACT_EMAIL: optEmail,

  // Redis (optional — app works without it)
  REDIS_URL: optUrl,

  // Instagram
  BEHOLD_FEED_URL: optUrl,
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = z.prettifyError(result.error);

    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.error("Invalid environment variables:", formatted);
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.warn("Warning — missing/invalid env vars:", formatted);
    }

    return process.env as unknown as Env;
  }

  return result.data;
}

export const env = validateEnv();
