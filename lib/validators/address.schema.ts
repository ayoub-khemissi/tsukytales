import { z } from "zod/v4";

export const createAddressSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  street: z.string().min(1, "L'adresse est requise"),
  street_complement: z.string().optional(),
  zip_code: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  country: z.string().length(2).default("FR"),
  phone: z.string().optional(),
  is_default: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
