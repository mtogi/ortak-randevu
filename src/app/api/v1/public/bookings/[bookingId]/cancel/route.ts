import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { cancelGuestBooking, notifyBooking, toGuestBookingDetail } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

/** Guest cancellation, allowed until 24h before the start (Q-P6). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  try {
    const booking = await cancelGuestBooking(prisma, { bookingId, token });
    const locale = await getLocale();
    await notifyBooking("cancelled", booking, isLocale(locale) ? locale : defaultLocale);
    return NextResponse.json({ booking: toGuestBookingDetail(booking) });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
