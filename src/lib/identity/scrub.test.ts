import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createGuestBooking, getGuestBooking, getProviderBooking } from "@/lib/booking";
import { manageBookingToken } from "@/lib/booking/token";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { DeletedProviderError } from "./errors";
import { exportProviderData } from "./export";
import { ensureProviderForEmail, getActiveProviderById } from "./provider";
import { scrubClientRecord, scrubProviderAccount } from "./scrub";

const NOW = new Date("2027-07-01T08:00:00Z");
const originalSecret = process.env.AUTH_SECRET;

describe("KVKK scrub (Q-D6 / Q-L3)", () => {
  let testPg: LocalTestPostgres;
  let db: PrismaClient;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "test-secret-for-kvkk-scrub";
    testPg = await startLocalTestPostgres();
    db = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await db?.$disconnect();
    await testPg?.stop();
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  async function seed(seedName: string) {
    const provider = await db.provider.create({
      data: {
        email: `dietitian-${seedName}@example.com`,
        slug: `dietitian-${seedName}`,
        name: "Ayşe Yılmaz",
        bio: "Not clinical — public profile only.",
      },
    });
    const service = await db.service.create({
      data: {
        providerId: provider.id,
        title: "Initial consultation",
        durationMinutes: 30,
      },
    });
    const slot = await db.slot.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        startAt: new Date("2027-07-10T09:00:00Z"),
        endAt: new Date("2027-07-10T09:30:00Z"),
      },
    });
    const booking = await createGuestBooking(db, {
      providerSlug: provider.slug,
      slotId: slot.id,
      guest: {
        name: "Ada Lovelace",
        email: `ada-${seedName}@example.com`,
        phone: "+90 555 000 11 22",
      },
      now: NOW,
    });
    return { provider, service, booking };
  }

  it("scrubs provider PII, keeps bookings, and blocks the deleted account", async () => {
    const { provider, booking } = await seed("provider-scrub");
    const email = provider.email!;
    await db.user.create({
      data: { email, name: "Ayşe" },
    });
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: "dummy-token",
        expires: new Date("2027-07-02T00:00:00Z"),
      },
    });

    const scrubbed = await scrubProviderAccount(db, provider.id);
    expect(scrubbed.email).toBeNull();
    expect(scrubbed.name).toBeNull();
    expect(scrubbed.bio).toBeNull();
    expect(scrubbed.deletedAt).not.toBeNull();
    expect(scrubbed.slug).toBe(provider.slug);

    const events = await db.bookingEvent.findMany({ where: { bookingId: booking.id } });
    expect(events).toHaveLength(1);
    const remaining = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(remaining.providerId).toBe(provider.id);

    await expect(getActiveProviderById(db, provider.id)).resolves.toBeNull();
    await expect(ensureProviderForEmail(db, email)).resolves.toMatchObject({
      email,
    });
    const revivedAttempt = await ensureProviderForEmail(db, email);
    expect(revivedAttempt.id).not.toBe(provider.id);

    await expect(db.user.findUnique({ where: { email } })).resolves.toBeNull();
    await expect(
      db.verificationToken.findUnique({
        where: { identifier_token: { identifier: email, token: "dummy-token" } },
      }),
    ).resolves.toBeNull();

    const guestView = await getGuestBooking(
      db,
      booking.id,
      manageBookingToken(booking.id),
    );
    expect(guestView.provider.name).toBeNull();
    expect(guestView.provider.email).toBeNull();
    expect(guestView.client.email).toBe(`ada-provider-scrub@example.com`);
  });

  it("scrubs client PII without dropping the booking the provider still owns", async () => {
    const { provider, booking } = await seed("client-scrub");
    const client = await db.client.findFirstOrThrow({
      where: { email: "ada-client-scrub@example.com" },
    });

    const scrubbed = await scrubClientRecord(db, client.id);
    expect(scrubbed.email).toBeNull();
    expect(scrubbed.name).toBeNull();
    expect(scrubbed.phone).toBeNull();
    expect(scrubbed.deletedAt).not.toBeNull();

    const remaining = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(remaining.clientId).toBe(client.id);
    const events = await db.bookingEvent.findMany({ where: { bookingId: booking.id } });
    expect(events.length).toBeGreaterThan(0);

    const owned = await getProviderBooking(db, provider.id, booking.id);
    expect(owned.client.name).toBeNull();
    expect(owned.client.email).toBeNull();
    expect(owned.client.phone).toBeNull();
    expect(owned.service.title).toBe("Initial consultation");
  });

  it("exports the provider's allowed PII and booking operational fields", async () => {
    const { provider, booking } = await seed("export");
    const snapshot = await exportProviderData(db, provider.id);
    expect(snapshot.provider.email).toBe(provider.email);
    expect(snapshot.provider.slug).toBe(provider.slug);
    expect(snapshot.services[0]?.title).toBe("Initial consultation");
    const row = snapshot.bookings.find((item) => item.id === booking.id);
    expect(row).toMatchObject({
      status: "CONFIRMED",
      client: {
        name: "Ada Lovelace",
        email: "ada-export@example.com",
        phone: "+90 555 000 11 22",
      },
    });
    expect(row?.slot.startAt).toBeTruthy();
    expect(row?.events.length).toBeGreaterThan(0);
  });

  it("still refuses login when deletedAt is set but email was not yet scrubbed", async () => {
    const created = await ensureProviderForEmail(db, "legacy-deleted@example.com");
    await db.provider.update({
      where: { id: created.id },
      data: { deletedAt: new Date() },
    });
    await expect(
      ensureProviderForEmail(db, "legacy-deleted@example.com"),
    ).rejects.toBeInstanceOf(DeletedProviderError);
  });
});
