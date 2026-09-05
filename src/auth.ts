import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/db/client";
import { authConfig } from "@/auth.config";
import { DeletedProviderError, ensureProviderForEmail } from "@/lib/identity";
import { sendVerificationRequest } from "@/lib/identity/send-verification-request";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-insecure-auth-secret"),
  providers: [
    Nodemailer({
      server: process.env.AUTH_EMAIL_SERVER ?? "smtp://127.0.0.1:25",
      from: process.env.AUTH_EMAIL_FROM ?? "Ortak Randevu <noreply@localhost>",
      sendVerificationRequest,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
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
