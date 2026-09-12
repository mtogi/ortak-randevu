import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/db/client";
import { authConfig } from "@/auth.config";
import {
  DeletedProviderError,
  ensureProviderForEmail,
  googleEmailIsVerified,
  isGoogleSignInEnabled,
  normalizeEmail,
} from "@/lib/identity";
import { sendVerificationRequest } from "@/lib/identity/send-verification-request";

function authProviders(): NextAuthConfig["providers"] {
  const providers: NextAuthConfig["providers"] = [
    Nodemailer({
      server: process.env.AUTH_EMAIL_SERVER ?? "smtp://127.0.0.1:25",
      from: process.env.AUTH_EMAIL_FROM ?? "Ortak Randevu <noreply@localhost>",
      sendVerificationRequest,
    }),
  ];
  if (isGoogleSignInEnabled()) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: normalizeEmail(profile.email),
            image: profile.picture,
          };
        },
      }),
    );
  }
  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-insecure-auth-secret"),
  providers: authProviders(),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      if (account?.provider === "google" && !googleEmailIsVerified(profile)) {
        return false;
      }
      try {
        await ensureProviderForEmail(prisma, user.email);
        return true;
      } catch (error) {
        if (error instanceof DeletedProviderError) return false;
        throw error;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const provider = await ensureProviderForEmail(prisma, user.email);
        token.providerId = provider.id;
        token.slug = provider.slug;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.providerId === "string") {
        session.providerId = token.providerId;
        session.slug = typeof token.slug === "string" ? token.slug : "";
      }
      return session;
    },
  },
});
