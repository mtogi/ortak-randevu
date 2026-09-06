import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import type { Provider } from "@prisma/client";

export async function requireProvider(): Promise<
  | { provider: Provider; error?: undefined }
  | { provider?: undefined; error: NextResponse }
> {
  const session = await auth();
  if (!session?.providerId) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { provider };
}
