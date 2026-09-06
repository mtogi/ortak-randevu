import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  notifyBooking,
  rescheduleGuestBooking,
  toGuestBookingDetail,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

/** Move a booking to another OPEN slot of the same service (Q-P6, 24h). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const url = new URL(request.url);
  let slotId: string | undefined;
  try {
    const body = (await request.json()) as { slotId?: string };
    slotId = body.slotId;
  } catch {
    return NextResponse.json(
      { error: "BODY_INVALID", message: "Expected a JSON body." },
      { status: 400 },
    );
  }

  try {
    const { booking } = await rescheduleGuestBooking(prisma, {
      bookingId,
      token: url.searchParams.get("token"),
      slotId: slotId ?? "",
    });
    const locale = await getLocale();
    await notifyBooking(
      "rescheduled",
      booking,
      isLocale(locale) ? locale : defaultLocale,
    );
    return NextResponse.json({ booking: toGuestBookingDetail(booking) });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
