import { NextResponse } from "next/server";
import {
  civilDateToUtcDate,
  deleteException,
  listExceptions,
  parseIsoDate,
  regenerateAllActiveServices,
  upsertException,
} from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { availabilityErrorResponse } from "@/lib/http/availability-error";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const exceptions = await listExceptions(prisma, authz.provider.id);
  return NextResponse.json({ exceptions });
}

export async function POST(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  try {
    const body = (await request.json()) as {
      date?: string;
      isClosed?: boolean;
      startMinute?: number | null;
      endMinute?: number | null;
    };
    const civil = parseIsoDate(String(body.date ?? ""));
    if (!civil) {
      return NextResponse.json({ error: "DATE_INVALID" }, { status: 400 });
    }
    const exception = await upsertException(prisma, authz.provider.id, {
      date: civilDateToUtcDate(civil),
      isClosed: Boolean(body.isClosed),
      startMinute: body.startMinute ?? null,
      endMinute: body.endMinute ?? null,
    });
    const slots = await regenerateAllActiveServices(prisma, authz.provider.id);
    return NextResponse.json({ exception, slots });
  } catch (error) {
    return availabilityErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  const url = new URL(request.url);
  const civil = parseIsoDate(url.searchParams.get("date") ?? "");
  if (!civil) {
    return NextResponse.json({ error: "DATE_INVALID" }, { status: 400 });
  }
  await deleteException(prisma, authz.provider.id, civilDateToUtcDate(civil));
  const slots = await regenerateAllActiveServices(prisma, authz.provider.id);
  return NextResponse.json({ ok: true, slots });
}
