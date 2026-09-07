// M3: provider-owned bookings against a real throwaway Postgres. Proves
// authz (own rows only), Q-P6 (no 24h limit for the provider), Q-D9 cursor
// pagination, and COMPLETED/NO_SHOW leaving the slot BOOKED.
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { createGuestBooking } from "./create";
import { decodeCreatedCursor, encodeCreatedCursor } from "./cursor";
import {
  BookingNotFoundError,
  ModifyWindowClosedError,
  SlotUnavailableError,
} from "./errors";
import {
  cancelProviderBooking,
  concludeProviderBooking,
  getProviderBooking,
  listProviderBookings,
  rescheduleProviderBooking,
} from "./provider";

const NOW = new Date("2027-06-01T08:00:00Z");
const guest = {
  name: "Ada Lovelace",
  email: "ada-m3@example.com",
  phone: "+90 555 000 11 22",
};

describe("created-at cursor (Q-D9)", () => {
  it("round-trips createdAt + id", () => {
    const createdAt = new Date("2027-06-01T12:00:00.123Z");
    const encoded = encodeCreatedCursor(createdAt, "clxyz");
    expect(decodeCreatedCursor(encoded)).toEqual({
      createdAt: "2027-06-01T12:00:00.123Z",
      id: "clxyz",
    });
  });

  it("rejects junk", () => {
    expect(decodeCreatedCursor("not-a-cursor")).toBeNull();
  });
});

describe("provider booking flow", () => {
  let testPg: LocalTestPostgres;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testPg = await startLocalTestPostgres();
    prisma = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await testPg?.stop();
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

  async function seed(seedName: string, startAt: string) {
    const provider = await prisma.provider.create({
      data: {
        email: `dietitian-${seedName}@example.com`,
        slug: `dietitian-${seedName}`,
        name: "Test Dietitian",
      },
    });
    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        title: "Initial consultation",
        durationMinutes: 30,
      },
    });
    const slot = await addSlot(provider.id, service.id, startAt);
    return { provider, service, slot };
  }

  it("lists only the signed-in provider's bookings, newest created first", async () => {
    const a = await seed("list-a", "2027-06-10T09:00:00Z");
    const b = await seed("list-b", "2027-06-11T09:00:00Z");
    await createGuestBooking(prisma, {
      providerSlug: b.provider.slug,
      slotId: b.slot.id,
      guest: { ...guest, email: "other-m3@example.com" },
      now: NOW,
    });
    const first = await createGuestBooking(prisma, {
      providerSlug: a.provider.slug,
      slotId: a.slot.id,
      guest,
      now: NOW,
    });
    const laterSlot = await addSlot(a.provider.id, a.service.id, "2027-06-12T09:00:00Z");
    const second = await createGuestBooking(prisma, {
      providerSlug: a.provider.slug,
      slotId: laterSlot.id,
      guest: { ...guest, email: "second-m3@example.com" },
      now: NOW,
    });

    const page = await listProviderBookings(prisma, a.provider.id, { limit: 10 });
    expect(page.bookings.map((row) => row.id)).toEqual([second.id, first.id]);
    expect(page.nextCursor).toBeNull();

    const stranger = await listProviderBookings(prisma, b.provider.id, { limit: 10 });
    expect(stranger.bookings).toHaveLength(1);
    expect(stranger.bookings[0]?.provider.id).toBe(b.provider.id);
  });

  it("paginates with a (createdAt, id) cursor", async () => {
    const { provider, service } = await seed("cursor", "2027-06-13T09:00:00Z");
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const slot = await addSlot(provider.id, service.id, `2027-07-0${i + 1}T09:00:00Z`);
      const booking = await createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest: { ...guest, email: `cursor-${i}@example.com` },
        now: NOW,
      });
      ids.push(booking.id);
    }

    const firstPage = await listProviderBookings(prisma, provider.id, { limit: 2 });
    expect(firstPage.bookings).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    const decoded = decodeCreatedCursor(firstPage.nextCursor ?? "");
    expect(decoded?.id).toBe(firstPage.bookings[1]?.id);

    const secondPage = await listProviderBookings(prisma, provider.id, {
      limit: 2,
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.bookings).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect([...firstPage.bookings, ...secondPage.bookings].map((row) => row.id)).toEqual(
      [...ids].reverse(),
    );
  });

  it("hides another provider's booking as not found", async () => {
    const owner = await seed("own", "2027-06-14T09:00:00Z");
    const other = await seed("other", "2027-06-15T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: owner.provider.slug,
      slotId: owner.slot.id,
      guest,
      now: NOW,
    });

    await expect(
      getProviderBooking(prisma, other.provider.id, booking.id),
    ).rejects.toBeInstanceOf(BookingNotFoundError);

    await expect(
      cancelProviderBooking(prisma, {
        providerId: other.provider.id,
        bookingId: booking.id,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(BookingNotFoundError);

    const unchanged = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
    });
    expect(unchanged.status).toBe("CONFIRMED");
  });

  it("lets the provider cancel inside the guest 24-hour window (Q-P6)", async () => {
    const { provider, slot } = await seed("late-cancel", "2027-06-01T10:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const cancelled = await cancelProviderBooking(prisma, {
      providerId: provider.id,
      bookingId: booking.id,
      now: NOW,
    });
    expect(cancelled.status).toBe("CANCELLED");

    const released = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(released.status).toBe("OPEN");

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.at(-1)).toMatchObject({
      fromStatus: "CONFIRMED",
      toStatus: "CANCELLED",
      actor: "PROVIDER",
    });
  });

  it("lets the provider reschedule inside the guest 24-hour window", async () => {
    const { provider, service, slot } = await seed("late-move", "2027-06-01T10:00:00Z");
    const target = await addSlot(provider.id, service.id, "2027-06-20T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const { booking: moved } = await rescheduleProviderBooking(prisma, {
      providerId: provider.id,
      bookingId: booking.id,
      slotId: target.id,
      now: NOW,
    });
    expect(moved.slot.id).toBe(target.id);
    expect(moved.status).toBe("CONFIRMED");

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
    });
    expect(events.some((event) => event.actor === "PROVIDER")).toBe(true);
  });

  it("marks COMPLETED without reopening the slot", async () => {
    const { provider, slot } = await seed("done", "2027-06-16T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const done = await concludeProviderBooking(prisma, {
      providerId: provider.id,
      bookingId: booking.id,
      toStatus: "COMPLETED",
    });
    expect(done.status).toBe("COMPLETED");

    const stillHeld = await prisma.slot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(stillHeld.status).toBe("BOOKED");

    await expect(
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: slot.id,
        guest: { ...guest, email: "rebook-m3@example.com" },
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("marks NO_SHOW and refuses a second conclusion", async () => {
    const { provider, slot } = await seed("missed", "2027-06-17T09:00:00Z");
    const booking = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest,
      now: NOW,
    });

    const missed = await concludeProviderBooking(prisma, {
      providerId: provider.id,
      bookingId: booking.id,
      toStatus: "NO_SHOW",
    });
    expect(missed.status).toBe("NO_SHOW");

    await expect(
      concludeProviderBooking(prisma, {
        providerId: provider.id,
        bookingId: booking.id,
        toStatus: "COMPLETED",
      }),
    ).rejects.toBeInstanceOf(ModifyWindowClosedError);
  });
});
