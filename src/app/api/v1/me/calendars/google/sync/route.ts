import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/app-url";
import { getConnectionByKind, syncGoogleBusy } from "@/lib/calendar";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** Re-run FreeBusy sync for the connected Google calendar. */
export async function POST() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;

  const connection = await getConnectionByKind(prisma, authz.provider.id, "GOOGLE");
  if (!connection) {
    return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_missing"));
  }

  try {
    await syncGoogleBusy(prisma, connection);
    return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_synced"));
  } catch {
    return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_error"));
  }
}
