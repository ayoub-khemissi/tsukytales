import { NextResponse } from "next/server";

import { isMaintenanceMode } from "@/lib/maintenance";

export async function GET() {
  const maintenance = await isMaintenanceMode();

  return NextResponse.json(
    { maintenance },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } },
  );
}
