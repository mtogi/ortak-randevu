import { NextResponse } from "next/server";
import { getProviderBooking } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const { bookingId } = await params;
  try {
    const booking = await getProviderBooking(prisma, authz.provider.id, bookingId);
    return NextResponse.json({ booking });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
