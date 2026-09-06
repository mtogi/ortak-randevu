import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { SlotPicker } from "@/components/slot-picker";
import {
  BookingNotFoundError,
  GUEST_MODIFY_CUTOFF_HOURS,
  formatSlotRange,
  formatSlotStart,
  getGuestBooking,
  guestCanModify,
  guestModifyDeadline,
  isGuestErrorCode,
  listOpenSlots,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { cancelBookingAction, rescheduleBookingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ t?: string; created?: string; saved?: string; error?: string }>;
}) {
  const { bookingId } = await params;
  const { t: token, created, saved, error } = await searchParams;

  const booking = await getGuestBooking(prisma, bookingId, token ?? null).catch(
    (cause) => {
      if (cause instanceof BookingNotFoundError) notFound();
      throw cause;
    },
  );

  const [t, locale] = await Promise.all([getTranslations("manageBooking"), getLocale()]);
  const now = new Date();
  const timeZone = booking.provider.timezone;
  const canModify =
    booking.status === "CONFIRMED" && guestCanModify(booking.slot.startAt, now);

  const alternatives = canModify
    ? (
        await listOpenSlots(prisma, {
          providerId: booking.provider.id,
          serviceId: booking.service.id,
          now,
        })
      ).slots.filter((slot) => slot.id !== booking.slot.id)
    : [];

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pb-16">
        <div>
          <h1 className="text-2xl font-semibold">
            {created ? t("titleConfirmed") : t("title")}
          </h1>
          <p className="mt-2 text-sm opacity-80">{t(`status.${booking.status}`)}</p>
        </div>

        {created ? (
          <p className="rounded-lg border border-current/20 px-3 py-2 text-sm">
            {t("emailSent")}
          </p>
        ) : null}
        {saved ? (
          <p className="rounded-lg border border-current/20 px-3 py-2 text-sm">
            {t(`saved.${saved}`)}
          </p>
        ) : null}
        {error ? (
          <p
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm"
            role="alert"
          >
            {isGuestErrorCode(error) ? t(`errors.${error}`) : t("errors.UNKNOWN")}
          </p>
        ) : null}

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="opacity-70">{t("provider")}</dt>
            <dd>{booking.provider.name ?? booking.provider.slug}</dd>
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
          <div>
            <dt className="opacity-70">{t("bookedFor")}</dt>
            <dd>{booking.client.name}</dd>
          </div>
        </dl>

        {booking.status === "CONFIRMED" ? (
          <p className="text-sm opacity-70">
            {canModify
              ? t("policyOpen", {
                  hours: GUEST_MODIFY_CUTOFF_HOURS,
                  deadline: formatSlotStart(
                    guestModifyDeadline(booking.slot.startAt),
                    timeZone,
                    locale,
                  ),
                })
              : t("policyClosed", { hours: GUEST_MODIFY_CUTOFF_HOURS })}
          </p>
        ) : null}

        {canModify ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("rescheduleTitle")}</h2>
              <form action={rescheduleBookingAction} className="flex flex-col gap-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="token" value={token ?? ""} />
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
              <form action={cancelBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="token" value={token ?? ""} />
                <button
                  type="submit"
                  className="rounded border border-current/20 px-3 py-2 text-sm"
                >
                  {t("cancelSubmit")}
                </button>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
