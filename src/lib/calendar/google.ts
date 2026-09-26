/**
 * Google Calendar OAuth — separate from Auth.js login (Q-T15 ≠ calendar).
 * Uses FreeBusy only (`calendar.freebusy`); no event titles stored.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "@/lib/app-url";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "openid",
] as const;

export const GOOGLE_CALENDAR_SCOPE_STRING = GOOGLE_CALENDAR_SCOPES.join(" ");

export type GoogleCalendarCredentials = {
  clientId: string;
  clientSecret: string;
};

function readEnv(name: "GOOGLE_CALENDAR_CLIENT_ID" | "GOOGLE_CALENDAR_CLIENT_SECRET"): string {
  const raw = process.env[name];
  return (raw ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

/** Trimmed credentials, or null if either var is missing. Never log these. */
export function googleCalendarCredentials(): GoogleCalendarCredentials | null {
  const clientId = readEnv("GOOGLE_CALENDAR_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_CALENDAR_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleCalendarConnectEnabled(): boolean {
  return googleCalendarCredentials() !== null;
}

export function googleCalendarCallbackUrl(): string {
  return absoluteUrl("/api/v1/me/calendars/google/callback");
}

function stateSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "dev-insecure-auth-secret")
  );
}

/** Signed OAuth `state` binding the flow to one provider id (CSRF). */
export function signGoogleCalendarState(providerId: string, nonce: string): string {
  const payload = `${providerId}.${nonce}.${Date.now()}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGoogleCalendarState(
  state: string,
  maxAgeMs = 15 * 60 * 1000,
): { providerId: string } | null {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [providerId, nonce, tsRaw, sig] = parts;
  if (!providerId || !nonce || !tsRaw || !sig) return null;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs || Date.now() < ts - 60_000) {
    return null;
  }
  const payload = `${providerId}.${nonce}.${tsRaw}`;
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { providerId };
}

export function googleCalendarAuthorizeUrl(state: string): string {
  const creds = googleCalendarCredentials();
  if (!creds) throw new Error("Google Calendar OAuth is not configured.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", googleCalendarCallbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE_STRING);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export async function exchangeGoogleCalendarCode(code: string): Promise<GoogleTokenResponse> {
  const creds = googleCalendarCredentials();
  if (!creds) throw new Error("Google Calendar OAuth is not configured.");
  const body = new URLSearchParams({
    code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: googleCalendarCallbackUrl(),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}).`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleCalendarAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const creds = googleCalendarCredentials();
  if (!creds) throw new Error("Google Calendar OAuth is not configured.");
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}).`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

/** Decode JWT payload without verifying (we only need `sub` from Google's id_token). */
export function googleSubFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1]!, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export type FreeBusyInterval = { start: string; end: string };

export async function fetchGoogleFreeBusy(input: {
  accessToken: string;
  calendarId: string;
  timeMin: Date;
  timeMax: Date;
}): Promise<FreeBusyInterval[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: input.timeMin.toISOString(),
      timeMax: input.timeMax.toISOString(),
      items: [{ id: input.calendarId }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Google FreeBusy failed (${res.status}).`);
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: FreeBusyInterval[]; errors?: unknown[] }>;
  };
  const cal = data.calendars?.[input.calendarId];
  if (!cal) return [];
  if (cal.errors?.length) {
    throw new Error("Google FreeBusy returned calendar errors.");
  }
  return cal.busy ?? [];
}

/** Default sync window: now → +60 days. */
export const GOOGLE_BUSY_SYNC_DAYS = 60;
