/**
 * Subscription Maintenance CRON Script
 *
 * Tasks:
 * 1. Billing reminders — send email 3 days before each upcoming phase
 * 2. Cleanup — remove metadata from expired/cancelled subscriptions in Stripe
 * 3. Logs — status of skips per year
 *
 * Usage:
 *   pnpm cron:subscription
 *
 * Crontab (daily at 8am):
 *   0 8 * * * cd /path/to/tsukytales && NODE_ENV=production pnpm cron:subscription >> /var/log/tsukytales-cron.log 2>&1
 */

import Stripe from "stripe";
import mysql from "mysql2/promise";
import { sendBillingReminder } from "@/lib/mail";

// ─── Config ─────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
  timezone: "+00:00",
  decimalNumbers: true,
  typeCast(field, next) {
    if (field.type === "JSON") {
      const val = field.string("utf8");

      if (val === null) return null;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    return next();
  },
});

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contact@tsukytales.com";
const BASE_URL = process.env.BASE_URL || "https://tsukytales.com";

// ─── Helpers ────────────────────────────────────────────────────────

function log(level: string, message: string) {
  const ts = new Date().toISOString();

  console.log(`[${ts}] [${level}] ${message}`);
}

interface CustomerRow {
  id: number;
  email: string;
  first_name: string | null;
  metadata: Record<string, unknown> | null;
}

// ─── Task 1: Billing Reminders (3 days before) ─────────────────────

async function sendBillingReminders() {
  log("INFO", "=== Billing Reminders ===");

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, email, first_name, metadata FROM customers
     WHERE metadata IS NOT NULL
       AND subscription_schedule_id IS NOT NULL`,
  );

  const customers = rows as unknown as CustomerRow[];
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 3600 * 1000;
  let sent = 0;

  for (const customer of customers) {
    const scheduleId = customer.metadata?.subscription_schedule_id as string;

    if (!scheduleId) continue;

    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);

      if (schedule.status !== "active" && schedule.status !== "not_started") {
        continue;
      }

      const skippedPhases = (customer.metadata?.subscription_skipped ||
        []) as string[];

      for (const phase of schedule.phases) {
        const phaseStart = phase.start_date * 1000;
        const diff = phaseStart - now;
        const phaseDate = new Date(phaseStart)
          .toISOString()
          .split("T")[0];

        // Check if phase is ~3 days away (between 2.5 and 3.5 days)
        if (
          diff > 2.5 * 24 * 3600 * 1000 &&
          diff < 3.5 * 24 * 3600 * 1000 &&
          !skippedPhases.includes(phaseDate)
        ) {
          const formattedDate = new Date(phaseStart).toLocaleDateString(
            "fr-FR",
            { day: "2-digit", month: "long", year: "numeric" },
          );

          await sendBillingReminder({
            email: customer.email,
            firstName: customer.first_name,
            formattedDate,
            accountUrl: `${BASE_URL}/account?tab=subscription`,
          });

          sent++;
          log(
            "INFO",
            `Reminder sent to ${customer.email} for phase ${phaseDate}`,
          );
        }
      }
    } catch (err) {
      log(
        "ERROR",
        `Failed to process customer ${customer.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  log("INFO", `Billing reminders sent: ${sent}`);
}

// ─── Task 2: Cleanup Expired/Cancelled Subscriptions ────────────────

async function cleanupExpiredSubscriptions() {
  log("INFO", "=== Cleanup Expired Subscriptions ===");

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, email, metadata FROM customers
     WHERE metadata IS NOT NULL
       AND subscription_schedule_id IS NOT NULL`,
  );

  const customers = rows as unknown as CustomerRow[];
  let cleaned = 0;

  for (const customer of customers) {
    const scheduleId = customer.metadata?.subscription_schedule_id as string;

    if (!scheduleId) continue;

    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);

      if (
        schedule.status === "canceled" ||
        schedule.status === "completed"
      ) {
        // Remove subscription metadata
        const meta = { ...(customer.metadata || {}) };

        delete meta.subscription_schedule_id;
        delete meta.subscription_product_id;
        delete meta.subscription_skipped;
        delete meta.subscription_shipping;

        await pool.execute(
          "UPDATE customers SET metadata = ? WHERE id = ?",
          [JSON.stringify(meta), customer.id],
        );

        cleaned++;
        log(
          "INFO",
          `Cleaned metadata for customer ${customer.id} (schedule ${schedule.status})`,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      // If the schedule doesn't exist in Stripe, clean it up
      if (message.includes("No such subscription_schedule")) {
        const meta = { ...(customer.metadata || {}) };

        delete meta.subscription_schedule_id;
        delete meta.subscription_product_id;
        delete meta.subscription_skipped;
        delete meta.subscription_shipping;

        await pool.execute(
          "UPDATE customers SET metadata = ? WHERE id = ?",
          [JSON.stringify(meta), customer.id],
        );

        cleaned++;
        log(
          "INFO",
          `Cleaned orphaned schedule metadata for customer ${customer.id}`,
        );
      } else {
        log(
          "ERROR",
          `Failed to check schedule for customer ${customer.id}: ${message}`,
        );
      }
    }
  }

  log("INFO", `Expired subscriptions cleaned: ${cleaned}`);
}

// ─── Task 3: Skip Status Logs ───────────────────────────────────────

async function logSkipStatus() {
  log("INFO", "=== Skip Status Report ===");

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, email, metadata FROM customers
     WHERE metadata IS NOT NULL
       AND JSON_EXTRACT(metadata, '$.subscription_skipped') IS NOT NULL`,
  );

  const customers = rows as unknown as CustomerRow[];
  const currentYear = new Date().getFullYear();
  const skipsByYear: Record<number, number> = {};
  let totalSkips = 0;

  for (const customer of customers) {
    const skipped = (customer.metadata?.subscription_skipped || []) as string[];

    for (const date of skipped) {
      const year = parseInt(date.substring(0, 4));

      skipsByYear[year] = (skipsByYear[year] || 0) + 1;
      totalSkips++;
    }

    // Log current year skips per customer
    const thisYearSkips = skipped.filter((s) =>
      s.startsWith(String(currentYear)),
    ).length;

    if (thisYearSkips > 0) {
      log(
        "INFO",
        `Customer ${customer.id} (${customer.email}): ${thisYearSkips} skip(s) in ${currentYear}`,
      );
    }
  }

  log("INFO", `Total skips across all customers: ${totalSkips}`);
  for (const [year, count] of Object.entries(skipsByYear)) {
    log("INFO", `  Year ${year}: ${count} skip(s)`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  log("INFO", "========================================");
  log("INFO", "Subscription maintenance CRON started");
  log("INFO", "========================================");

  try {
    await sendBillingReminders();
    await cleanupExpiredSubscriptions();
    await logSkipStatus();
  } catch (err) {
    log(
      "ERROR",
      `Fatal error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
    log("INFO", "CRON completed");
  }
}

main();
