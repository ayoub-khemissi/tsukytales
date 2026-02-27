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

  // Check that this phase was actually skipped
  const skippedPhases = (customer.metadata?.subscription_skipped ||
    []) as string[];

  if (!skippedPhases.includes(phase_date)) {
    throw new AppError("Cette échéance n'est pas en pause.", 400);
  }

  // Check phase is > 24h in the future
  const phaseTs = new Date(phase_date + "T00:00:00Z").getTime();

  if (phaseTs <= Date.now() + 24 * 3600 * 1000) {
    throw new AppError(
      "Impossible d'annuler le saut à moins de 24h de l'échéance.",
      400,
    );
  }

  // Remove the date from skipped list
  const updatedSkipped = skippedPhases.filter((s) => s !== phase_date);

  await customerRepository.updateMetadata(customer.id, {
    ...(customer.metadata || {}),
    subscription_skipped: updatedSkipped,
  });

  logger.info(
    `Subscription phase unskipped: ${phase_date} for customer ${session.user.customerId}`,
  );

  return NextResponse.json({ success: true, unskipped: phase_date });
});
