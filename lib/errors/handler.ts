import { NextRequest, NextResponse } from "next/server";

import { AppError } from "./app-error";
import { logger } from "@/lib/utils/logger";

type RouteContext = { params: Promise<Record<string, string>> };

type RouteHandler = (
  req: NextRequest,
  context: RouteContext,
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }

      logger.error("Unhandled error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.nextUrl.pathname,
        method: req.method,
      });

      const message =
        process.env.NODE_ENV === "production"
          ? "Erreur interne du serveur"
          : error instanceof Error
            ? error.message
            : "Unknown error";

      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
