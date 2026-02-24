import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import * as instagramService from "@/lib/services/instagram.service";

export const GET = withErrorHandler(async () => {
  const data = await instagramService.getFeed();
  return NextResponse.json(data);
});
