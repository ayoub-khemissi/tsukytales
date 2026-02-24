import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import NextAuth from "next-auth";

import { routing } from "./i18n/routing";

import { authConfig } from "@/lib/auth/auth.config";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip i18n for API routes and static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Extract locale-stripped path for auth checks
  const locales = routing.locales;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  const strippedPath = pathnameHasLocale
    ? "/" + pathname.split("/").slice(2).join("/")
    : pathname;

  // Auth protection for /account/* and /admin/* (except /admin/login)
  if (
    strippedPath.startsWith("/account") ||
    strippedPath.startsWith("/admin")
  ) {
    const session = await auth();

    if (strippedPath.startsWith("/account") && !session?.user) {
      const locale = pathnameHasLocale
        ? pathname.split("/")[1]
        : routing.defaultLocale;
      const loginUrl = new URL(
        locale === routing.defaultLocale ? "/login" : `/${locale}/login`,
        req.url,
      );

      loginUrl.searchParams.set("callbackUrl", pathname);

      return Response.redirect(loginUrl);
    }

    if (
      strippedPath.startsWith("/admin") &&
      !strippedPath.startsWith("/admin/login") &&
      session?.user?.role !== "admin"
    ) {
      const locale = pathnameHasLocale
        ? pathname.split("/")[1]
        : routing.defaultLocale;
      const adminLoginUrl = new URL(
        locale === routing.defaultLocale
          ? "/admin/login"
          : `/${locale}/admin/login`,
        req.url,
      );

      return Response.redirect(adminLoginUrl);
    }
  }

  // Apply i18n middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
