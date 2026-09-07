import { Prisma } from "@prisma/client";
import type { BookingEventActor, BookingStatus, PrismaClient } from "@prisma/client";
import { loadBookingDetail, type BookingDetail } from "./detail";
import {
  BookingNotFoundError,
  BookingValidationError,
  ModifyWindowClosedError,
  SlotUnavailableError,
} from "./errors";

export function assertBookingConfirmed(detail: BookingDetail): void {
  if (detail.status !== "CONFIRMED") {
    throw new ModifyWindowClosedError(
      "BOOKING_NOT_CONFIRMED",
      "This booking is no longer active.",
    );
  }
}

/** Cancel a CONFIRMED booking and return its slot to OPEN. */
export async function cancelConfirmedBooking(
  db: PrismaClient,
  existing: BookingDetail,
  actor: BookingEventActor,
  now: Date,
): Promise<BookingDetail> {
  assertBookingConfirmed(existing);

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
        actor,
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
 * Move a CONFIRMED booking onto another OPEN slot of the same service.
 * Status stays CONFIRMED; the audit row is CONFIRMED → CONFIRMED (Q-D5).
 */
export async function rescheduleConfirmedBooking(
  db: PrismaClient,
  existing: BookingDetail,
  input: { slotId: string; actor: BookingEventActor; now: Date },
): Promise<{ booking: BookingDetail; previousStartAt: Date }> {
  assertBookingConfirmed(existing);

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
          startAt: { gte: input.now },
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
          actor: input.actor,
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

const CONCLUSION_STATUSES = ["COMPLETED", "NO_SHOW"] as const;
export type ConclusionStatus = (typeof CONCLUSION_STATUSES)[number];

export function isConclusionStatus(value: string): value is ConclusionStatus {
  return (CONCLUSION_STATUSES as readonly string[]).includes(value);
}

/**
 * Mark a CONFIRMED booking COMPLETED or NO_SHOW. The slot stays BOOKED so
 * the time cannot be offered again; cancel is what frees a slot.
 */
export async function concludeConfirmedBooking(
  db: PrismaClient,
  existing: BookingDetail,
  toStatus: ConclusionStatus,
  actor: BookingEventActor,
): Promise<BookingDetail> {
  assertBookingConfirmed(existing);

  await db.$transaction(async (tx) => {
    const updated = await tx.booking.updateMany({
      where: { id: existing.id, status: "CONFIRMED" },
      data: { status: toStatus satisfies BookingStatus },
    });
    if (updated.count !== 1) {
      throw new ModifyWindowClosedError(
        "BOOKING_NOT_CONFIRMED",
        "This booking is no longer active.",
      );
    }
    await tx.bookingEvent.create({
      data: {
        bookingId: existing.id,
        fromStatus: "CONFIRMED",
        toStatus,
        actor,
      },
    });
  });

  const detail = await loadBookingDetail(db, existing.id);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
}
