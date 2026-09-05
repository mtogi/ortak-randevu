import { createTransport } from "nodemailer";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";

type SendParams = {
  identifier: string;
  url: string;
  provider: NodemailerConfig;
};

/**
 * Deliver a magic link. SMTP (`AUTH_EMAIL_SERVER`) is optional.
 * Resend is intentionally unused until M2c. Without SMTP, development logs
 * the URL (not the email address). Production refuses to silently succeed.
 */
export async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: SendParams): Promise<void> {
  const server = process.env.AUTH_EMAIL_SERVER;
  if (server) {
    const transport = createTransport(server);
    await transport.sendMail({
      to: identifier,
      from: provider.from,
      subject: "Sign in to Ortak Randevu",
      text: `Open this link to sign in:\n${url}\n`,
      html: `<p><a href="${url}">Sign in to Ortak Randevu</a></p>`,
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_EMAIL_SERVER is required to send magic links in production.");
  }

  console.info("[auth] Magic link (not emailed; no AUTH_EMAIL_SERVER):", url);
}
