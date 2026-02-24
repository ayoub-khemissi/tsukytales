import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import * as stripeCustomerService from "@/lib/services/stripe-customer.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await requireCustomer();
  const { id } = await context!.params;
  const customer = await customerRepository.findById(session.user.customerId!);

  if (!customer) throw new AppError("Client introuvable", 404);

  const stripeCustomerId =
    await stripeCustomerService.getOrCreateStripeCustomer(customer);

  await stripeCustomerService.setDefaultPaymentMethod(id, stripeCustomerId);

  return NextResponse.json({ success: true });
});
