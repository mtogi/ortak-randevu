import { NextResponse } from "next/server";
import { createService, listServices } from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { availabilityErrorResponse } from "@/lib/http/availability-error";
import { requireProvider } from "@/lib/http/require-provider";
import type { LocationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const LOCATION_TYPES: LocationType[] = ["ONLINE", "IN_PERSON", "BOTH"];

export async function GET() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const services = await listServices(prisma, authz.provider.id);
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  try {
    const body = (await request.json()) as {
      title?: string;
      durationMinutes?: number;
      locationType?: LocationType;
    };
    const locationType = body.locationType;
    if (locationType && !LOCATION_TYPES.includes(locationType)) {
      return NextResponse.json({ error: "LOCATION_INVALID" }, { status: 400 });
    }
    const service = await createService(prisma, authz.provider.id, {
      title: String(body.title ?? ""),
      durationMinutes: Number(body.durationMinutes),
      locationType,
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return availabilityErrorResponse(error);
  }
}
