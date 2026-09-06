import { NextResponse } from "next/server";
import { listUpcomingSlots } from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { availabilityErrorResponse } from "@/lib/http/availability-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  try {
    const result = await listUpcomingSlots(prisma, authz.provider.id, {
      cursor: cursor || null,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    return availabilityErrorResponse(error);
  }
}
