"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  BookingError,
  cancelGuestBooking,
  notifyBooking,
  rescheduleGuestBooking,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";

function backTo(bookingId: string, token: string, params: Record<string, string>): never {
  const query = new URLSearchParams({ t: token, ...params });
  redirect(`/bookings/${encodeURIComponent(bookingId)}?${query.toString()}`);
}

export async function cancelBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const token = String(formData.get("token") ?? "");

  try {
    const booking = await cancelGuestBooking(prisma, { bookingId, token });
    const locale = await getLocale();
    await notifyBooking("cancelled", booking, isLocale(locale) ? locale : defaultLocale);
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, token, { error: error.code });
    throw error;
  }

  backTo(bookingId, token, { saved: "cancelled" });
}

export async function rescheduleBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const token = String(formData.get("token") ?? "");

  try {
    const { booking } = await rescheduleGuestBooking(prisma, {
      bookingId,
      token,
      slotId: String(formData.get("slotId") ?? ""),
    });
    const locale = await getLocale();
    await notifyBooking(
      "rescheduled",
      booking,
      isLocale(locale) ? locale : defaultLocale,
    );
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, token, { error: error.code });
    throw error;
  }

  backTo(bookingId, token, { saved: "rescheduled" });
}
