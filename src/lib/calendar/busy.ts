import type { Prisma, PrismaClient } from "@prisma/client";
import type { TimeInterval } from "./overlap";

export type CalendarDb = PrismaClient | Prisma.TransactionClient;

/** Busy blocks for a provider that can still affect future slots. */
export async function listBusyIntervals(
  db: CalendarDb,
  providerId: string,
  from: Date,
): Promise<TimeInterval[]> {
  const rows = await db.calendarBusyBlock.findMany({
    where: {
      providerId,
      endAt: { gt: from },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });
  return rows;
}

/** Whether this slot interval is blocked by an external busy block. */
export async function isSlotExternallyBusy(
  db: CalendarDb,
  providerId: string,
  slot: TimeInterval,
): Promise<boolean> {
  const hit = await db.calendarBusyBlock.findFirst({
    where: {
      providerId,
      startAt: { lt: slot.endAt },
      endAt: { gt: slot.startAt },
    },
    select: { id: true },
  });
  return hit !== null;
}

/**
 * Replace all busy blocks for one connection with a fresh FreeBusy snapshot.
 * Runs in a transaction so a failed sync does not leave a partial wipe.
 */
export async function replaceBusyBlocks(
  db: PrismaClient,
  input: {
    connectionId: string;
    providerId: string;
    blocks: readonly TimeInterval[];
  },
): Promise<number> {
  return db.$transaction(async (tx) => {
    await tx.calendarBusyBlock.deleteMany({
      where: { connectionId: input.connectionId },
    });
    if (input.blocks.length === 0) return 0;
    const result = await tx.calendarBusyBlock.createMany({
      data: input.blocks.map((block) => ({
        connectionId: input.connectionId,
        providerId: input.providerId,
        startAt: block.startAt,
        endAt: block.endAt,
      })),
    });
    return result.count;
  });
}

/** Delete connection + cascade busy blocks (disconnect / account scrub). */
export async function deleteCalendarConnection(
  db: CalendarDb,
  connectionId: string,
): Promise<void> {
  await db.calendarConnection.deleteMany({ where: { id: connectionId } });
}

export async function deleteAllCalendarConnectionsForProvider(
  db: CalendarDb,
  providerId: string,
): Promise<void> {
  await db.calendarConnection.deleteMany({ where: { providerId } });
}
