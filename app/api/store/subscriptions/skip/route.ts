import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/utils/logger";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { phase_date } = await req.json();
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) throw new AppError("Client introuvable", 404);

  const scheduleId = customer.metadata?.subscription_schedule_id;

  if (!scheduleId) throw new AppError("Aucun abonnement actif.", 400);

  const skippedPhases = (customer.metadata?.subscription_skipped ||
    []) as string[];

  // Check phase is in future (> 24h)
  const phaseTs = new Date(phase_date + "T00:00:00Z").getTime();

  if (phaseTs <= Date.now() + 24 * 3600 * 1000) {
    throw new AppError(
      "Impossible de passer une échéance à moins de 24h.",
      400,
    );
  }

  // Record the skip in metadata
  await customerRepository.updateMetadata(customer.id, {
    ...(customer.metadata || {}),
    subscription_skipped: [...skippedPhases, phase_date],
  });

  logger.info(
    `Subscription phase skipped: ${phase_date} for customer ${session.user.customerId}`,
  );

  return NextResponse.json({ success: true, skipped: phase_date });
});
