import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/app-url";
import { disconnectCalendarKind } from "@/lib/calendar";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** Disconnect Google Calendar and clear derived busy blocks. */
export async function POST() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;

  const removed = await disconnectCalendarKind(prisma, authz.provider.id, "GOOGLE");
  if (!removed) {
    return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_missing"));
  }
  return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_disconnected"));
}
