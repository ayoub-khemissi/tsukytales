import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { productRepository } from "@/lib/repositories/product.repository";
import * as stripeCustomerService from "@/lib/services/stripe-customer.service";
import { stripe } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/utils/logger";
import { settingsRepository } from "@/lib/repositories/settings.repository";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { setup_intent_id } = await req.json();
  const customerId = session.user.customerId!;

  const customer = await customerRepository.findById(customerId);

  if (!customer) throw new AppError("Client introuvable", 404);

  const stripeCustomerId =
    await stripeCustomerService.getOrCreateStripeCustomer(customer);
  const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);

  if (setupIntent.status !== "succeeded") {
    throw new AppError("Le moyen de paiement n'a pas été confirmé.", 400);
  }

  // Set default payment method
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: {
      default_payment_method: setupIntent.payment_method as string,
    },
  });

  const meta = setupIntent.metadata!;
  const priceId = meta.stripe_price_id;
  const dates: string[] =
    (await settingsRepository.get<string[]>("subscription_dates")) ?? [];

  const timestamps = dates.map((d) =>
    Math.floor(new Date(d + "T00:00:00Z").getTime() / 1000),
  );
  const phases = timestamps.map((start, i) => ({
    items: [{ price: priceId }],
    end_date: timestamps[i + 1] || start + 90 * 24 * 3600,
  }));

  const schedule = await stripe.subscriptionSchedules.create({
    customer: stripeCustomerId,
    start_date: timestamps[0],
    end_behavior: "cancel",
    phases,
    metadata: { product_id: meta.product_id, customer_id: String(customerId) },
  });

  // Store in customer metadata
  const shippingInfo = meta.shipping ? JSON.parse(meta.shipping) : {};

  await customerRepository.updateMetadata(customerId, {
    ...(customer.metadata || {}),
    subscription_schedule_id: schedule.id,
    subscription_product_id: meta.product_id,
    subscription_shipping: shippingInfo,
  });

  // Decrement stock
  await productRepository.decrementStock(parseInt(meta.product_id));

  logger.info(
    `Subscription schedule created: ${schedule.id} for customer ${customerId}`,
  );

  return NextResponse.json({ success: true, schedule_id: schedule.id });
});
