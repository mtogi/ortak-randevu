// Q-T14: Resend is the single transactional mail vendor for booking mail
// *and* magic links. SMTP stays as an escape hatch so local dev and the M2a
// setup keep working without a Resend key.
//
// Recipient addresses are PII (.cursor/rules/security.mdc) — log the subject
// and the transport, never the address.
import { createTransport } from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function mailFrom(): string {
  return (
    process.env.EMAIL_FROM ??
    process.env.AUTH_EMAIL_FROM ??
    "Ortak Randevu <noreply@localhost>"
  );
}

async function sendViaResend(apiKey: string, email: OutgoingEmail): Promise<void> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend rejected the message (HTTP ${response.status}).`);
  }
}

async function sendViaSmtp(server: string, email: OutgoingEmail): Promise<void> {
  const transport = createTransport(server);
  await transport.sendMail({
    to: email.to,
    from: mailFrom(),
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}

/** Whether a real transport is configured, i.e. mail will actually leave. */
export function hasMailTransport(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.AUTH_EMAIL_SERVER);
}

/**
 * Deliver one transactional email. Resend when `RESEND_API_KEY` is set,
 * otherwise SMTP when `AUTH_EMAIL_SERVER` is set. With neither, development
 * logs the subject; production refuses to pretend the mail was sent.
 */
export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await sendViaResend(resendKey, email);
    return;
  }

  const smtpServer = process.env.AUTH_EMAIL_SERVER;
  if (smtpServer) {
    await sendViaSmtp(smtpServer, email);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY (or AUTH_EMAIL_SERVER) is required to send email.");
  }

  console.info(
    `[mail] Not sent (no RESEND_API_KEY / AUTH_EMAIL_SERVER): "${email.subject}"`,
  );
}
