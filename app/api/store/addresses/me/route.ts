import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireCustomer } from "@/lib/auth/helpers";
import { addressRepository } from "@/lib/repositories/address.repository";

export const GET = withErrorHandler(async () => {
  const session = await requireCustomer();
  const addresses = await addressRepository.findByCustomerId(session.user.customerId!);
  return NextResponse.json(addresses);
});
