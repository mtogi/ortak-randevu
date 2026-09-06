"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  BookingError,
  createGuestBooking,
  manageBookingPath,
  notifyBooking,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";

export async function createBookingAction(formData: FormData) {
  const providerSlug = String(formData.get("providerSlug") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");

  const back = (code: string): never => {
    const query = new URLSearchParams({ error: code });
    if (serviceId) query.set("serviceId", serviceId);
    redirect(`/book/${encodeURIComponent(providerSlug)}?${query.toString()}`);
  };

  let bookingId: string;
  try {
    const booking = await createGuestBooking(prisma, {
      providerSlug,
      slotId: String(formData.get("slotId") ?? ""),
      guest: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      },
    });
    bookingId = booking.id;

    const locale = await getLocale();
    await notifyBooking("created", booking, isLocale(locale) ? locale : defaultLocale);
  } catch (error) {
    if (error instanceof BookingError) back(error.code);
    throw error;
  }

  // The management link is the guest's only handle on this booking, so the
  // redirect hands it over immediately instead of relying on the email.
  redirect(`${manageBookingPath(bookingId)}&created=1`);
}
