import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { stripe } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/utils/logger";

export const POST = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) throw new AppError("Client introuvable", 404);

  const scheduleId = customer.metadata?.subscription_schedule_id;

  if (!scheduleId) throw new AppError("Aucun abonnement actif.", 400);

  // Cancel on Stripe — must succeed before updating local state
  await stripe.subscriptionSchedules.cancel(scheduleId);

  const meta = { ...(customer.metadata || {}) };

  delete meta.subscription_schedule_id;
  // Keep subscription_product_id so we can show history
  await customerRepository.updateMetadata(customer.id, meta);

  logger.info(`Subscription schedule cancelled: ${scheduleId}`);

  return NextResponse.json({ success: true });
});
