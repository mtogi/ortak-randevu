import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { createGuestBooking } from "@/lib/booking/create";
import { listOpenSlots } from "@/lib/booking/public";
import { SlotUnavailableError } from "@/lib/booking/errors";
import {
  disconnectCalendarKind,
  encryptToken,
  decryptToken,
  replaceBusyBlocks,
  upsertGoogleConnection,
} from "@/lib/calendar";

const NOW = new Date("2027-06-01T08:00:00Z");
const guest = {
  name: "Ada Lovelace",
  email: "ada-cal@example.com",
  phone: "+90 555 000 11 22",
};
const originalSecret = process.env.AUTH_SECRET;

describe("calendar busy ∩ slots (ADR-009)", () => {
  let testPg: LocalTestPostgres;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "test-secret-for-calendar-tokens";
    testPg = await startLocalTestPostgres();
    prisma = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await testPg?.stop();
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  async function seed(seedName: string) {
    const provider = await prisma.provider.create({
      data: {
        email: `host-${seedName}@example.com`,
        slug: `host-${seedName}`,
        name: "Test Host",
      },
    });
    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        title: "Consultation",
        durationMinutes: 30,
      },
    });
    const openSlot = await prisma.slot.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        startAt: new Date("2027-06-10T09:00:00Z"),
        endAt: new Date("2027-06-10T09:30:00Z"),
      },
    });
    const freeSlot = await prisma.slot.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        startAt: new Date("2027-06-10T11:00:00Z"),
        endAt: new Date("2027-06-10T11:30:00Z"),
      },
    });
    return { provider, service, openSlot, freeSlot };
  }

  it("encrypts and decrypts calendar tokens", () => {
    const plain = "ya29.test-access-token";
    const enc = encryptToken(plain);
    expect(enc).not.toContain(plain);
    expect(decryptToken(enc)).toBe(plain);
  });

  it("hides OPEN slots that overlap busy and refuses booking them", async () => {
    const { provider, service, openSlot, freeSlot } = await seed("busy-hide");
    const connection = await upsertGoogleConnection(prisma, {
      providerId: provider.id,
      externalAccountId: "google-sub-1",
      tokens: {
        accessToken: "access",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600_000),
      },
      scopes: "https://www.googleapis.com/auth/calendar.freebusy",
    });
    await replaceBusyBlocks(prisma, {
      connectionId: connection.id,
      providerId: provider.id,
      blocks: [
        {
          startAt: new Date("2027-06-10T09:00:00Z"),
          endAt: new Date("2027-06-10T10:00:00Z"),
        },
      ],
    });

    const open = await listOpenSlots(prisma, {
      providerId: provider.id,
      serviceId: service.id,
      now: NOW,
    });
    expect(open.slots.map((s) => s.id)).toEqual([freeSlot.id]);

    await expect(
      createGuestBooking(prisma, {
        providerSlug: provider.slug,
        slotId: openSlot.id,
        guest,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(SlotUnavailableError);

    const booked = await createGuestBooking(prisma, {
      providerSlug: provider.slug,
      slotId: freeSlot.id,
      guest: { ...guest, email: "other-cal@example.com" },
      now: NOW,
    });
    expect(booked.status).toBe("CONFIRMED");
  });

  it("clears busy blocks on disconnect", async () => {
    const { provider, service, openSlot } = await seed("disconnect");
    const connection = await upsertGoogleConnection(prisma, {
      providerId: provider.id,
      externalAccountId: "google-sub-2",
      tokens: {
        accessToken: "access-2",
        refreshToken: "refresh-2",
        expiresAt: null,
      },
      scopes: "https://www.googleapis.com/auth/calendar.freebusy",
    });
    await replaceBusyBlocks(prisma, {
      connectionId: connection.id,
      providerId: provider.id,
      blocks: [
        {
          startAt: new Date("2027-06-10T09:00:00Z"),
          endAt: new Date("2027-06-10T09:30:00Z"),
        },
      ],
    });
    expect(await prisma.calendarBusyBlock.count({ where: { providerId: provider.id } })).toBe(
      1,
    );

    const removed = await disconnectCalendarKind(prisma, provider.id, "GOOGLE");
    expect(removed).toBe(true);
    expect(await prisma.calendarConnection.count({ where: { providerId: provider.id } })).toBe(
      0,
    );
    expect(await prisma.calendarBusyBlock.count({ where: { providerId: provider.id } })).toBe(
      0,
    );

    const open = await listOpenSlots(prisma, {
      providerId: provider.id,
      serviceId: service.id,
      now: NOW,
    });
    expect(open.slots.map((s) => s.id)).toContain(openSlot.id);
  });
});

describe("calendar crypto key format", () => {
  it("accepts a 32-byte hex CALENDAR_TOKEN_ENCRYPTION_KEY", () => {
    const prev = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
    const key = randomBytes(32).toString("hex");
    process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = key;
    try {
      const enc = encryptToken("secret-value");
      expect(decryptToken(enc)).toBe("secret-value");
      // Different key material than AUTH_SECRET alone
      expect(createHash("sha256").update(key).digest("hex")).toHaveLength(64);
    } finally {
      if (prev === undefined) delete process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
      else process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = prev;
    }
  });
});
