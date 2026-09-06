import { NextResponse } from "next/server";
import { getPublicProviderPage, listOpenSlots } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { bookingErrorResponse } from "@/lib/http/booking-error";

export const dynamic = "force-dynamic";

/** Bookable (OPEN) slots for one service, cursor-paginated per Q-D9. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerSlug: string }> },
) {
  const { providerSlug } = await params;
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  if (!serviceId) {
    return NextResponse.json(
      { error: "SERVICE_REQUIRED", message: "serviceId is required." },
      { status: 400 },
    );
  }

  const provider = await getPublicProviderPage(prisma, providerSlug);
  if (!provider) {
    return NextResponse.json({ error: "PROVIDER_NOT_FOUND" }, { status: 404 });
  }
  if (!provider.services.some((service) => service.id === serviceId)) {
    return NextResponse.json({ error: "SERVICE_NOT_FOUND" }, { status: 404 });
  }

  const limitRaw = url.searchParams.get("limit");
  try {
    const result = await listOpenSlots(prisma, {
      providerId: provider.id,
      serviceId,
      cursor: url.searchParams.get("cursor"),
      limit: limitRaw ? Number(limitRaw) : undefined,
    });
    return NextResponse.json({
      timezone: provider.timezone,
      slots: result.slots.map((slot) => ({
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    return bookingErrorResponse(error);
  }
}
