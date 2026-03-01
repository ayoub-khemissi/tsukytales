import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { productRepository } from "@/lib/repositories/product.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import * as stripeCustomerService from "@/lib/services/stripe-customer.service";
import { stripe } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors/app-error";
import { settingsRepository } from "@/lib/repositories/settings.repository";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const { product_id, shipping } = await req.json();
  const customerId = session.user.customerId!;

  const product = await productRepository.findById(product_id);

  if (!product || !product.is_active) {
    throw new AppError("Ce produit n'est pas disponible.", 400);
  }
  if (product.stock <= 0) throw new AppError("Ce produit est épuisé.", 400);

  const customer = await customerRepository.findById(customerId);

  if (!customer) throw new AppError("Client introuvable", 404);
  if (customer.metadata?.subscription_schedule_id) {
    throw new AppError("Vous avez déjà un abonnement actif.", 400);
  }

  const stripeCustomerId =
    await stripeCustomerService.getOrCreateStripeCustomer(customer);

  // Subscription = free shipping
  const productPrice = Number(product.subscription_price ?? product.price);
  const totalPerQuarter = productPrice;

  // Create Stripe product + price
  const stripeProduct = await stripe.products.create({
    name: `Abonnement ${product.name}`,
    metadata: { product_id: String(product.id) },
  });
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(totalPerQuarter * 100),
    currency: "eur",
    recurring: { interval: "month", interval_count: 3 },
  });

  // Read subscription dates from global settings
  const subscriptionDates =
    (await settingsRepository.get<string[]>("subscription_dates")) ?? [];

  // Create SetupIntent
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    metadata: {
      product_id: String(product.id),
      stripe_price_id: stripePrice.id,
      subscription_dates: JSON.stringify(subscriptionDates),
      shipping: JSON.stringify(shipping || {}),
    },
  });

  return NextResponse.json({
    success: true,
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
    price_id: stripePrice.id,
    dates: subscriptionDates,
    total_per_quarter: totalPerQuarter,
  });
});
