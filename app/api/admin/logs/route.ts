import path from "path";
import fs from "fs";

import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth/helpers";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const level = searchParams.get("level") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;
  const pageParam = Number(searchParams.get("page") || 1);
  const limitParam = Number(searchParams.get("limit") || 50);

  const logPath = path.join(process.cwd(), "logs/errors.log");

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ logs: [], total: 0 });
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(-500)
    .reverse();
  // Strip ANSI escape codes from log values
  const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, "");

  let logs = lines.map((line) => {
    try {
      const parsed = JSON.parse(line);

      return {
        ...parsed,
        level:
          typeof parsed.level === "string"
            ? stripAnsi(parsed.level)
            : parsed.level,
        message:
          typeof parsed.message === "string"
            ? stripAnsi(parsed.message)
            : parsed.message,
      };
    } catch {
      return {
        message: stripAnsi(line),
        level: "error",
        timestamp: new Date().toISOString(),
      };
    }
  });

  // In-memory search
  if (search) {
    const s = search.toLowerCase();

    logs = logs.filter(
      (l) =>
        typeof l.message === "string" && l.message.toLowerCase().includes(s),
    );
  }

  // In-memory level filter
  if (level && level !== "all") {
    logs = logs.filter((l) => l.level === level);
  }

  // In-memory sorting
  const allowedSort = ["timestamp", "level"];

  if (sortBy && allowedSort.includes(sortBy)) {
    const dir = sortOrder === "asc" ? 1 : -1;

    logs.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return av.localeCompare(bv) * dir;

      return 0;
    });
  }

  // In-memory pagination
  const total = logs.length;
  const start = (pageParam - 1) * limitParam;
  const paged = logs.slice(start, start + limitParam);

  return NextResponse.json({ logs: paged, total });
});
