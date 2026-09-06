// A guest has no account (Q-P7) but still needs to cancel or reschedule, so
// the management link carries a capability token instead of a session.
//
// The token is an HMAC of the booking id under `AUTH_SECRET` — stateless, so
// it needs no column on `Booking` and therefore no change to the ADR-003
// schema. Rotating `AUTH_SECRET` invalidates every outstanding link; that is
// an accepted trade (see ADR-005).
import { createHmac, timingSafeEqual } from "node:crypto";

function signingSecret(): string {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-insecure-auth-secret");
  if (!secret) {
    throw new Error("AUTH_SECRET is required to sign booking management links.");
  }
  return secret;
}

export function manageBookingToken(bookingId: string): string {
  return createHmac("sha256", signingSecret())
    .update(`booking-manage:${bookingId}`)
    .digest("base64url");
}

export function verifyManageBookingToken(
  bookingId: string,
  token: string | null,
): boolean {
  if (!token) return false;
  const expected = Buffer.from(manageBookingToken(bookingId), "utf8");
  const provided = Buffer.from(token, "utf8");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function manageBookingPath(bookingId: string, token?: string): string {
  const value = token ?? manageBookingToken(bookingId);
  return `/bookings/${bookingId}?t=${encodeURIComponent(value)}`;
}
