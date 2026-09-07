import { NextResponse } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { notifyBooking, rescheduleProviderBooking } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** Provider reschedule — no 24h window (Q-P6). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const { bookingId } = await params;

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
    const { booking } = await rescheduleProviderBooking(prisma, {
      providerId: authz.provider.id,
      bookingId,
      slotId: slotId ?? "",
    });
    await notifyBooking("rescheduledByProvider", booking, defaultLocale);
    return NextResponse.json({ booking });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
