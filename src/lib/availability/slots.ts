import type { PrismaClient, Slot } from "@prisma/client";
import { decodeSlotCursor, encodeSlotCursor } from "./cursor";
import { ValidationError } from "./errors";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function listUpcomingSlots(
  db: PrismaClient,
  providerId: string,
  query: { cursor?: string | null; limit?: number; now?: Date },
): Promise<{ slots: Slot[]; nextCursor: string | null }> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError("LIMIT_INVALID", "limit must be 1–100.");
  }
  const now = query.now ?? new Date();
  const cursor = query.cursor ? decodeSlotCursor(query.cursor) : null;
  if (query.cursor && !cursor) {
    throw new ValidationError("CURSOR_INVALID", "Invalid cursor.");
  }

  const rows = await db.slot.findMany({
    where: cursor
      ? {
          providerId,
          startAt: { gte: now },
          OR: [
            { startAt: { gt: new Date(cursor.startAt) } },
            {
              AND: [{ startAt: new Date(cursor.startAt) }, { id: { gt: cursor.id } }],
            },
          ],
        }
      : { providerId, startAt: { gte: now } },
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    take: limit + 1,
  });

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor =
    rows.length > limit && last ? encodeSlotCursor(last.startAt, last.id) : null;
  return { slots: page, nextCursor };
}
