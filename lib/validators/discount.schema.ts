import { z } from "zod/v4";

export const createDiscountSchema = z.object({
  code: z.string().min(1, "Le code est requis").transform((v) => v.toUpperCase()),
  rule: z.object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number().positive("La valeur doit être positive"),
  }),
  is_dynamic: z.boolean().default(false),
  starts_at: z.iso.datetime().optional(),
  ends_at: z.iso.datetime().optional(),
  usage_limit: z.number().int().positive().optional(),
});

export const validateDiscountSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
