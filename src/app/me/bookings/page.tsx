import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import {
  BookingError,
  formatSlotRange,
  isGuestErrorCode,
  listProviderBookings,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function ProviderBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  const { cursor } = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);

  let result;
  try {
    result = await listProviderBookings(prisma, provider.id, { cursor });
  } catch (error) {
    if (error instanceof BookingError) {
      return (
        <>
          <AppHeader />
          <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 pb-16">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p
              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm"
              role="alert"
            >
              {error.code === "CURSOR_INVALID" || isGuestErrorCode(error.code)
                ? t(`errors.${error.code}`)
                : t("errors.UNKNOWN")}
            </p>
          </main>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 pb-16">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm opacity-80">{t("intro")}</p>
        </div>

        {result.bookings.length === 0 ? (
          <p className="text-sm opacity-70">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {result.bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/me/bookings/${booking.id}`}
                  className="block rounded-lg border border-current/20 px-4 py-3 text-sm"
                >
                  <p className="font-medium">
                    {booking.client.name} · {booking.service.title}
                  </p>
                  <p className="mt-1 opacity-80">
                    {formatSlotRange(
                      booking.slot.startAt,
                      booking.slot.endAt,
                      provider.timezone,
                      locale,
                    )}
                  </p>
                  <p className="mt-1 opacity-70">{t(`status.${booking.status}`)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {result.nextCursor ? (
          <Link
            href={`/me/bookings?cursor=${encodeURIComponent(result.nextCursor)}`}
            className="text-sm underline underline-offset-4"
          >
            {t("next")}
          </Link>
        ) : null}
      </main>
    </>
  );
}
