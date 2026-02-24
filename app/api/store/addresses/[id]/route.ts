import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { validate } from "@/lib/middleware/validate";
import { updateAddressSchema } from "@/lib/validators/address.schema";
import { addressRepository } from "@/lib/repositories/address.repository";
import { withTransaction } from "@/lib/db/connection";
import { AppError } from "@/lib/errors/app-error";
import { ResultSetHeader } from "mysql2";

export const PUT = withErrorHandler(async (req: NextRequest, context) => {
  const session = await requireCustomer();
  const { id } = await context!.params;
  const body = await req.json();
  const data = validate(updateAddressSchema, body);
  const customerId = session.user.customerId!;

  const address = await withTransaction(async (connection) => {
    const existing = await addressRepository.findOneByCustomer(parseInt(id), customerId);
    if (!existing) throw new AppError("Adresse introuvable", 404);

    if (data.is_default) {
      await connection.execute<ResultSetHeader>(
        "UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND id != ?",
        [customerId, id],
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...data };
    if (updateData.is_default !== undefined) {
      updateData.is_default = updateData.is_default ? 1 : 0;
    }

    await addressRepository.update(parseInt(id), updateData);
    return addressRepository.findById(parseInt(id));
  });

  return NextResponse.json({ success: true, address });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await requireCustomer();
  const { id } = await context!.params;
  const customerId = session.user.customerId!;

  const address = await addressRepository.findOneByCustomer(parseInt(id), customerId);
  if (!address) throw new AppError("Adresse introuvable", 404);

  if (address.is_default) {
    const count = await addressRepository.countByCustomer(customerId);
    if (count === 1) {
      throw new AppError("Impossible de supprimer votre seule adresse. Ajoutez-en une autre d'abord.", 400);
    }
  }

  await addressRepository.delete(parseInt(id));
  return NextResponse.json({ success: true, message: "Adresse supprimée avec succès." });
});
