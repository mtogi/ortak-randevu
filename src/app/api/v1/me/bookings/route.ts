import { NextResponse } from "next/server";
import { listProviderBookings } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** The signed-in provider's bookings. Q-D9: `(createdAt, id)` desc, forward-only. */
export async function GET(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  try {
    const result = await listProviderBookings(prisma, authz.provider.id, {
      cursor: url.searchParams.get("cursor"),
      limit: limitRaw ? Number(limitRaw) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
