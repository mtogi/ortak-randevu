import type { Locale } from "@/i18n/config";
import { absoluteUrl } from "@/lib/app-url";
import { sendBookingEmails, type BookingMailEvent } from "@/lib/mail/booking-emails";
import type { BookingDetail } from "./detail";
import { guestModifyDeadline } from "./rules";
import { manageBookingPath } from "./token";

/**
 * Fire the notification for a transition that already committed. Mail is
 * best-effort by design: a confirmed booking must not be rolled back (or its
 * redirect broken) because a mail provider was unreachable. The failure is
 * logged without the recipient address.
 */
export async function notifyBooking(
  event: BookingMailEvent,
  detail: BookingDetail,
  guestLocale: Locale,
): Promise<void> {
  try {
    await sendBookingEmails(event, {
      manageUrl: absoluteUrl(manageBookingPath(detail.id)),
      guest: {
        name: detail.client.name,
        email: detail.client.email,
        locale: guestLocale,
      },
      provider: {
        name: detail.provider.name,
        email: detail.provider.email,
        timezone: detail.provider.timezone,
        locale: detail.provider.locale,
      },
      service: { title: detail.service.title },
      startAt: detail.slot.startAt,
      endAt: detail.slot.endAt,
      modifyDeadline:
        detail.status === "CONFIRMED" ? guestModifyDeadline(detail.slot.startAt) : null,
    });
  } catch (error) {
    console.error(
      `[mail] Booking "${event}" notification failed for ${detail.id}:`,
      error,
    );
  }
}
