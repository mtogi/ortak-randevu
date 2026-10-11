import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/app-url";
import {
  exchangeGoogleCalendarCode,
  GOOGLE_CALENDAR_SCOPE_STRING,
  googleSubFromIdToken,
  syncGoogleBusy,
  upsertGoogleConnection,
  verifyGoogleCalendarState,
} from "@/lib/calendar";
import { prisma } from "@/lib/db/client";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

function settingsRedirect(query: string): NextResponse {
  return NextResponse.redirect(absoluteUrl(`/me/settings?${query}`));
}

/** OAuth callback: store encrypted tokens and sync FreeBusy. */
export async function GET(request: Request) {
  const authz = await requireProvider();
  if (authz.error) {
    return settingsRedirect("calendar=auth_required");
  }

  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    return settingsRedirect("calendar=google_denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return settingsRedirect("calendar=google_invalid");
  }

  const verified = verifyGoogleCalendarState(state);
  if (!verified || verified.providerId !== authz.provider.id) {
    return settingsRedirect("calendar=google_invalid");
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    const connection = await upsertGoogleConnection(prisma, {
      providerId: authz.provider.id,
      externalAccountId: googleSubFromIdToken(tokens.id_token),
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
      scopes: tokens.scope ?? GOOGLE_CALENDAR_SCOPE_STRING,
    });
    await syncGoogleBusy(prisma, connection);
    return settingsRedirect("calendar=google_connected");
  } catch {
    return settingsRedirect("calendar=google_error");
  }
}
