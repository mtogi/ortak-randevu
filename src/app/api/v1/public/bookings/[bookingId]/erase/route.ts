import { NextResponse } from "next/server";
import { eraseGuestClientPii, toGuestBookingDetail } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

/** Guest contact-field scrub (Q-D6). Capability token required; no 24h gate. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  try {
    const booking = await eraseGuestClientPii(prisma, { bookingId, token });
    return NextResponse.json({ booking: toGuestBookingDetail(booking) });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
