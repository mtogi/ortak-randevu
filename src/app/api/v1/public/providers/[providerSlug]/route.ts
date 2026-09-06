import { NextResponse } from "next/server";
import { getPublicProviderPage } from "@/lib/booking";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** Public provider profile + bookable services. No auth, no provider email. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ providerSlug: string }> },
) {
  const { providerSlug } = await params;
  const provider = await getPublicProviderPage(prisma, providerSlug);
  if (!provider) {
    return NextResponse.json({ error: "PROVIDER_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ provider });
}
