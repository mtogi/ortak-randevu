import type { PrismaClient } from "@prisma/client";
import { PROVIDER_BOOKINGS_LIMIT } from "./constants";
import { decodeCreatedCursor, encodeCreatedCursor } from "./cursor";
import { bookingDetailSelect, loadBookingDetail, type BookingDetail } from "./detail";
import { BookingNotFoundError, BookingValidationError } from "./errors";
import {
  cancelConfirmedBooking,
  concludeConfirmedBooking,
  type ConclusionStatus,
  rescheduleConfirmedBooking,
} from "./transitions";

const MAX_LIMIT = 100;

/**
 * Load a booking the signed-in provider owns. A miss (wrong id, or someone
 * else's booking) is 404, not 403 — same probing rule as the guest token.
 */
export async function getProviderBooking(
  db: PrismaClient,
  providerId: string,
  bookingId: string,
): Promise<BookingDetail> {
  const owned = await db.booking.findFirst({
    where: { id: bookingId, providerId },
    select: { id: true },
  });
  if (!owned) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  const detail = await loadBookingDetail(db, owned.id);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
}

/**
 * The provider's own bookings, newest created first. Cursor is Q-D9:
 * `?cursor=&limit=`, `(createdAt, id)` descending, forward-only.
 */
export async function listProviderBookings(
  db: PrismaClient,
  providerId: string,
  query: { cursor?: string | null; limit?: number } = {},
): Promise<{ bookings: BookingDetail[]; nextCursor: string | null }> {
  const limit = query.limit ?? PROVIDER_BOOKINGS_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new BookingValidationError("LIMIT_INVALID", `limit must be 1–${MAX_LIMIT}.`);
  }
  const cursor = query.cursor ? decodeCreatedCursor(query.cursor) : null;
  if (query.cursor && !cursor) {
    throw new BookingValidationError("CURSOR_INVALID", "Invalid cursor.");
  }

  const rows = await db.booking.findMany({
    where: cursor
      ? {
          providerId,
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              AND: [{ createdAt: new Date(cursor.createdAt) }, { id: { lt: cursor.id } }],
            },
          ],
        }
      : { providerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: bookingDetailSelect,
  });

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor =
    rows.length > limit && last ? encodeCreatedCursor(last.createdAt, last.id) : null;
  return { bookings: page, nextCursor };
}

export async function cancelProviderBooking(
  db: PrismaClient,
  input: { providerId: string; bookingId: string; now?: Date },
): Promise<BookingDetail> {
  const existing = await getProviderBooking(db, input.providerId, input.bookingId);
  return cancelConfirmedBooking(db, existing, "PROVIDER", input.now ?? new Date());
}

export async function rescheduleProviderBooking(
  db: PrismaClient,
  input: { providerId: string; bookingId: string; slotId: string; now?: Date },
): Promise<{ booking: BookingDetail; previousStartAt: Date }> {
  const existing = await getProviderBooking(db, input.providerId, input.bookingId);
  return rescheduleConfirmedBooking(db, existing, {
    slotId: input.slotId,
    actor: "PROVIDER",
    now: input.now ?? new Date(),
  });
}

export async function concludeProviderBooking(
  db: PrismaClient,
  input: {
    providerId: string;
    bookingId: string;
    toStatus: ConclusionStatus;
  },
): Promise<BookingDetail> {
  const existing = await getProviderBooking(db, input.providerId, input.bookingId);
  return concludeConfirmedBooking(db, existing, input.toStatus, "PROVIDER");
}
