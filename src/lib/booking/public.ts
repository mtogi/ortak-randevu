// Read side of the public booking page. Everything here is served to
// unauthenticated visitors, so the DTOs deliberately omit provider email and
// every client field — PII minimization (.cursor/rules/security.mdc).
import type { LocationType, PrismaClient, Slot } from "@prisma/client";
import { decodeSlotCursor, encodeSlotCursor } from "@/lib/availability";
import { listBusyIntervals, overlapsAnyBusy } from "@/lib/calendar";
import { PUBLIC_SLOTS_LIMIT } from "./constants";
import { BookingValidationError } from "./errors";

/** How many OPEN rows to pull per pass while skipping externally-busy ones. */
const BUSY_FILTER_BATCH = 80;
const BUSY_FILTER_MAX_PASSES = 25;

const MAX_LIMIT = 200;

export type PublicService = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  locationType: LocationType;
  priceAmount: number | null;
  priceCurrency: string | null;
};

export type PublicProviderPage = {
  id: string;
  name: string | null;
  slug: string;
  bio: string | null;
  timezone: string;
  services: PublicService[];
};

export async function getPublicProviderPage(
  db: PrismaClient,
  slug: string,
): Promise<PublicProviderPage | null> {
  const provider = await db.provider.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      timezone: true,
      services: {
        where: { deletedAt: null, isActive: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          durationMinutes: true,
          locationType: true,
          priceAmount: true,
          priceCurrency: true,
        },
      },
    },
  });
  return provider;
}

/**
 * Bookable slots for one service: the OPEN rows M2b materialized, from `now`
 * forward, minus intervals that overlap external calendar busy (ADR-009).
 * Same cursor contract as the provider-side list (Q-D9), ordered by
 * `(startAt, id)` ascending because a booker reads a calendar forwards.
 * `booking_slot_active_unique` is unchanged — busy only filters offerability.
 */
export async function listOpenSlots(
  db: PrismaClient,
  input: {
    providerId: string;
    serviceId: string;
    cursor?: string | null;
    limit?: number;
    now?: Date;
  },
): Promise<{ slots: Slot[]; nextCursor: string | null }> {
  const limit = input.limit ?? PUBLIC_SLOTS_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new BookingValidationError("LIMIT_INVALID", `limit must be 1–${MAX_LIMIT}.`);
  }
  const now = input.now ?? new Date();
  let cursor = input.cursor ? decodeSlotCursor(input.cursor) : null;
  if (input.cursor && !cursor) {
    throw new BookingValidationError("CURSOR_INVALID", "Invalid cursor.");
  }

  const busy = await listBusyIntervals(db, input.providerId, now);
  const page: Slot[] = [];

  for (let pass = 0; pass < BUSY_FILTER_MAX_PASSES && page.length < limit + 1; pass++) {
    const base = {
      providerId: input.providerId,
      serviceId: input.serviceId,
      status: "OPEN" as const,
      startAt: { gte: now },
    };
    const rows = await db.slot.findMany({
      where: cursor
        ? {
            ...base,
            OR: [
              { startAt: { gt: new Date(cursor.startAt) } },
              { AND: [{ startAt: new Date(cursor.startAt) }, { id: { gt: cursor.id } }] },
            ],
          }
        : base,
      orderBy: [{ startAt: "asc" }, { id: "asc" }],
      take: BUSY_FILTER_BATCH,
    });
    if (rows.length === 0) break;
    for (const row of rows) {
      if (!overlapsAnyBusy(row, busy)) {
        page.push(row);
        if (page.length >= limit + 1) break;
      }
    }
    const lastFetched = rows[rows.length - 1]!;
    cursor = { startAt: lastFetched.startAt.toISOString(), id: lastFetched.id };
    if (rows.length < BUSY_FILTER_BATCH) break;
  }

  const slots = page.slice(0, limit);
  const last = slots[slots.length - 1];
  const nextCursor =
    page.length > limit && last ? encodeSlotCursor(last.startAt, last.id) : null;
  return { slots, nextCursor };
}
