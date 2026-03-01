import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — NO Node.js APIs (no bcrypt, no mysql2).
 * Used by middleware.ts for route protection.
 * Providers are added in auth.ts (Node.js runtime only).
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/connexion",
  },
  providers: [], // Added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;

      // Protected customer routes — only customers can access
      if (pathname.startsWith("/compte")) {
        return auth?.user?.role === "customer";
      }

      // Protected admin routes
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        return auth?.user?.role === "admin";
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.customerId = user.customerId;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role;
      session.user.customerId = token.customerId;

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours
  },
} satisfies NextAuthConfig;
