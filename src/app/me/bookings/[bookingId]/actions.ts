"use server";

import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";
import { auth } from "@/auth";
import {
  BookingError,
  cancelProviderBooking,
  concludeProviderBooking,
  notifyBooking,
  rescheduleProviderBooking,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";

async function providerIdOrLogin(): Promise<string> {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");
  return provider.id;
}

function backTo(bookingId: string, params: Record<string, string>): never {
  const query = new URLSearchParams(params);
  redirect(`/me/bookings/${encodeURIComponent(bookingId)}?${query.toString()}`);
}

export async function cancelProviderBookingAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const bookingId = String(formData.get("bookingId") ?? "");
  try {
    const booking = await cancelProviderBooking(prisma, { providerId, bookingId });
    await notifyBooking("cancelledByProvider", booking, defaultLocale);
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, { error: error.code });
    throw error;
  }
  backTo(bookingId, { saved: "cancelled" });
}

export async function rescheduleProviderBookingAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const bookingId = String(formData.get("bookingId") ?? "");
  try {
    const { booking } = await rescheduleProviderBooking(prisma, {
      providerId,
      bookingId,
      slotId: String(formData.get("slotId") ?? ""),
    });
    await notifyBooking("rescheduledByProvider", booking, defaultLocale);
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, { error: error.code });
    throw error;
  }
  backTo(bookingId, { saved: "rescheduled" });
}

export async function completeProviderBookingAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const bookingId = String(formData.get("bookingId") ?? "");
  try {
    await concludeProviderBooking(prisma, {
      providerId,
      bookingId,
      toStatus: "COMPLETED",
    });
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, { error: error.code });
    throw error;
  }
  backTo(bookingId, { saved: "completed" });
}

export async function markNoShowProviderBookingAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const bookingId = String(formData.get("bookingId") ?? "");
  try {
    await concludeProviderBooking(prisma, {
      providerId,
      bookingId,
      toStatus: "NO_SHOW",
    });
  } catch (error) {
    if (error instanceof BookingError) backTo(bookingId, { error: error.code });
    throw error;
  }
  backTo(bookingId, { saved: "noShow" });
}
