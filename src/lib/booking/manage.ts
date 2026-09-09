import type { PrismaClient } from "@prisma/client";
import { scrubClientRecord } from "@/lib/identity";
import { loadBookingDetail, type BookingDetail } from "./detail";
import { BookingNotFoundError } from "./errors";
import { assertGuestCanModify } from "./rules";
import { verifyManageBookingToken } from "./token";
import {
  assertBookingConfirmed,
  cancelConfirmedBooking,
  rescheduleConfirmedBooking,
} from "./transitions";

/**
 * Load a booking for its guest. A bad or missing capability token is
 * reported as "not found", not "forbidden", so the endpoint cannot be used
 * to confirm that a booking id exists.
 */
export async function getGuestBooking(
  db: PrismaClient,
  bookingId: string,
  token: string | null,
): Promise<BookingDetail> {
  if (!verifyManageBookingToken(bookingId, token)) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  const detail = await loadBookingDetail(db, bookingId);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
}

/** Cancel and release the slot so someone else can book it (Q-P6, 24h). */
export async function cancelGuestBooking(
  db: PrismaClient,
  input: { bookingId: string; token: string | null; now?: Date },
): Promise<BookingDetail> {
  const now = input.now ?? new Date();
  const existing = await getGuestBooking(db, input.bookingId, input.token);
  assertBookingConfirmed(existing);
  assertGuestCanModify(existing.slot.startAt, now);
  return cancelConfirmedBooking(db, existing, "CLIENT", now);
}

/**
 * Move a booking to another OPEN slot of the same service. Status stays
 * CONFIRMED, so the audit trail gets a CONFIRMED → CONFIRMED `BookingEvent`
 * (Q-D5) rather than a cancel/rebook pair that would lose the link.
 */
export async function rescheduleGuestBooking(
  db: PrismaClient,
  input: { bookingId: string; token: string | null; slotId: string; now?: Date },
): Promise<{ booking: BookingDetail; previousStartAt: Date }> {
  const now = input.now ?? new Date();
  const existing = await getGuestBooking(db, input.bookingId, input.token);
  assertBookingConfirmed(existing);
  assertGuestCanModify(existing.slot.startAt, now);
  return rescheduleConfirmedBooking(db, existing, {
    slotId: input.slotId,
    actor: "CLIENT",
    now,
  });
}

export function guestHasContactPii(client: {
  name: string | null;
  email: string | null;
  phone: string | null;
}): boolean {
  return Boolean(client.email || client.name || client.phone);
}

/**
 * Q-D6 scrub of the Client row reached through this booking's capability
 * link. Not gated by the Q-P6 24h window: erasure is a privacy right, not a
 * schedule change. The booking stays; only name/email/phone go to null.
 * Shared Client rows (same email, other bookings) are scrubbed together.
 */
export async function eraseGuestClientPii(
  db: PrismaClient,
  input: { bookingId: string; token: string | null },
): Promise<BookingDetail> {
  const existing = await getGuestBooking(db, input.bookingId, input.token);
  const row = await db.booking.findUnique({
    where: { id: existing.id },
    select: { clientId: true },
  });
  if (!row) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  await scrubClientRecord(db, row.clientId);
  const detail = await loadBookingDetail(db, existing.id);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
}
