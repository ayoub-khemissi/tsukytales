import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { validate } from "@/lib/middleware/validate";
import { createAddressSchema } from "@/lib/validators/address.schema";
import { addressRepository } from "@/lib/repositories/address.repository";
import { withTransaction } from "@/lib/db/connection";
import { ResultSetHeader } from "mysql2";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireCustomer();
  const body = await req.json();
  const data = validate(createAddressSchema, body);
  const customerId = session.user.customerId!;

  const address = await withTransaction(async (connection) => {
    if (data.is_default) {
      await connection.execute<ResultSetHeader>(
        "UPDATE addresses SET is_default = 0 WHERE customer_id = ?",
        [customerId],
      );
    }

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO addresses (customer_id, label, first_name, last_name, street, street_complement, zip_code, city, country, phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        data.label,
        data.first_name,
        data.last_name,
        data.street,
        data.street_complement ?? null,
        data.zip_code,
        data.city,
        data.country ?? "FR",
        data.phone ?? null,
        data.is_default ? 1 : 0,
      ],
    );

    return addressRepository.findById(result.insertId);
  });

  return NextResponse.json({ success: true, address }, { status: 201 });
});
