import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { ValidationError } from "./errors";
import { replaceWeeklyHours } from "./hours";
import { regenerateAllActiveServices } from "./regenerate";
import { createService } from "./services";

const WEEKDAYS = [1, 2, 3, 4, 5] as const;
const FULL_WEEK = WEEKDAYS.map((weekday) => ({
  weekday,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
}));

describe("replaceWeeklyHours (idempotent full-week save)", () => {
  let testPg: LocalTestPostgres;
  let db: PrismaClient;

  beforeAll(async () => {
    testPg = await startLocalTestPostgres();
    db = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await db?.$disconnect();
    await testPg?.stop();
  });

  async function seedProvider(slug: string) {
    return db.provider.create({
      data: {
        email: `${slug}@example.com`,
        slug,
        timezone: "Europe/Istanbul",
      },
    });
  }

  it("upserts a full week when some weekdays already have rows", async () => {
    const provider = await seedProvider("hours-partial");
    await db.weeklyHours.create({
      data: {
        providerId: provider.id,
        weekday: 1,
        startMinute: 10 * 60,
        endMinute: 12 * 60,
      },
    });
    await db.weeklyHours.create({
      data: {
        providerId: provider.id,
        weekday: 1,
        startMinute: 14 * 60,
        endMinute: 16 * 60,
      },
    });

    const saved = await replaceWeeklyHours(db, provider.id, FULL_WEEK);

    expect(saved.map((row) => row.weekday)).toEqual([...WEEKDAYS]);
    expect(saved.every((row) => row.startMinute === 9 * 60)).toBe(true);
    expect(saved.every((row) => row.endMinute === 17 * 60)).toBe(true);
    expect(saved.filter((row) => row.weekday === 1)).toHaveLength(1);
  });

  it("can save the same full week twice and still regenerate slots", async () => {
    const provider = await seedProvider("hours-repeat");
    const service = await createService(db, provider.id, {
      title: "Consult",
      durationMinutes: 30,
    });

    await replaceWeeklyHours(db, provider.id, FULL_WEEK);
    const first = await regenerateAllActiveServices(db, provider.id, {
      now: new Date("2026-09-07T05:00:00.000Z"),
      horizonDays: 7,
    });
    expect(first.created).toBeGreaterThan(0);

    const again = await replaceWeeklyHours(db, provider.id, FULL_WEEK);
    expect(again).toHaveLength(WEEKDAYS.length);

    const second = await regenerateAllActiveServices(db, provider.id, {
      now: new Date("2026-09-07T05:00:00.000Z"),
      horizonDays: 7,
    });
    expect(second.created).toBe(first.created);

    const openSlots = await db.slot.count({
      where: { providerId: provider.id, serviceId: service.id, status: "OPEN" },
    });
    expect(openSlots).toBe(second.created);
  });

  it("clears days omitted from the payload", async () => {
    const provider = await seedProvider("hours-clear");
    await replaceWeeklyHours(db, provider.id, FULL_WEEK);
    const remaining = await replaceWeeklyHours(db, provider.id, [
      { weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60 },
    ]);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.weekday).toBe(1);
    expect(remaining[0]?.endMinute).toBe(12 * 60);
  });

  it("rejects two different windows on the same weekday", async () => {
    const provider = await seedProvider("hours-dup");
    await expect(
      replaceWeeklyHours(db, provider.id, [
        { weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60 },
        { weekday: 1, startMinute: 14 * 60, endMinute: 17 * 60 },
      ]),
    ).rejects.toSatisfy(
      (error) => error instanceof ValidationError && error.code === "WEEKDAY_DUPLICATE",
    );
  });
});
