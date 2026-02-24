import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { validate } from "@/lib/middleware/validate";
import { updateCustomerSchema } from "@/lib/validators/customer.schema";

export const GET = withErrorHandler(async () => {
  const session = await requireCustomer();
  const customer = await customerRepository.findById(session.user.customerId!);
  if (!customer) return NextResponse.json({ message: "Client introuvable" }, { status: 404 });

  const { password: _, ...safe } = customer;
  return NextResponse.json(safe);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const body = await req.json();
  const data = validate(updateCustomerSchema, body);

  const customer = await customerRepository.findById(session.user.customerId!);
  if (!customer) return NextResponse.json({ message: "Client introuvable" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};
  if (data.first_name) updateData.first_name = data.first_name;
  if (data.last_name) updateData.last_name = data.last_name;
  if (data.email) updateData.email = data.email;
  if (data.metadata) updateData.metadata = JSON.stringify({ ...(customer.metadata || {}), ...data.metadata });
  if (data.preferences) updateData.preferences = JSON.stringify({ ...(customer.preferences || {}), ...data.preferences });

  await customerRepository.update(session.user.customerId!, updateData);
  return NextResponse.json({ success: true, message: "Profil mis à jour avec succès." });
});
