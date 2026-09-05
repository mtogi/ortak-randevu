import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe Auth.js config. No Prisma. Full Node config is `src/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/sent",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
} satisfies NextAuthConfig;
