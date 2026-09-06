import { NextResponse } from "next/server";
import {
  regenerateAllActiveServices,
  replaceWeeklyHours,
} from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { availabilityErrorResponse } from "@/lib/http/availability-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  try {
    const body = (await request.json()) as {
      windows?: { weekday: number; startMinute: number; endMinute: number }[];
    };
    const weeklyHours = await replaceWeeklyHours(
      prisma,
      authz.provider.id,
      Array.isArray(body.windows) ? body.windows : [],
    );
    const slots = await regenerateAllActiveServices(prisma, authz.provider.id);
    return NextResponse.json({ weeklyHours, slots });
  } catch (error) {
    return availabilityErrorResponse(error);
  }
}
