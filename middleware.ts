import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";

import { routing } from "./i18n/routing";

import { authConfig } from "@/lib/auth/auth.config";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tsuky Tales — Maintenance</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
      background-color: #FDF7FF;
      background-image: url("/assets/img/bg.png");
      background-repeat: repeat;
      background-size: 300px;
      color: #3D0F48;
      text-align: center;
      padding: 2rem;
      overflow-x: hidden;
    }
    .card {
      max-width: 520px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      box-shadow: 0 4px 30px rgba(88, 22, 104, 0.1);
      position: relative;
      z-index: 1;
      animation: fadeIn 1s ease-out;
    }
    .logo {
      width: 200px;
      margin: 0 auto 2rem;
    }
    .divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #D4AF37, transparent);
      margin: 0 auto 1.5rem;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 400;
      font-style: italic;
      color: #581668;
      margin-bottom: 0.8rem;
      letter-spacing: 0.02em;
    }
    p {
      font-size: 0.95rem;
      font-weight: 300;
      color: #4A4A4A;
      line-height: 1.8;
    }
    .sparkle {
      position: fixed;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #c882dc;
      opacity: 0;
      animation: sparkle 4s ease-in-out infinite;
    }
    .sparkle:nth-child(1) { top: 15%; left: 20%; animation-delay: 0s; }
    .sparkle:nth-child(2) { top: 30%; left: 75%; animation-delay: 1.2s; }
    .sparkle:nth-child(3) { top: 65%; left: 10%; animation-delay: 2.4s; }
    .sparkle:nth-child(4) { top: 80%; left: 85%; animation-delay: 0.8s; }
    .sparkle:nth-child(5) { top: 45%; left: 90%; animation-delay: 3s; }
    .sparkle:nth-child(6) { top: 10%; left: 50%; animation-delay: 1.8s; }
    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dot { display: inline-block; animation: pulse 1.5s infinite; }
    .dot:nth-child(2) { animation-delay: 0.3s; }
    .dot:nth-child(3) { animation-delay: 0.6s; }
    @keyframes pulse { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
  </style>
</head>
<body>
  <div class="sparkle"></div>
  <div class="sparkle"></div>
  <div class="sparkle"></div>
  <div class="sparkle"></div>
  <div class="sparkle"></div>
  <div class="sparkle"></div>
  <div class="card">
    <img class="logo" src="/assets/img/logo.svg" alt="Tsuky Tales">
    <div class="divider"></div>
    <h1>Nous pr\u00e9parons quelque chose de magique<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></h1>
    <p>Le site revient tr\u00e8s bient\u00f4t. Merci pour votre patience !</p>
  </div>
</body>
</html>`;

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

  // Maintenance mode — block all pages except admin
  if (process.env.MAINTENANCE_MODE === "true" && !pathname.includes("/admin")) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "3600",
        "Cache-Control": "no-store",
      },
    });
  }

  // Extract locale-stripped path for auth checks
  const locales = routing.locales;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  const strippedPath = pathnameHasLocale
    ? "/" + pathname.split("/").slice(2).join("/")
    : pathname;

  const needsAuth =
    strippedPath.startsWith("/account") || strippedPath.startsWith("/admin");
  const isGuestOnly = strippedPath === "/login" || strippedPath === "/register";

  if (needsAuth || isGuestOnly) {
    const session = await auth();
    const locale = pathnameHasLocale
      ? pathname.split("/")[1]
      : routing.defaultLocale;
    const buildUrl = (path: string) =>
      new URL(
        locale === routing.defaultLocale ? path : `/${locale}${path}`,
        req.url,
      );

    // Logged-in customers cannot access login/register → redirect to account
    if (isGuestOnly && session?.user?.role === "customer") {
      return Response.redirect(buildUrl("/account"));
    }

    // Non-customer users cannot access /account → redirect to login
    if (
      strippedPath.startsWith("/account") &&
      session?.user?.role !== "customer"
    ) {
      const loginUrl = buildUrl("/login");

      loginUrl.searchParams.set("callbackUrl", pathname);

      return Response.redirect(loginUrl);
    }

    // Non-admin users cannot access /admin (except /admin/login)
    if (
      strippedPath.startsWith("/admin") &&
      !strippedPath.startsWith("/admin/login") &&
      session?.user?.role !== "admin"
    ) {
      return Response.redirect(buildUrl("/admin/login"));
    }
  }

  // Apply i18n middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
