// M2c end-to-end booking behaviour against a real, throwaway Postgres (same
// embedded-postgres helper as the ADR-003 double-booking test). This is the
// application-level companion to that DB-level proof: it checks that the
// guest flow cannot double-book, that cancelling releases the slot, and that
// the Q-P6 24-hour window is enforced server-side rather than in the browser.
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalTestPostgres, type LocalTestPostgres } from "@/lib/db/test/local-postgres";
import { createGuestBooking } from "./create";
import { ModifyWindowClosedError, SlotUnavailableError } from "./errors";
import { cancelGuestBooking, getGuestBooking, rescheduleGuestBooking } from "./manage";
import { listOpenSlots } from "./public";
import { manageBookingToken } from "./token";

const NOW = new Date("2027-05-01T08:00:00Z");
const guest = { name: "Ada Lovelace", email: "ada@example.com", phone: "+90 555 000 11 22" };
const otherGuest = { ...guest, email: "grace@example.com" };
const originalSecret = process.env.AUTH_SECRET;

describe("guest booking flow", () => {
  let testPg: LocalTestPostgres;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "test-secret-for-booking-links";
    testPg = await startLocalTestPostgres();
    prisma = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await testPg?.stop();
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  async function addSlot(providerId: string, serviceId: string, startAt: string) {
    return prisma.slot.create({
      data: {
        providerId,
        serviceId,
        startAt: new Date(startAt),
        endAt: new Date(new Date(startAt).getTime() + 30 * 60 * 1000),
      },
    });
  }

  /** One provider, one 30-minute service, one OPEN slot. */
  async function seed(seedName: string, startAt: string) {
    const provider = await prisma.provider.create({
      data: {
        email: `dietitian-${seedName}@example.com`,
        slug: `dietitian-${seedName}`,
        name: "Test Dietitian",
      },
    });
    const service = await prisma.service.create({
      data: { providerId: provider.id, title: "Initial consultation", durationMinutes: 30 },
    });
    const slot = await addSlot(provider.id, service.id, startAt);
    return { provider, service, slot };
  }

  it("books an OPEN slot, marks it BOOKED, and records the audit event", async () => {
    const { provider, service, slot } = await seed("book", "2027-05-10T09:00:00Z");

    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    expect(booking.status).toBe("CONFIRMED");
    expect(booking.client).toEqual({ name: guest.name, email: guest.email, phone: guest.phone });
    expect(booking.provider.timezone).toBe("Europe/Istanbul");

    const claimed = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(claimed.status).toBe("BOOKED");

    const events = await prisma.bookingEvent.findMany({ where: { bookingId: booking.id } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ fromStatus: null, toStatus: "CONFIRMED", actor: "CLIENT" });

    // A booked slot disappears from the public list.
    const open = await listOpenSlots(prisma, {
      providerId: provider.id,
      serviceId: service.id,
      now: NOW,
    });
    expect(open.slots).toHaveLength(0);
  });

  it("refuses a second booking for the same slot", async () => {
    const { provider, slot } = await seed("conflict", "2027-05-11T09:00:00Z");
    await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    await expect(
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest: otherGuest,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);

    const confirmed = await prisma.booking.count({
      where: { slotId: slot.id, status: "CONFIRMED" },
    });
    expect(confirmed).toBe(1);
  });

  it("refuses parallel bookings for the same slot", async () => {
    const { provider, slot } = await seed("race", "2027-05-12T09:00:00Z");

    const results = await Promise.allSettled([
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest,
        now: NOW,
      }),
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest: otherGuest,
        now: NOW,
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(SlotUnavailableError);
  });

  it("refuses a slot that has already started", async () => {
    const { provider, slot } = await seed("past", "2027-04-01T09:00:00Z");

    await expect(
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("hides the booking behind its capability token", async () => {
    const { provider, slot } = await seed("token", "2027-05-13T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    await expect(getGuestBooking(prisma, booking.id, null)).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
    });
    await expect(
      getGuestBooking(prisma, booking.id, manageBookingToken("some-other-booking")),
    ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });

    const found = await getGuestBooking(prisma, booking.id, manageBookingToken(booking.id));
    expect(found.id).toBe(booking.id);
  });

  it("cancels, releases the slot, and lets someone else book it", async () => {
    const { provider, slot } = await seed("cancel", "2027-05-14T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const cancelled = await cancelGuestBooking(prisma, {
      bookingId: booking.id,
      token: manageBookingToken(booking.id),
      now: NOW,
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelledAt).not.toBeNull();

    const released = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(released.status).toBe("OPEN");

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((event) => event.toStatus)).toEqual(["CONFIRMED", "CANCELLED"]);

    const rebooked = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest: otherGuest,
      now: NOW,
    });
    expect(rebooked.status).toBe("CONFIRMED");
  });

  it("refuses a guest cancellation inside the 24-hour window (Q-P6)", async () => {
    const { provider, slot } = await seed("late-cancel", "2027-05-15T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    await expect(
      cancelGuestBooking(prisma, {
        bookingId: booking.id,
        token: manageBookingToken(booking.id),
        now: new Date("2027-05-14T12:00:00Z"),
      }),
    ).rejects.toBeInstanceOf(ModifyWindowClosedError);

    const unchanged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(unchanged.status).toBe("CONFIRMED");
    const stillBooked = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(stillBooked.status).toBe("BOOKED");
  });

  it("reschedules onto another open slot and frees the old one", async () => {
    const { provider, service, slot } = await seed("move", "2027-05-16T09:00:00Z");
    const target = await addSlot(provider.id, service.id, "2027-05-17T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const { booking: moved, previousStartAt } = await rescheduleGuestBooking(prisma, {
      bookingId: booking.id,
      token: manageBookingToken(booking.id),
      slotId: target.id,
      now: NOW,
    });

    expect(moved.status).toBe("CONFIRMED");
    expect(moved.slot.id).toBe(target.id);
    expect(previousStartAt.toISOString()).toBe("2027-05-16T09:00:00.000Z");

    const [released, claimed] = await Promise.all([
      prisma.slot.findUniqueOrThrow({ where: { id: slot.id } }),
      prisma.slot.findUniqueOrThrow({ where: { id: target.id } }),
    ]);
    expect(released.status).toBe("OPEN");
    expect(claimed.status).toBe("BOOKED");

    const events = await prisma.bookingEvent.findMany({ where: { bookingId: booking.id } });
    expect(events).toHaveLength(2);
  });

  it("refuses a reschedule onto a slot of a different service", async () => {
    const { provider, slot } = await seed("cross-service", "2027-05-18T09:00:00Z");
    const otherService = await prisma.service.create({
      data: { providerId: provider.id, title: "Follow-up", durationMinutes: 30 },
    });
    const otherSlot = await addSlot(provider.id, otherService.id, "2027-05-19T09:00:00Z");

    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    await expect(
      rescheduleGuestBooking(prisma, {
        bookingId: booking.id,
        token: manageBookingToken(booking.id),
        slotId: otherSlot.id,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);

    const stillBooked = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(stillBooked.status).toBe("BOOKED");
  });
});
