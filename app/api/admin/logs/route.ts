import path from "path";
import fs from "fs";

import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";

export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const logPath = path.join(process.cwd(), "logs/errors.log");

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ logs: [] });
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(-200)
    .reverse();
  const logs = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return {
        message: line,
        level: "error",
        timestamp: new Date().toISOString(),
      };
    }
  });

  return NextResponse.json({ logs });
});
