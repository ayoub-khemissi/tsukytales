import { z } from "zod/v4";

/** Treat empty strings as undefined so `.optional()` accepts them. */
const optStr = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().min(1).optional(),
);

const relaySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    network: z.string().optional(),
    address: z.record(z.string(), z.unknown()).optional(),
  })
  .optional();

const addressSchema = z.object({
  first_name: optStr,
  last_name: optStr,
  street: optStr,
  street_complement: z.string().optional(),
  zip_code: optStr,
  city: optStr,
  country: z.string().max(2).optional(),
  phone: optStr,
  relay: relaySchema,
});

/** Fields required for home delivery. */
const HOME_REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "street",
  "zip_code",
  "city",
  "phone",
] as const;

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1, "Au moins un article est requis"),
    shipping_address: addressSchema,
    billing_address: addressSchema.optional(),
    shipping_method: z.enum(["relay", "home"]),
    relay_code: z.string().optional(),
    discount_code: z.string().optional(),
    guest_email: z.string().email("Email invalide").optional(),
  })
  .refine(
    (data) => {
      if (data.shipping_method !== "home") return true;

      return HOME_REQUIRED_FIELDS.every(
        (f) => data.shipping_address[f] && data.shipping_address[f]!.length > 0,
      );
    },
    {
      message:
        "Tous les champs d'adresse sont requis pour la livraison à domicile",
      path: ["shipping_address"],
    },
  );

export const confirmOrderSchema = z.object({
  payment_intent_id: z.string().min(1, "ID de paiement requis"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
