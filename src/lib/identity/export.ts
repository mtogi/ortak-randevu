// Q-L3: provider-owned export of allowed PII + booking operational data.
// No clinical fields — see docs/legal/DATA-CLASSIFICATION.md.
import type { PrismaClient } from "@prisma/client";

export type ProviderDataExport = {
  exportedAt: string;
  provider: {
    id: string;
    email: string | null;
    name: string | null;
    slug: string;
    bio: string | null;
    timezone: string;
    locale: string;
    createdAt: string;
  };
  services: Array<{
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    locationType: string;
    priceAmount: number | null;
    priceCurrency: string | null;
    isActive: boolean;
  }>;
  weeklyHours: Array<{
    weekday: number;
    startMinute: number;
    endMinute: number;
  }>;
  exceptions: Array<{
    date: string;
    isClosed: boolean;
    startMinute: number | null;
    endMinute: number | null;
  }>;
  bookings: Array<{
    id: string;
    status: string;
    createdAt: string;
    cancelledAt: string | null;
    meetingUrl: string | null;
    address: string | null;
    slot: { startAt: string; endAt: string };
    service: { title: string; durationMinutes: number; locationType: string };
    client: { name: string | null; email: string | null; phone: string | null };
    events: Array<{
      fromStatus: string | null;
      toStatus: string;
      actor: string;
      createdAt: string;
    }>;
  }>;
};

function iso(value: Date): string {
  return value.toISOString();
}

/** Snapshot the signed-in provider may keep. Authz is the caller's job. */
export async function exportProviderData(
  db: PrismaClient,
  providerId: string,
): Promise<ProviderDataExport> {
  const provider = await db.provider.findFirst({
    where: { id: providerId, deletedAt: null },
    include: {
      services: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      weeklyHours: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
      exceptions: { orderBy: { date: "asc" } },
      bookings: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          slot: { select: { startAt: true, endAt: true } },
          service: {
            select: { title: true, durationMinutes: true, locationType: true },
          },
          client: { select: { name: true, email: true, phone: true } },
          events: {
            orderBy: { createdAt: "asc" },
            select: {
              fromStatus: true,
              toStatus: true,
              actor: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!provider) {
    throw new Error("Provider not found.");
  }

  return {
    exportedAt: new Date().toISOString(),
    provider: {
      id: provider.id,
      email: provider.email,
      name: provider.name,
      slug: provider.slug,
      bio: provider.bio,
      timezone: provider.timezone,
      locale: provider.locale,
      createdAt: iso(provider.createdAt),
    },
    services: provider.services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      durationMinutes: service.durationMinutes,
      locationType: service.locationType,
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency,
      isActive: service.isActive,
    })),
    weeklyHours: provider.weeklyHours.map((row) => ({
      weekday: row.weekday,
      startMinute: row.startMinute,
      endMinute: row.endMinute,
    })),
    exceptions: provider.exceptions.map((row) => ({
      date: iso(row.date).slice(0, 10),
      isClosed: row.isClosed,
      startMinute: row.startMinute,
      endMinute: row.endMinute,
    })),
    bookings: provider.bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      createdAt: iso(booking.createdAt),
      cancelledAt: booking.cancelledAt ? iso(booking.cancelledAt) : null,
      meetingUrl: booking.meetingUrl,
      address: booking.address,
      slot: { startAt: iso(booking.slot.startAt), endAt: iso(booking.slot.endAt) },
      service: {
        title: booking.service.title,
        durationMinutes: booking.service.durationMinutes,
        locationType: booking.service.locationType,
      },
      client: {
        name: booking.client.name,
        email: booking.client.email,
        phone: booking.client.phone,
      },
      events: booking.events.map((event) => ({
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        actor: event.actor,
        createdAt: iso(event.createdAt),
      })),
    })),
  };
}
