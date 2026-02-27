import { z } from "zod/v4";

export const registerCustomerSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const updateCustomerSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.email().optional(),
  metadata: z
    .object({
      address: z.string().optional(),
      zip_code: z.string().optional(),
      city: z.string().optional(),
      phone: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const loginCustomerSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type LoginCustomerInput = z.infer<typeof loginCustomerSchema>;
