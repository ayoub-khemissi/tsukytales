import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";

export async function POST() {
  const session = await getAdminSession();

  session.destroy();

  return NextResponse.json({ success: true });
}
