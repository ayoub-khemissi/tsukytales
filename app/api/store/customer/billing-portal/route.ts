import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import * as stripeCustomerService from "@/lib/services/stripe-customer.service";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);
  if (!customer) throw new AppError("Client introuvable", 404);

  const stripeCustomerId = await stripeCustomerService.getOrCreateStripeCustomer(customer);
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const result = await stripeCustomerService.createBillingPortalSession(stripeCustomerId, `${baseUrl}/compte`);

  return NextResponse.json(result);
});
