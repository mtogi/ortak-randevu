import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";
import {
  ProfileValidationError,
  toPublicProvider,
  updateProviderProfile,
} from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireProvider();
  if (authz.error) return authz.error;
  return NextResponse.json({ provider: toPublicProvider(authz.provider) });
}

export async function PATCH(request: Request) {
  const authz = await requireProvider();
  if (authz.error) return authz.error;

  let body: { name?: string | null; locale?: string };
  try {
    body = (await request.json()) as { name?: string | null; locale?: string };
  } catch {
    return NextResponse.json(
      { error: "BODY_INVALID", message: "Expected a JSON body." },
      { status: 400 },
    );
  }

  try {
    const provider = await updateProviderProfile(prisma, authz.provider.id, {
      name: body.name,
      locale: body.locale,
    });
    return NextResponse.json({ provider: toPublicProvider(provider) });
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
