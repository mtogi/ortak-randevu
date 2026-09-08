// Booking notifications (Q-T6 email-first, Q-T14 Resend). Copy lives in
// `messages/{en,tr}.json` under `email.*` so there are no hardcoded
// user-facing strings, and each recipient is rendered in their own locale.
import { getTranslations } from "next-intl/server";
import { formatSlotRange, formatSlotStart } from "@/lib/booking/format";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { sendEmail } from "./send";

export type BookingMailEvent =
  | "created"
  | "cancelled"
  | "rescheduled"
  | "cancelledByProvider"
  | "rescheduledByProvider";

export type BookingMailContext = {
  manageUrl: string;
  guest: { name: string | null; email: string | null; locale: Locale };
  provider: {
    name: string | null;
    email: string | null;
    timezone: string;
    locale: string;
  };
  service: { title: string };
  startAt: Date;
  endAt: Date;
  /** Cancel/reschedule deadline (Q-P6). Omitted once the booking is cancelled. */
  modifyDeadline: Date | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlBody(paragraphs: string[], cta?: { url: string; label: string }): string {
  const blocks = paragraphs.map((line) => `<p>${escapeHtml(line)}</p>`);
  if (cta) {
    blocks.push(`<p><a href="${escapeHtml(cta.url)}">${escapeHtml(cta.label)}</a></p>`);
  }
  return blocks.join("\n");
}

function textBody(paragraphs: string[], cta?: { url: string; label: string }): string {
  const lines = [...paragraphs];
  if (cta) lines.push(`${cta.label}: ${cta.url}`);
  return `${lines.join("\n\n")}\n`;
}

/**
 * Notify both parties about a booking transition. Mail failures must never
 * roll back a confirmed booking, so callers are expected to catch: a lost
 * email is recoverable, a lost booking is not.
 */
export async function sendBookingEmails(
  event: BookingMailEvent,
  context: BookingMailContext,
): Promise<void> {
  const guestLocale = context.guest.locale;
  const providerLocale = isLocale(context.provider.locale)
    ? context.provider.locale
    : "en";

  const [guestT, providerT] = await Promise.all([
    getTranslations({ locale: guestLocale, namespace: "email" }),
    getTranslations({ locale: providerLocale, namespace: "email" }),
  ]);

  const when = {
    guest: formatSlotRange(
      context.startAt,
      context.endAt,
      context.provider.timezone,
      guestLocale,
    ),
    provider: formatSlotRange(
      context.startAt,
      context.endAt,
      context.provider.timezone,
      providerLocale,
    ),
  };
  const providerName = context.provider.name ?? "";
  const guestName = context.guest.name ?? "";

  const guestParagraphs = [
    guestT(`booking.${event}.guestBody`, {
      service: context.service.title,
      provider: providerName,
      when: when.guest,
    }),
  ];
  if (context.modifyDeadline) {
    guestParagraphs.push(
      guestT("policy", {
        deadline: formatSlotStart(
          context.modifyDeadline,
          context.provider.timezone,
          guestLocale,
        ),
      }),
    );
  }
  const guestCta = { url: context.manageUrl, label: guestT("manageCta") };

  const sends: Promise<void>[] = [];
  if (context.guest.email) {
    sends.push(
      sendEmail({
        to: context.guest.email,
        subject: guestT(`booking.${event}.guestSubject`, {
          service: context.service.title,
          when: when.guest,
        }),
        text: textBody(guestParagraphs, guestCta),
        html: htmlBody(guestParagraphs, guestCta),
      }),
    );
  }
  if (context.provider.email) {
    sends.push(
      sendEmail({
        to: context.provider.email,
        subject: providerT(`booking.${event}.providerSubject`, {
          service: context.service.title,
          when: when.provider,
        }),
        text: textBody([
          providerT(`booking.${event}.providerBody`, {
            service: context.service.title,
            guest: guestName,
            when: when.provider,
          }),
        ]),
        html: htmlBody([
          providerT(`booking.${event}.providerBody`, {
            service: context.service.title,
            guest: guestName,
            when: when.provider,
          }),
        ]),
      }),
    );
  }
  await Promise.all(sends);
}
