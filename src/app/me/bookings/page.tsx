import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
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
          <PageMain>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="banner banner-error" role="alert">
              {error.code === "CURSOR_INVALID" || isGuestErrorCode(error.code)
                ? t(`errors.${error.code}`)
                : t("errors.UNKNOWN")}
            </p>
          </PageMain>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <AppHeader />
      <PageMain>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("intro")}</p>
        </div>

        {result.bookings.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {result.bookings.map((booking) => (
              <li key={booking.id}>
                <Link href={`/me/bookings/${booking.id}`} className="booking-row text-sm">
                  <p className="font-medium">
                    {booking.client.name ?? t("piiRemoved")} · {booking.service.title}
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    {formatSlotRange(
                      booking.slot.startAt,
                      booking.slot.endAt,
                      provider.timezone,
                      locale,
                    )}
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    {t(`status.${booking.status}`)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {result.nextCursor ? (
          <Link
            href={`/me/bookings?cursor=${encodeURIComponent(result.nextCursor)}`}
            className="nav-link text-sm"
          >
            {t("next")}
          </Link>
        ) : null}
      </PageMain>
    </>
  );
}
