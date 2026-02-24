import type { CustomerRow } from "@/types/db.types";

import { stripe } from "./payment.service";

import { customerRepository } from "@/lib/repositories/customer.repository";

export async function getOrCreateStripeCustomer(
  customer: CustomerRow,
): Promise<string> {
  let stripeCustomerId = customer.metadata?.stripe_customer_id;

  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name:
        [customer.first_name, customer.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || undefined,
      metadata: { customer_id: String(customer.id) },
    });

    stripeCustomerId = stripeCustomer.id;

    await customerRepository.updateMetadata(customer.id, {
      ...(customer.metadata || {}),
      stripe_customer_id: stripeCustomerId,
    });
  }

  return stripeCustomerId;
}

export async function listPaymentMethods(stripeCustomerId: string) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  });

  const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
  const defaultPm =
    typeof stripeCustomer !== "string" && !stripeCustomer.deleted
      ? stripeCustomer.invoice_settings?.default_payment_method
      : null;

  return paymentMethods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand,
    last4: pm.card?.last4,
    exp_month: pm.card?.exp_month,
    exp_year: pm.card?.exp_year,
    is_default: pm.id === defaultPm,
  }));
}

export async function createSetupIntent(stripeCustomerId: string) {
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
  });

  return { client_secret: setupIntent.client_secret };
}

export async function detachPaymentMethod(
  paymentMethodId: string,
  stripeCustomerId: string,
) {
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (pm.customer !== stripeCustomerId) {
    throw new Error("Ce moyen de paiement ne vous appartient pas.");
  }
  await stripe.paymentMethods.detach(paymentMethodId);
}

export async function setDefaultPaymentMethod(
  paymentMethodId: string,
  stripeCustomerId: string,
) {
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (pm.customer !== stripeCustomerId) {
    throw new Error("Ce moyen de paiement ne vous appartient pas.");
  }
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}
