import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById, toPublicProvider } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.providerId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ provider: toPublicProvider(provider) });
}
