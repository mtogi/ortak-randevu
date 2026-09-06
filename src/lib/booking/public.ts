// Read side of the public booking page. Everything here is served to
// unauthenticated visitors, so the DTOs deliberately omit provider email and
// every client field — PII minimization (.cursor/rules/security.mdc).
import type { LocationType, PrismaClient, Slot } from "@prisma/client";
import { decodeSlotCursor, encodeSlotCursor } from "@/lib/availability";
import { PUBLIC_SLOTS_LIMIT } from "./constants";
import { BookingValidationError } from "./errors";

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
 * forward. Same cursor contract as the provider-side list (Q-D9), ordered by
 * `(startAt, id)` ascending because a booker reads a calendar forwards.
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
  const cursor = input.cursor ? decodeSlotCursor(input.cursor) : null;
  if (input.cursor && !cursor) {
    throw new BookingValidationError("CURSOR_INVALID", "Invalid cursor.");
  }

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
    take: limit + 1,
  });

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor =
    rows.length > limit && last ? encodeSlotCursor(last.startAt, last.id) : null;
  return { slots: page, nextCursor };
}
