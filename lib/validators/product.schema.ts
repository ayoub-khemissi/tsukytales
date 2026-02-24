import { z } from "zod/v4";

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
  subscription_price: z.number().positive().optional(),
  subscription_dates: z.array(z.string()).optional(),
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
