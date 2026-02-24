import { auth } from "./auth";

import { AppError } from "@/lib/errors/app-error";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new AppError("Non authentifié", 401);
  }

  return session;
}

export async function requireCustomer() {
  const session = await requireAuth();

  if (session.user.role !== "customer") {
    throw new AppError("Accès réservé aux clients", 403);
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new AppError("Accès réservé aux administrateurs", 403);
  }

  return session;
}
