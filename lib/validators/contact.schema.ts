import { z } from "zod/v4";

export const contactSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.email("Email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

export type ContactInput = z.infer<typeof contactSchema>;
