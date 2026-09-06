import { NextResponse } from "next/server";
import {
  regenerateAllActiveServices,
  regenerateSlotsForService,
} from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { availabilityErrorResponse } from "@/lib/http/availability-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  try {
    const body = (await request.json().catch(() => ({}))) as { serviceId?: string };
    const slots = body.serviceId
      ? await regenerateSlotsForService(prisma, {
          providerId: authz.provider.id,
          serviceId: body.serviceId,
        })
      : await regenerateAllActiveServices(prisma, authz.provider.id);
    return NextResponse.json({ slots });
  } catch (error) {
    return availabilityErrorResponse(error);
  }
}
