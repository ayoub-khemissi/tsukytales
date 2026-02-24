import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { stripe } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/utils/logger";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { phase_date } = await req.json();
  const customer = await customerRepository.findById(session.user.customerId!);
  if (!customer) throw new AppError("Client introuvable", 404);

  const scheduleId = customer.metadata?.subscription_schedule_id;
  if (!scheduleId) throw new AppError("Aucun abonnement actif.", 400);

  // Check yearly quota
  const skippedPhases = (customer.metadata?.subscription_skipped || []) as string[];
  const currentYear = new Date().getFullYear();
  const skipsThisYear = skippedPhases.filter((s: string) => s.startsWith(String(currentYear))).length;
  if (skipsThisYear >= 1) {
    throw new AppError("Vous avez déjà utilisé votre passe pour cette année.", 400);
  }

  // Check phase is in future
  const phaseTs = new Date(phase_date + "T00:00:00Z").getTime();
  if (phaseTs <= Date.now()) {
    throw new AppError("Impossible de passer une échéance déjà passée.", 400);
  }

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  const now = Math.floor(Date.now() / 1000);

  // Rebuild phases without the skipped one
  const currentPhase = schedule.phases.find((p) => p.start_date <= now && p.end_date > now);
  const remainingPhases = schedule.phases
    .filter((p) => p.start_date > now)
    .filter((p) => new Date(p.start_date * 1000).toISOString().split("T")[0] !== phase_date)
    .map((p) => ({
      items: p.items.map((i) => ({ price: typeof i.price === "string" ? i.price : (i.price as { id: string }).id })),
      start_date: p.start_date,
      end_date: p.end_date,
    }));

  const newPhases = [];
  if (currentPhase) {
    newPhases.push({
      items: currentPhase.items.map((i) => ({ price: typeof i.price === "string" ? i.price : (i.price as { id: string }).id })),
      start_date: currentPhase.start_date,
      end_date: currentPhase.end_date,
    });
  }
  newPhases.push(...remainingPhases);

  if (newPhases.length > 0) {
    await stripe.subscriptionSchedules.update(scheduleId, {
      phases: newPhases,
      end_behavior: "cancel",
    });
  }

  // Record the skip
  await customerRepository.updateMetadata(customer.id, {
    ...(customer.metadata || {}),
    subscription_skipped: [...skippedPhases, phase_date],
  });

  logger.info(`Subscription phase skipped: ${phase_date} for customer ${session.user.customerId}`);
  return NextResponse.json({ success: true, skipped: phase_date });
});
