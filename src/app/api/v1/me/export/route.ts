import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";
import { exportProviderData } from "@/lib/identity";

export const dynamic = "force-dynamic";

/** Q-L3: JSON snapshot of the signed-in provider's allowed PII + bookings. */
export async function GET() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;

  const snapshot = await exportProviderData(prisma, authz.provider.id);
  const filename = `ortak-randevu-export-${authz.provider.slug}.json`;
  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
