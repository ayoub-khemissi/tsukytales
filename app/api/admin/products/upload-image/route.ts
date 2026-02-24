import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";
import { AppError } from "@/lib/errors/app-error";

const productsImgDir = path.join(process.cwd(), "public/assets/img/products");

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) throw new AppError("Aucune image reçue", 400);

  // Validate file
  if (!file.type.startsWith("image/")) {
    throw new AppError("Format non autorisé", 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError("Image trop volumineuse (max 5 Mo)", 400);
  }

  // Ensure directory exists
  if (!fs.existsSync(productsImgDir)) {
    fs.mkdirSync(productsImgDir, { recursive: true });
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `product-${Date.now()}${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  fs.writeFileSync(path.join(productsImgDir, filename), buffer);

  return NextResponse.json({ success: true, url: `assets/img/products/${filename}` });
});
