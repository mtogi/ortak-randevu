import { getLocale, getTranslations } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { hasMailTransport, sendEmail } from "@/lib/mail/send";

type SendParams = {
  identifier: string;
  url: string;
};

async function requestLocale(): Promise<string> {
  try {
    const locale = await getLocale();
    return isLocale(locale) ? locale : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/**
 * Deliver a magic link. Q-T14: this goes through the same sender as booking
 * mail (Resend when configured, SMTP otherwise), so there is one mail vendor
 * to verify a domain with. Without either, development logs the URL — never
 * the address, which is PII.
 */
export async function sendVerificationRequest({
  identifier,
  url,
}: SendParams): Promise<void> {
  if (!hasMailTransport() && process.env.NODE_ENV !== "production") {
    console.info("[auth] Magic link (not emailed; no mail transport configured):", url);
    return;
  }

  const locale = await requestLocale();
  const t = await getTranslations({ locale, namespace: "email.magicLink" });

  await sendEmail({
    to: identifier,
    subject: t("subject"),
    text: `${t("body")}\n\n${url}\n`,
    html: `<p>${t("body")}</p>\n<p><a href="${url}">${t("cta")}</a></p>`,
  });
}
