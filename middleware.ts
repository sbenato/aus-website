import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use the edge-compatible config in middleware to avoid Node.js API warnings
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
