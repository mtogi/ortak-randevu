import type { PrismaClient, WeeklyHours } from "@prisma/client";
import { ValidationError } from "./errors";
import { assertMinuteWindow } from "./grid";
import { assertWeekday, type WeeklyWindow } from "./windows";

export async function listWeeklyHours(
  db: PrismaClient,
  providerId: string,
): Promise<WeeklyHours[]> {
  return db.weeklyHours.findMany({
    where: { providerId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });
}

/**
 * One window per weekday (matches the availability form). Same times twice
 * collapse; two different windows on one day are rejected.
 */
export function normalizeWeeklyWindows(windows: WeeklyWindow[]): WeeklyWindow[] {
  const byDay = new Map<number, WeeklyWindow>();
  for (const window of windows) {
    assertWeekday(window.weekday);
    assertMinuteWindow(window.startMinute, window.endMinute);
    const previous = byDay.get(window.weekday);
    if (
      previous &&
      (previous.startMinute !== window.startMinute ||
        previous.endMinute !== window.endMinute)
    ) {
      throw new ValidationError(
        "WEEKDAY_DUPLICATE",
        "Each weekday can only have one hours window.",
      );
    }
    byDay.set(window.weekday, window);
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

/**
 * Idempotent replace: update existing weekday rows, insert missing days,
 * delete days not in the payload. A full-week submit must not fail when
 * some weekdays already have rows.
 */
export async function replaceWeeklyHours(
  db: PrismaClient,
  providerId: string,
  windows: WeeklyWindow[],
): Promise<WeeklyHours[]> {
  const desired = normalizeWeeklyWindows(windows);
  const keepDays = new Set(desired.map((window) => window.weekday));

  await db.$transaction(async (tx) => {
    const existing = await tx.weeklyHours.findMany({
      where: { providerId },
      orderBy: [{ weekday: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    const byWeekday = new Map<number, WeeklyHours[]>();
    for (const row of existing) {
      const list = byWeekday.get(row.weekday) ?? [];
      list.push(row);
      byWeekday.set(row.weekday, list);
    }

    for (const window of desired) {
      const [first, ...extras] = byWeekday.get(window.weekday) ?? [];
      if (!first) {
        await tx.weeklyHours.create({
          data: {
            providerId,
            weekday: window.weekday,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
          },
        });
        continue;
      }
      await tx.weeklyHours.update({
        where: { id: first.id },
        data: {
          startMinute: window.startMinute,
          endMinute: window.endMinute,
        },
      });
      if (extras.length > 0) {
        await tx.weeklyHours.deleteMany({
          where: { id: { in: extras.map((row) => row.id) } },
        });
      }
    }

    const staleIds = existing
      .filter((row) => !keepDays.has(row.weekday))
      .map((row) => row.id);
    if (staleIds.length > 0) {
      await tx.weeklyHours.deleteMany({ where: { id: { in: staleIds } } });
    }
  });

  return listWeeklyHours(db, providerId);
}

export async function listExceptions(db: PrismaClient, providerId: string) {
  return db.availabilityException.findMany({
    where: { providerId },
    orderBy: { date: "asc" },
  });
}

export async function upsertException(
  db: PrismaClient,
  providerId: string,
  input: {
    date: Date;
    isClosed: boolean;
    startMinute: number | null;
    endMinute: number | null;
  },
) {
  if (!input.isClosed) {
    if (input.startMinute == null || input.endMinute == null) {
      throw new ValidationError(
        "EXCEPTION_HOURS_REQUIRED",
        "Open exceptions need start and end times.",
      );
    }
    assertMinuteWindow(input.startMinute, input.endMinute);
  }

  return db.availabilityException.upsert({
    where: {
      providerId_date: { providerId, date: input.date },
    },
    create: {
      providerId,
      date: input.date,
      isClosed: input.isClosed,
      startMinute: input.isClosed ? null : input.startMinute,
      endMinute: input.isClosed ? null : input.endMinute,
    },
    update: {
      isClosed: input.isClosed,
      startMinute: input.isClosed ? null : input.startMinute,
      endMinute: input.isClosed ? null : input.endMinute,
    },
  });
}

export async function deleteException(db: PrismaClient, providerId: string, date: Date) {
  await db.availabilityException.deleteMany({
    where: { providerId, date },
  });
}
