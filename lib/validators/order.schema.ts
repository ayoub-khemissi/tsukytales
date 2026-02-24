import { z } from "zod/v4";

const addressSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  street_complement: z.string().optional(),
  zip_code: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().max(2).optional(),
  phone: z.string().optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        variant_id: z.number().int().positive().optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Au moins un article est requis"),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional(),
  shipping_method: z.enum(["relay", "home"]),
  relay_code: z.string().optional(),
  discount_code: z.string().optional(),
});

export const confirmOrderSchema = z.object({
  payment_intent_id: z.string().min(1, "ID de paiement requis"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
