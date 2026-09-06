import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  createGuestBooking,
  manageBookingPath,
  manageBookingToken,
  notifyBooking,
  toGuestBookingDetail,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

type CreateBody = {
  providerSlug?: string;
  slotId?: string;
  name?: string;
  email?: string;
  phone?: string;
};

/**
 * Guest booking (Q-P7). Unauthenticated on purpose; the response carries the
 * capability token that authorizes later cancel/reschedule calls.
 */
export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "BODY_INVALID", message: "Expected a JSON body." },
      { status: 400 },
    );
  }

  if (!body.providerSlug) {
    return NextResponse.json(
      { error: "PROVIDER_REQUIRED", message: "providerSlug is required." },
      { status: 400 },
    );
  }

  try {
    const booking = await createGuestBooking(prisma, {
      providerSlug: body.providerSlug,
      slotId: body.slotId ?? "",
      guest: { name: body.name, email: body.email, phone: body.phone },
    });

    const locale = await getLocale();
    await notifyBooking("created", booking, isLocale(locale) ? locale : defaultLocale);

    const token = manageBookingToken(booking.id);
    return NextResponse.json(
      {
        booking: toGuestBookingDetail(booking),
        manageToken: token,
        managePath: manageBookingPath(booking.id, token),
      },
      { status: 201 },
    );
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
