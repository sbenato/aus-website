import type { NextAuthConfig } from "next-auth";

/**
 * Routes that require authentication.
 * key: path prefix, value: message shown on the login page.
 */
const PROTECTED_ROUTES: Record<string, string> = {
};

/**
 * Edge-compatible auth config (no Node.js-only APIs).
 * Used by middleware for session checks only.
 * The full provider config lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const matched = Object.entries(PROTECTED_ROUTES).find(([prefix]) =>
        nextUrl.pathname.startsWith(prefix)
      );

      if (matched) {
        if (isLoggedIn) return true;
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        loginUrl.searchParams.set("reason", matched[1]);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
  providers: [],
};