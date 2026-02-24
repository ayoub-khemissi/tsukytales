import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { discountRepository } from "@/lib/repositories/discount.repository";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ valid: false, message: "Code requis" }, { status: 400 });

  const discount = await discountRepository.findByCode(code);
  if (!discount) return NextResponse.json({ valid: false, message: "Code invalide" });

  return NextResponse.json({ valid: true, discount });
});
