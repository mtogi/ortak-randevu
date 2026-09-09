import { getLocale, getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { MissingNotice } from "@/components/missing-notice";
import { PageMain } from "@/components/page-main";
import { SlotPicker } from "@/components/slot-picker";
import {
  BookingNotFoundError,
  GUEST_MODIFY_CUTOFF_HOURS,
  formatSlotRange,
  formatSlotStart,
  getGuestBooking,
  guestCanModify,
  guestHasContactPii,
  guestModifyDeadline,
  isGuestErrorCode,
  listOpenSlots,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import {
  cancelBookingAction,
  eraseClientPiiAction,
  rescheduleBookingAction,
} from "./actions";

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

  const [t, tNav, locale] = await Promise.all([
    getTranslations("manageBooking"),
    getTranslations("nav"),
    getLocale(),
  ]);

  let booking;
  try {
    booking = await getGuestBooking(prisma, bookingId, token ?? null);
  } catch (cause) {
    if (cause instanceof BookingNotFoundError) {
      return (
        <MissingNotice message={t("errors.BOOKING_NOT_FOUND")} linkLabel={tNav("home")} />
      );
    }
    throw cause;
  }
  const now = new Date();
  const timeZone = booking.provider.timezone;
  const canModify =
    booking.status === "CONFIRMED" && guestCanModify(booking.slot.startAt, now);
  const canErase = guestHasContactPii(booking.client);

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
      <PageMain>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {created ? t("titleConfirmed") : t("title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t(`status.${booking.status}`)}
          </p>
        </div>

        {created ? <p className="banner banner-ok">{t("emailSent")}</p> : null}
        {saved ? <p className="banner banner-ok">{t(`saved.${saved}`)}</p> : null}
        {error ? (
          <p className="banner banner-error" role="alert">
            {isGuestErrorCode(error) ? t(`errors.${error}`) : t("errors.UNKNOWN")}
          </p>
        ) : null}

        <dl className="surface grid gap-3 text-sm">
          <div>
            <dt className="text-[var(--muted)]">{t("provider")}</dt>
            <dd>{booking.provider.name ?? booking.provider.slug}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("service")}</dt>
            <dd>
              {booking.service.title} · {booking.service.durationMinutes} {t("minutes")}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("when")}</dt>
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
            <dt className="text-[var(--muted)]">{t("bookedFor")}</dt>
            <dd>{booking.client.name ?? t("piiRemoved")}</dd>
          </div>
        </dl>

        {booking.status === "CONFIRMED" ? (
          <p className="text-sm text-[var(--muted)]">
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
            <section className="surface flex flex-col gap-3">
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
                  <button type="submit" className="btn btn-primary self-start">
                    {t("rescheduleSubmit")}
                  </button>
                ) : null}
              </form>
            </section>

            <section className="surface flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("cancelTitle")}</h2>
              <form action={cancelBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="token" value={token ?? ""} />
                <button type="submit" className="btn btn-danger">
                  {t("cancelSubmit")}
                </button>
              </form>
            </section>
          </>
        ) : null}

        {canErase ? (
          <section className="surface flex flex-col gap-3">
            <h2 className="text-lg font-medium">{t("eraseTitle")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("eraseHint")}</p>
            <form action={eraseClientPiiAction} className="flex flex-col gap-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="token" value={token ?? ""} />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="confirm"
                  value="erase"
                  className="mt-1"
                  required
                />
                <span>{t("eraseConfirm")}</span>
              </label>
              <button type="submit" className="btn btn-danger self-start">
                {t("eraseSubmit")}
              </button>
            </form>
          </section>
        ) : (
          <p className="text-sm text-[var(--muted)]">{t("eraseDone")}</p>
        )}
      </PageMain>
    </>
  );
}
