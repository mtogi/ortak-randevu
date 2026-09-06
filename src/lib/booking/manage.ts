import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { loadBookingDetail, type BookingDetail } from "./detail";
import {
  BookingNotFoundError,
  BookingValidationError,
  ModifyWindowClosedError,
  SlotUnavailableError,
} from "./errors";
import { assertGuestCanModify } from "./rules";
import { verifyManageBookingToken } from "./token";

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

function assertConfirmed(detail: BookingDetail): void {
  if (detail.status !== "CONFIRMED") {
    throw new ModifyWindowClosedError(
      "BOOKING_NOT_CONFIRMED",
      "This booking is no longer active.",
    );
  }
}

/** Cancel and release the slot so someone else can book it (Q-P6, 24h). */
export async function cancelGuestBooking(
  db: PrismaClient,
  input: { bookingId: string; token: string | null; now?: Date },
): Promise<BookingDetail> {
  const now = input.now ?? new Date();
  const existing = await getGuestBooking(db, input.bookingId, input.token);
  assertConfirmed(existing);
  assertGuestCanModify(existing.slot.startAt, now);

  await db.$transaction(async (tx) => {
    const updated = await tx.booking.updateMany({
      where: { id: existing.id, status: "CONFIRMED" },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    if (updated.count !== 1) {
      throw new ModifyWindowClosedError(
        "BOOKING_NOT_CONFIRMED",
        "This booking is no longer active.",
      );
    }
    await tx.slot.updateMany({
      where: { id: existing.slot.id, status: "BOOKED" },
      data: { status: "OPEN" },
    });
    await tx.bookingEvent.create({
      data: {
        bookingId: existing.id,
        fromStatus: "CONFIRMED",
        toStatus: "CANCELLED",
        actor: "CLIENT",
      },
    });
  });

  const detail = await loadBookingDetail(db, existing.id);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
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
  assertConfirmed(existing);
  assertGuestCanModify(existing.slot.startAt, now);

  if (!input.slotId) {
    throw new BookingValidationError("SLOT_REQUIRED", "Choose a new time.");
  }
  if (input.slotId === existing.slot.id) {
    throw new BookingValidationError("SLOT_UNCHANGED", "Choose a different time.");
  }

  await db
    .$transaction(async (tx) => {
      const target = await tx.slot.findFirst({
        where: {
          id: input.slotId,
          providerId: existing.provider.id,
          serviceId: existing.service.id,
          status: "OPEN",
          startAt: { gte: now },
        },
        select: { id: true },
      });
      if (!target) {
        throw new SlotUnavailableError();
      }

      const claimed = await tx.slot.updateMany({
        where: { id: target.id, status: "OPEN" },
        data: { status: "BOOKED" },
      });
      if (claimed.count !== 1) {
        throw new SlotUnavailableError();
      }

      const moved = await tx.booking.updateMany({
        where: { id: existing.id, status: "CONFIRMED" },
        data: { slotId: target.id },
      });
      if (moved.count !== 1) {
        throw new ModifyWindowClosedError(
          "BOOKING_NOT_CONFIRMED",
          "This booking is no longer active.",
        );
      }

      await tx.slot.updateMany({
        where: { id: existing.slot.id, status: "BOOKED" },
        data: { status: "OPEN" },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: existing.id,
          fromStatus: "CONFIRMED",
          toStatus: "CONFIRMED",
          actor: "CLIENT",
        },
      });
    })
    .catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new SlotUnavailableError();
      }
      throw error;
    });

  const detail = await loadBookingDetail(db, existing.id);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return { booking: detail, previousStartAt: existing.slot.startAt };
}
