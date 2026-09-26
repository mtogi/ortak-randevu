import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/app-url";
import {
  googleCalendarAuthorizeUrl,
  isGoogleCalendarConnectEnabled,
  signGoogleCalendarState,
} from "@/lib/calendar";
import { requireProvider } from "@/lib/http/require-provider";

export const dynamic = "force-dynamic";

/** Start Google Calendar OAuth (separate from Auth.js login). */
export async function GET() {
  const authz = await requireProvider();
  if (authz.error) {
    return NextResponse.redirect(absoluteUrl("/login"));
  }
  if (!isGoogleCalendarConnectEnabled()) {
    return NextResponse.redirect(absoluteUrl("/me/settings?calendar=google_not_configured"));
  }

  const nonce = randomBytes(16).toString("base64url");
  const state = signGoogleCalendarState(authz.provider.id, nonce);
  return NextResponse.redirect(googleCalendarAuthorizeUrl(state));
}
