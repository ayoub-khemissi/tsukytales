import Stripe from "stripe";

import { stripe } from "@/lib/services/payment.service";
import { pool } from "@/lib/db/connection";
import { logger } from "@/lib/utils/logger";
import { CustomerRow } from "@/types/db.types";

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

/**
 * Sync all active Stripe SubscriptionSchedules with new subscription dates.
 * Called when admin updates subscription dates in settings.
 */
export async function syncAllSchedules(
  newDates: string[],
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  // Find all customers with a subscription_schedule_id in metadata
  const [rows] = await pool.execute<CustomerRow[]>(
    "SELECT id, metadata FROM customers WHERE subscription_schedule_id IS NOT NULL",
  );

  const newTimestamps = newDates.map((d) =>
    Math.floor(new Date(d + "T00:00:00Z").getTime() / 1000),
  );

  for (const row of rows) {
    const scheduleId = row.metadata?.subscription_schedule_id;

    if (!scheduleId) {
      result.skipped++;
      continue;
    }

    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);

      if (
        schedule.status === "completed" ||
        schedule.status === "canceled" ||
        schedule.status === "released"
      ) {
        result.skipped++;
        continue;
      }

      const priceId = extractPriceId(schedule);

      if (!priceId) {
        result.errors.push(
          `Customer ${row.id}: impossible de déterminer le price_id du schedule ${scheduleId}`,
        );
        continue;
      }

      const updatedPhases = buildUpdatedPhases(
        schedule,
        newTimestamps,
        priceId,
      );

      await stripe.subscriptionSchedules.update(scheduleId, {
        phases: updatedPhases,
      });

      result.synced++;
      logger.info(
        `Synced schedule ${scheduleId} for customer ${row.id} with ${updatedPhases.length} phases`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      result.errors.push(`Customer ${row.id} (${scheduleId}): ${msg}`);
      logger.error(`Failed to sync schedule ${scheduleId}: ${msg}`);
    }
  }

  logger.info(
    `Subscription sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.errors.length} errors`,
  );

  return result;
}

function extractPriceId(schedule: Stripe.SubscriptionSchedule): string | null {
  for (const phase of schedule.phases) {
    if (phase.items?.[0]?.price) {
      const price = phase.items[0].price;

      return typeof price === "string" ? price : price.id;
    }
  }

  return null;
}

function buildUpdatedPhases(
  schedule: Stripe.SubscriptionSchedule,
  newTimestamps: number[],
  priceId: string,
): Stripe.SubscriptionScheduleUpdateParams.Phase[] {
  const now = Math.floor(Date.now() / 1000);

  if (schedule.status === "not_started") {
    // Replace all phases with new dates
    return newTimestamps.map((start, i) => ({
      items: [{ price: priceId }],
      start_date: start,
      end_date: newTimestamps[i + 1] || start + 90 * 24 * 3600,
    }));
  }

  // Status === "active": keep past/current phases, replace future ones
  const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [];

  // Find the current phase index
  let currentPhaseIdx = -1;

  for (let i = 0; i < schedule.phases.length; i++) {
    const phase = schedule.phases[i];

    if (phase.start_date <= now && phase.end_date > now) {
      currentPhaseIdx = i;
      break;
    }
  }

  if (currentPhaseIdx === -1) {
    // No current phase found — shouldn't happen for active schedule,
    // but fall back to full replacement
    return newTimestamps.map((start, i) => ({
      items: [{ price: priceId }],
      start_date: start,
      end_date: newTimestamps[i + 1] || start + 90 * 24 * 3600,
    }));
  }

  // Keep past phases as-is
  for (let i = 0; i < currentPhaseIdx; i++) {
    const phase = schedule.phases[i];

    phases.push({
      items: [{ price: priceId }],
      start_date: phase.start_date as number,
      end_date: phase.end_date as number,
    });
  }

  // Find the first new timestamp that's in the future
  const futureDates = newTimestamps.filter((ts) => ts > now);

  if (futureDates.length === 0) {
    // No future dates — keep current phase as-is and end there
    const currentPhase = schedule.phases[currentPhaseIdx];

    phases.push({
      items: [{ price: priceId }],
      start_date: currentPhase.start_date as number,
      end_date: currentPhase.end_date as number,
    });

    return phases;
  }

  // Current phase: bridge its end_date to the first future new date
  const currentPhase = schedule.phases[currentPhaseIdx];

  phases.push({
    items: [{ price: priceId }],
    start_date: currentPhase.start_date as number,
    end_date: futureDates[0],
  });

  // Add new future phases
  for (let i = 0; i < futureDates.length; i++) {
    phases.push({
      items: [{ price: priceId }],
      start_date: futureDates[i],
      end_date: futureDates[i + 1] || futureDates[i] + 90 * 24 * 3600,
    });
  }

  return phases;
}
