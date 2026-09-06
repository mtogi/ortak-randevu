import { NextResponse } from "next/server";
import { listExceptions, listWeeklyHours } from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const [weeklyHours, exceptions] = await Promise.all([
    listWeeklyHours(prisma, authz.provider.id),
    listExceptions(prisma, authz.provider.id),
  ]);
  return NextResponse.json({
    timezone: authz.provider.timezone,
    weeklyHours,
    exceptions,
  });
}
