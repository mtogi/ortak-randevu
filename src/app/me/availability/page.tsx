import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import { AppHeader } from "@/components/app-header";
import {
  addClosedDayAction,
  createServiceAction,
  saveWeeklyHoursAction,
} from "./actions";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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
  const t = await getTranslations("availability");

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
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 pb-16">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm opacity-80">
            {t("intro", {
              grid: GRID_MINUTES,
              days: SLOT_HORIZON_DAYS,
              tz: provider.timezone,
            })}
          </p>
        </div>

        {errorMessage ? (
          <p
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        {savedMessage ? (
          <p className="rounded-lg border border-current/20 px-3 py-2 text-sm">
            {savedMessage}
          </p>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("servicesTitle")}</h2>
          <ul className="text-sm">
            {services.length === 0 ? (
              <li className="opacity-70">{t("servicesEmpty")}</li>
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
              <input
                name="title"
                required
                className="rounded border border-current/20 bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("duration")}
              <select
                name="durationMinutes"
                defaultValue="30"
                className="rounded border border-current/20 bg-transparent px-3 py-2"
              >
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-current/20 px-3 py-2 text-sm"
            >
              {t("addService")}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("hoursTitle")}</h2>
          <form action={saveWeeklyHoursAction} className="flex flex-col gap-3">
            {WEEKDAY_ORDER.map((weekday) => {
              const row = hoursByDay.get(weekday);
              return (
                <div
                  key={weekday}
                  className="grid grid-cols-[8rem_1fr_1fr] items-center gap-3 text-sm"
                >
                  <span>{t(`weekday.${weekday}`)}</span>
                  <input
                    type="time"
                    step={GRID_MINUTES * 60}
                    name={`start-${weekday}`}
                    defaultValue={row ? minutesToClock(row.startMinute) : ""}
                    className="rounded border border-current/20 bg-transparent px-2 py-1"
                  />
                  <input
                    type="time"
                    step={GRID_MINUTES * 60}
                    name={`end-${weekday}`}
                    defaultValue={row ? minutesToClock(row.endMinute) : ""}
                    className="rounded border border-current/20 bg-transparent px-2 py-1"
                  />
                </div>
              );
            })}
            <button
              type="submit"
              className="self-start rounded border border-current/20 px-3 py-2 text-sm"
            >
              {t("saveHours")}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">{t("exceptionsTitle")}</h2>
          <ul className="text-sm">
            {exceptions.length === 0 ? (
              <li className="opacity-70">{t("exceptionsEmpty")}</li>
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
              <input
                type="date"
                name="date"
                required
                className="rounded border border-current/20 bg-transparent px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded border border-current/20 px-3 py-2 text-sm"
            >
              {t("addClosed")}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t("slotsTitle")}</h2>
          <p className="text-sm opacity-70">{t("slotsNote")}</p>
          <ul className="text-sm">
            {upcoming.slots.length === 0 ? (
              <li className="opacity-70">{t("slotsEmpty")}</li>
            ) : null}
            {upcoming.slots.map((slot) => (
              <li key={slot.id}>
                {slot.startAt.toISOString()} → {slot.endAt.toISOString()} ({slot.status})
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
