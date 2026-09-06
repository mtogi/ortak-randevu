import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { replaceWeeklyHours } from "./hours";
import { regenerateSlotsForService } from "./regenerate";
import { createService } from "./services";

describe("regenerateSlotsForService", () => {
  let testPg: LocalTestPostgres;
  let db: PrismaClient;

  beforeAll(async () => {
    testPg = await startLocalTestPostgres();
    db = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await db.$disconnect();
    await testPg.stop();
  });

  it("materializes OPEN slots and does not overlap a BOOKED interval", async () => {
    const provider = await db.provider.create({
      data: {
        email: "slots@example.com",
        slug: "slots-dietitian",
        timezone: "Europe/Istanbul",
      },
    });
    const service = await createService(db, provider.id, {
      title: "Consult",
      durationMinutes: 30,
    });
    await replaceWeeklyHours(db, provider.id, [
      { weekday: 1, startMinute: 9 * 60, endMinute: 10 * 60 },
    ]);

    const now = new Date("2026-09-07T05:00:00.000Z");
    const first = await regenerateSlotsForService(db, {
      providerId: provider.id,
      serviceId: service.id,
      now,
      horizonDays: 1,
    });
    expect(first.created).toBe(3);

    const nine = await db.slot.findFirstOrThrow({
      where: { providerId: provider.id, startAt: new Date("2026-09-07T06:00:00.000Z") },
    });
    const client = await db.client.create({
      data: { email: "guest@example.com", name: "Guest" },
    });
    await db.booking.create({
      data: {
        slotId: nine.id,
        providerId: provider.id,
        serviceId: service.id,
        clientId: client.id,
        status: "CONFIRMED",
      },
    });
    await db.slot.update({
      where: { id: nine.id },
      data: { status: "BOOKED" },
    });

    const second = await regenerateSlotsForService(db, {
      providerId: provider.id,
      serviceId: service.id,
      now,
      horizonDays: 1,
    });
    expect(second.created).toBe(1);
    expect(second.skippedOverlap).toBe(2);

    const open = await db.slot.findMany({
      where: { providerId: provider.id, status: "OPEN" },
      orderBy: { startAt: "asc" },
    });
    expect(open.map((row) => row.startAt.toISOString())).toEqual(["2026-09-07T06:30:00.000Z"]);
    const booked = await db.slot.findUniqueOrThrow({ where: { id: nine.id } });
    expect(booked.status).toBe("BOOKED");
  });
});
