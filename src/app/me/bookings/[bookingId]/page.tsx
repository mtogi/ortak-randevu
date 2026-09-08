import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SlotPicker } from "@/components/slot-picker";
import { auth } from "@/auth";
import {
  BookingNotFoundError,
  formatSlotRange,
  getProviderBooking,
  isGuestErrorCode,
  listOpenSlots,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import {
  cancelProviderBookingAction,
  completeProviderBookingAction,
  markNoShowProviderBookingAction,
  rescheduleProviderBookingAction,
} from "./actions";

export const dynamic = "force-dynamic";

const DASHBOARD_ERROR_CODES = [
  "SLOT_REQUIRED",
  "SLOT_UNCHANGED",
  "SLOT_UNAVAILABLE",
  "BOOKING_NOT_FOUND",
  "BOOKING_NOT_CONFIRMED",
] as const;

export default async function ProviderBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  const { bookingId } = await params;
  const { saved, error } = await searchParams;

  const booking = await getProviderBooking(prisma, provider.id, bookingId).catch(
    (cause) => {
      if (cause instanceof BookingNotFoundError) notFound();
      throw cause;
    },
  );

  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);
  const timeZone = booking.provider.timezone;
  const canModify = booking.status === "CONFIRMED";
  const alternatives = canModify
    ? (
        await listOpenSlots(prisma, {
          providerId: provider.id,
          serviceId: booking.service.id,
        })
      ).slots.filter((slot) => slot.id !== booking.slot.id)
    : [];

  const errorMessage = error
    ? DASHBOARD_ERROR_CODES.includes(error as (typeof DASHBOARD_ERROR_CODES)[number]) ||
      isGuestErrorCode(error)
      ? t(`errors.${error}`)
      : t("errors.UNKNOWN")
    : null;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pb-16">
        <div>
          <p className="text-sm">
            <Link href="/me/bookings" className="underline underline-offset-4">
              {t("back")}
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{t("detailTitle")}</h1>
          <p className="mt-2 text-sm opacity-80">{t(`status.${booking.status}`)}</p>
        </div>

        {saved ? (
          <p className="rounded-lg border border-current/20 px-3 py-2 text-sm">
            {t(`saved.${saved}`)}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="opacity-70">{t("client")}</dt>
            <dd>{booking.client.name ?? t("piiRemoved")}</dd>
          </div>
          <div>
            <dt className="opacity-70">{t("email")}</dt>
            <dd>{booking.client.email ?? t("piiRemoved")}</dd>
          </div>
          <div>
            <dt className="opacity-70">{t("phone")}</dt>
            <dd>{booking.client.phone ?? t("piiRemoved")}</dd>
          </div>
          <div>
            <dt className="opacity-70">{t("service")}</dt>
            <dd>
              {booking.service.title} · {booking.service.durationMinutes} {t("minutes")}
            </dd>
          </div>
          <div>
            <dt className="opacity-70">{t("when")}</dt>
            <dd>
              {formatSlotRange(
                booking.slot.startAt,
                booking.slot.endAt,
                timeZone,
                locale,
              )}
            </dd>
          </div>
        </dl>

        {canModify ? (
          <>
            <p className="text-sm opacity-70">{t("policy")}</p>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("rescheduleTitle")}</h2>
              <form
                action={rescheduleProviderBookingAction}
                className="flex flex-col gap-4"
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <SlotPicker
                  slots={alternatives}
                  timeZone={timeZone}
                  locale={locale}
                  name="slotId"
                  emptyLabel={t("noAlternatives")}
                />
                {alternatives.length > 0 ? (
                  <button
                    type="submit"
                    className="self-start rounded border border-current/20 px-3 py-2 text-sm"
                  >
                    {t("rescheduleSubmit")}
                  </button>
                ) : null}
              </form>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("cancelTitle")}</h2>
              <form action={cancelProviderBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="rounded border border-current/20 px-3 py-2 text-sm"
                >
                  {t("cancelSubmit")}
                </button>
              </form>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("concludeTitle")}</h2>
              <div className="flex flex-wrap gap-3">
                <form action={completeProviderBookingAction}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="rounded border border-current/20 px-3 py-2 text-sm"
                  >
                    {t("completeSubmit")}
                  </button>
                </form>
                <form action={markNoShowProviderBookingAction}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="rounded border border-current/20 px-3 py-2 text-sm"
                  >
                    {t("noShowSubmit")}
                  </button>
                </form>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
