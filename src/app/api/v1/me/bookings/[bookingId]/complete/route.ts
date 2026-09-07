import { NextResponse } from "next/server";
import { concludeProviderBooking } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const { bookingId } = await params;
  try {
    const booking = await concludeProviderBooking(prisma, {
      providerId: authz.provider.id,
      bookingId,
      toStatus: "COMPLETED",
    });
    return NextResponse.json({ booking });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
