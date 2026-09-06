import type { BookingStatus, LocationType, Prisma, PrismaClient } from "@prisma/client";

/**
 * Everything the booking pages, the public API, and the notification mail
 * need about one booking. `provider.email`/`locale` are internal (mail
 * routing) — API responses go through `toGuestBookingDetail`.
 */
export type BookingDetail = {
  id: string;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt: Date | null;
  meetingUrl: string | null;
  address: string | null;
  slot: { id: string; startAt: Date; endAt: Date };
  service: {
    id: string;
    title: string;
    durationMinutes: number;
    locationType: LocationType;
    priceAmount: number | null;
    priceCurrency: string | null;
  };
  provider: {
    id: string;
    name: string | null;
    slug: string;
    timezone: string;
    locale: string;
    email: string;
  };
  client: { name: string | null; email: string; phone: string | null };
};

const bookingDetailSelect = {
  id: true,
  status: true,
  createdAt: true,
  cancelledAt: true,
  meetingUrl: true,
  address: true,
  slot: { select: { id: true, startAt: true, endAt: true } },
  service: {
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      locationType: true,
      priceAmount: true,
      priceCurrency: true,
    },
  },
  provider: {
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      locale: true,
      email: true,
    },
  },
  client: { select: { name: true, email: true, phone: true } },
} satisfies Prisma.BookingSelect;

export async function loadBookingDetail(
  db: PrismaClient | Prisma.TransactionClient,
  bookingId: string,
): Promise<BookingDetail | null> {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: bookingDetailSelect,
  });
}

/** API/response shape: drops the provider's email address. */
export function toGuestBookingDetail(detail: BookingDetail) {
  const { provider, ...rest } = detail;
  return {
    ...rest,
    provider: {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      timezone: provider.timezone,
    },
  };
}
