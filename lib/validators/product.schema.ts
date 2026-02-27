import { z } from "zod/v4";

const translationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

const translationsSchema = z
  .object({
    en: translationSchema.optional(),
    es: translationSchema.optional(),
    de: translationSchema.optional(),
    it: translationSchema.optional(),
  })
  .optional();

export const createProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être positif"),
  stock: z.number().int().min(0).default(0),
  image: z.string().optional(),
  is_preorder: z.boolean().default(false),
  weight: z.number().positive().default(1.0),
  length: z.number().positive().default(21.0),
  width: z.number().positive().default(15.0),
  height: z.number().positive().default(3.0),
  is_subscription: z.boolean().default(false),
  is_active: z.boolean().default(false),
  subscription_price: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
  translations: translationsSchema,
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  updates: z.array(
    z.object({
      product_id: z.number().int().positive(),
      stock: z.number().int().min(0),
    }),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
