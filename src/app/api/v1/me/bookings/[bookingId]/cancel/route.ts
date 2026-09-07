import { NextResponse } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { cancelProviderBooking, notifyBooking } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** Provider cancellation — no 24h window (Q-P6). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const { bookingId } = await params;
  try {
    const booking = await cancelProviderBooking(prisma, {
      providerId: authz.provider.id,
      bookingId,
    });
    await notifyBooking("cancelledByProvider", booking, defaultLocale);
    return NextResponse.json({ booking });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
