import type { PrismaClient } from "@prisma/client";
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
