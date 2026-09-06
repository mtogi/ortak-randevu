import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { loadBookingDetail, type BookingDetail } from "./detail";
import {
  BookingNotFoundError,
  BookingValidationError,
  SlotUnavailableError,
} from "./errors";
import { normalizeGuest, type GuestInput } from "./guest";

export type CreateBookingInput = {
  providerSlug: string;
  slotId: string;
  guest: GuestInput;
  now?: Date;
};

/**
 * Book one OPEN slot for a guest.
 *
 * Integrity (Q-T5 / ADR-003) has three layers, and none of them is a client
 * clock: the slot is flipped OPEN → BOOKED with a compare-and-set inside a
 * transaction, the start time is re-checked against the server's `now`, and
 * the `booking_slot_active_unique` partial index is the final backstop that
 * turns a lost race into a P2002 instead of a double booking.
 */
export async function createGuestBooking(
  db: PrismaClient,
  input: CreateBookingInput,
): Promise<BookingDetail> {
  const guest = normalizeGuest(input.guest);
  if (!input.slotId) {
    throw new BookingValidationError("SLOT_REQUIRED", "Choose a time.");
  }
  const now = input.now ?? new Date();

  const provider = await db.provider.findFirst({
    where: { slug: input.providerSlug, deletedAt: null },
    select: { id: true },
  });
  if (!provider) {
    throw new BookingNotFoundError("PROVIDER_NOT_FOUND", "Provider not found.");
  }

  const bookingId = await db
    .$transaction(async (tx) => {
      const slot = await tx.slot.findFirst({
        where: {
          id: input.slotId,
          providerId: provider.id,
          status: "OPEN",
          startAt: { gte: now },
        },
        select: { id: true, serviceId: true },
      });
      if (!slot) {
        throw new SlotUnavailableError();
      }

      const service = await tx.service.findFirst({
        where: {
          id: slot.serviceId,
          providerId: provider.id,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true },
      });
      if (!service) {
        throw new SlotUnavailableError();
      }

      // Q-D6: a previously scrubbed client who books again is consenting
      // afresh, so the row is reused and un-deleted rather than duplicated
      // (email is unique).
      const client = await tx.client.upsert({
        where: { email: guest.email },
        create: { email: guest.email, name: guest.name, phone: guest.phone },
        update: { name: guest.name, phone: guest.phone, deletedAt: null },
        select: { id: true },
      });

      const claimed = await tx.slot.updateMany({
        where: { id: slot.id, status: "OPEN" },
        data: { status: "BOOKED" },
      });
      if (claimed.count !== 1) {
        throw new SlotUnavailableError();
      }

      const booking = await tx.booking.create({
        data: {
          slotId: slot.id,
          providerId: provider.id,
          serviceId: slot.serviceId,
          clientId: client.id,
          status: "CONFIRMED",
        },
        select: { id: true },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: null,
          toStatus: "CONFIRMED",
          actor: "CLIENT",
        },
      });

      return booking.id;
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

  const detail = await loadBookingDetail(db, bookingId);
  if (!detail) {
    throw new BookingNotFoundError("BOOKING_NOT_FOUND", "Booking not found.");
  }
  return detail;
}
