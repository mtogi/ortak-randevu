import { NextResponse } from "next/server";
import {
  getGuestBooking,
  guestCanModify,
  guestModifyDeadline,
  toGuestBookingDetail,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

/** Read one booking with its capability token (`?token=`). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  try {
    const booking = await getGuestBooking(prisma, bookingId, token);
    const now = new Date();
    return NextResponse.json({
      booking: toGuestBookingDetail(booking),
      modifyDeadline: guestModifyDeadline(booking.slot.startAt),
      canModify:
        booking.status === "CONFIRMED" && guestCanModify(booking.slot.startAt, now),
    });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
