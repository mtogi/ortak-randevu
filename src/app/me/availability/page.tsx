import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import {
  GRID_MINUTES,
  SLOT_HORIZON_DAYS,
  civilDateKey,
  listExceptions,
  listServices,
  listUpcomingSlots,
  listWeeklyHours,
  minutesToClock,
  utcCivilDate,
} from "@/lib/availability";
import { formatSlotRange } from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import {
  addClosedDayAction,
  createServiceAction,
  saveWeeklyHoursAction,
} from "./actions";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function slotStatusLabel(status: string, labels: Record<string, string>): string {
  return labels[status] ?? status;
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  const { error, saved } = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("availability"), getLocale()]);

  const [weekly, exceptions, services, upcoming] = await Promise.all([
    listWeeklyHours(prisma, provider.id),
    listExceptions(prisma, provider.id),
    listServices(prisma, provider.id),
    listUpcomingSlots(prisma, provider.id, { limit: 20 }),
  ]);

  const hoursByDay = new Map(weekly.map((row) => [row.weekday, row]));
  const errorMessage = error
    ? [
        "DURATION_NOT_GRID",
        "WINDOW_NOT_GRID",
        "WINDOW_INVALID",
        "WEEKDAY_DUPLICATE",
        "HOURS_CONFLICT",
        "TITLE_INVALID",
        "DATE_INVALID",
      ].includes(error)
      ? t(`errors.${error}`)
      : error
    : null;
  const savedMessage = saved ? t(`saved.${saved}`) : null;

  return (
    <>
      <AppHeader />
      <PageMain width="lg">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("intro", {
              grid: GRID_MINUTES,
              days: SLOT_HORIZON_DAYS,
              tz: provider.timezone,
            })}
          </p>
        </div>

        {errorMessage ? (
          <p className="banner banner-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {savedMessage ? <p className="banner banner-ok">{savedMessage}</p> : null}

        <section className="surface flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("servicesTitle")}</h2>
          <ul className="text-sm">
            {services.length === 0 ? (
              <li className="text-[var(--muted)]">{t("servicesEmpty")}</li>
            ) : null}
            {services.map((service) => (
              <li key={service.id}>
                {service.title} — {service.durationMinutes} {t("minutes")}
              </li>
            ))}
          </ul>
          <form action={createServiceAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t("serviceTitle")}
              <input name="title" required className="field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("duration")}
              <select name="durationMinutes" defaultValue="30" className="field">
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </label>
            <button type="submit" className="btn btn-secondary">
              {t("addService")}
            </button>
          </form>
        </section>

        <section className="surface flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-medium">{t("hoursTitle")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("hoursHint")}</p>
          </div>
          <form action={saveWeeklyHoursAction} className="flex flex-col gap-3">
            <div className="hidden grid-cols-[8rem_1fr_1fr] gap-3 text-xs text-[var(--muted)] sm:grid">
              <span />
              <span>{t("hoursFrom")}</span>
              <span>{t("hoursTo")}</span>
            </div>
            {WEEKDAY_ORDER.map((weekday) => {
              const row = hoursByDay.get(weekday);
              return (
                <div
                  key={weekday}
                  className="grid grid-cols-1 items-center gap-2 text-sm sm:grid-cols-[8rem_1fr_1fr] sm:gap-3"
                >
                  <span className="font-medium">{t(`weekday.${weekday}`)}</span>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--muted)] sm:sr-only">
                      {t("hoursFrom")}
                    </span>
                    <input
                      type="time"
                      step={GRID_MINUTES * 60}
                      name={`start-${weekday}`}
                      defaultValue={row ? minutesToClock(row.startMinute) : ""}
                      className="field"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--muted)] sm:sr-only">
                      {t("hoursTo")}
                    </span>
                    <input
                      type="time"
                      step={GRID_MINUTES * 60}
                      name={`end-${weekday}`}
                      defaultValue={row ? minutesToClock(row.endMinute) : ""}
                      className="field"
                    />
                  </label>
                </div>
              );
            })}
            <button type="submit" className="btn btn-primary self-start">
              {t("saveHours")}
            </button>
          </form>
        </section>

        <section className="surface flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("exceptionsTitle")}</h2>
          <ul className="text-sm">
            {exceptions.length === 0 ? (
              <li className="text-[var(--muted)]">{t("exceptionsEmpty")}</li>
            ) : null}
            {exceptions.map((row) => (
              <li key={row.id}>
                {civilDateKey(utcCivilDate(row.date))} —{" "}
                {row.isClosed ? t("closed") : t("customHours")}
              </li>
            ))}
          </ul>
          <form action={addClosedDayAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t("closedDate")}
              <input type="date" name="date" required className="field" />
            </label>
            <button type="submit" className="btn btn-secondary">
              {t("addClosed")}
            </button>
          </form>
        </section>

        <section className="surface flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("slotsTitle")}</h2>
          <p className="text-sm text-[var(--muted)]">
            {t("slotsNote", { tz: provider.timezone })}
          </p>
          <ul className="text-sm">
            {upcoming.slots.length === 0 ? (
              <li className="text-[var(--muted)]">{t("slotsEmpty")}</li>
            ) : null}
            {upcoming.slots.map((slot) => (
              <li key={slot.id}>
                {formatSlotRange(slot.startAt, slot.endAt, provider.timezone, locale)} (
                {slotStatusLabel(slot.status, {
                  OPEN: t("slotStatus.OPEN"),
                  BOOKED: t("slotStatus.BOOKED"),
                  BLOCKED: t("slotStatus.BLOCKED"),
                })}
                )
              </li>
            ))}
          </ul>
        </section>
      </PageMain>
    </>
  );
}
