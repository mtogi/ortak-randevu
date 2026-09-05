// Proves Q-T5 / ADR-003: double booking is impossible at the database
// layer. Spins up a real, throwaway local Postgres (no Docker/Homebrew
// needed — see src/lib/db/test/local-postgres.ts), applies the real
// migrations, then attempts to CONFIRM two bookings against the same slot
// and asserts the second insert fails with a unique-constraint violation.
import { PrismaClient, Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalTestPostgres, type LocalTestPostgres } from "./test/local-postgres";

describe("double booking is impossible (DB constraint)", () => {
  let testPg: LocalTestPostgres;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testPg = await startLocalTestPostgres();
    prisma = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await testPg.stop();
  });

  async function seedProviderServiceAndSlot(seed: string) {
    const provider = await prisma.provider.create({
      data: {
        email: `dietitian-${seed}@example.com`,
        slug: `dietitian-${seed}`,
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
    const slot = await prisma.slot.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        startAt: new Date("2027-01-04T09:00:00Z"),
        endAt: new Date("2027-01-04T09:30:00Z"),
      },
    });
    return { provider, service, slot };
  }

  async function makeClient(email: string) {
    return prisma.client.create({ data: { email, name: "Guest" } });
  }

  it("allows exactly one CONFIRMED booking per slot", async () => {
    const { provider, service, slot } = await seedProviderServiceAndSlot("case-1");
    const clientA = await makeClient("client-a@example.com");
    const clientB = await makeClient("client-b@example.com");

    const first = await prisma.booking.create({
      data: {
        slotId: slot.id,
        providerId: provider.id,
        serviceId: service.id,
        clientId: clientA.id,
        status: "CONFIRMED",
      },
    });
    expect(first.status).toBe("CONFIRMED");

    // The conflicting insert: a second CONFIRMED booking for the exact same
    // slot. This must fail — that failure IS the proof the constraint works.
    let conflictError: unknown;
    try {
      await prisma.booking.create({
        data: {
          slotId: slot.id,
          providerId: provider.id,
          serviceId: service.id,
          clientId: clientB.id,
          status: "CONFIRMED",
        },
      });
    } catch (error) {
      conflictError = error;
    }

    expect(conflictError).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    // The partial unique index "booking_slot_active_unique" (see
    // prisma/migrations/*_init/migration.sql) is what rejects this insert.
    // Prisma surfaces a plain Postgres unique-violation as P2002.
    expect((conflictError as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");

    const confirmedCount = await prisma.booking.count({
      where: { slotId: slot.id, status: "CONFIRMED" },
    });
    expect(confirmedCount).toBe(1);
  });

  it("frees the slot for rebooking once the first booking is cancelled", async () => {
    const { provider, service, slot } = await seedProviderServiceAndSlot("case-2");
    const clientA = await makeClient("client-c@example.com");
    const clientB = await makeClient("client-d@example.com");

    const first = await prisma.booking.create({
      data: {
        slotId: slot.id,
        providerId: provider.id,
        serviceId: service.id,
        clientId: clientA.id,
        status: "CONFIRMED",
      },
    });

    await prisma.booking.update({
      where: { id: first.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Now a second CONFIRMED booking for the same slot must succeed — the
    // partial index only blocks concurrent CONFIRMED rows, not history.
    const second = await prisma.booking.create({
      data: {
        slotId: slot.id,
        providerId: provider.id,
        serviceId: service.id,
        clientId: clientB.id,
        status: "CONFIRMED",
      },
    });
    expect(second.status).toBe("CONFIRMED");

    const confirmedCount = await prisma.booking.count({
      where: { slotId: slot.id, status: "CONFIRMED" },
    });
    expect(confirmedCount).toBe(1);
  });
});
