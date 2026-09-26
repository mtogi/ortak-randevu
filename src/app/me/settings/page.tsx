import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { auth } from "@/auth";
import {
  getConnectionByKind,
  isGoogleCalendarConnectEnabled,
} from "@/lib/calendar";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import { saveSettingsAction, deleteAccountAction } from "./actions";

export const dynamic = "force-dynamic";

const SETTINGS_ERRORS = ["NAME_INVALID", "LOCALE_INVALID", "DELETE_CONFIRM"] as const;

const CALENDAR_FLASH = [
  "google_connected",
  "google_disconnected",
  "google_synced",
  "google_denied",
  "google_invalid",
  "google_error",
  "google_missing",
  "google_not_configured",
  "auth_required",
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; calendar?: string }>;
}) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  const { saved, error, calendar } = await searchParams;
  const [t, tLocale] = await Promise.all([
    getTranslations("settings"),
    getTranslations("locale"),
  ]);
  const errorMessage = error
    ? SETTINGS_ERRORS.includes(error as (typeof SETTINGS_ERRORS)[number])
      ? t(`errors.${error}`)
      : t("errors.UNKNOWN")
    : null;

  const googleConnection = await getConnectionByKind(prisma, provider.id, "GOOGLE");
  const googleEnabled = isGoogleCalendarConnectEnabled();
  const calendarFlash =
    calendar && CALENDAR_FLASH.includes(calendar as (typeof CALENDAR_FLASH)[number])
      ? t(`calendar.flash.${calendar}`)
      : null;
  const calendarFlashOk =
    calendar === "google_connected" ||
    calendar === "google_disconnected" ||
    calendar === "google_synced";

  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("intro")}</p>
        </div>

        {saved ? <p className="banner banner-ok">{t("saved")}</p> : null}
        {errorMessage ? (
          <p className="banner banner-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {calendarFlash ? (
          <p
            className={calendarFlashOk ? "banner banner-ok" : "banner banner-error"}
            role={calendarFlashOk ? undefined : "alert"}
          >
            {calendarFlash}
          </p>
        ) : null}

        <form action={saveSettingsAction} className="surface flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t("displayName")}
            <input
              name="name"
              defaultValue={provider.name ?? ""}
              maxLength={80}
              className="field"
            />
            <span className="text-[var(--muted)]">{t("displayNameHint")}</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("locale")}
            <select
              name="locale"
              defaultValue={isLocale(provider.locale) ? provider.locale : defaultLocale}
              className="field"
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {locale === "tr" ? "🇹🇷 " : "🇺🇸 "}
                  {tLocale(locale)}
                </option>
              ))}
            </select>
            <span className="text-[var(--muted)]">{t("localeHint")}</span>
          </label>
          <button type="submit" className="btn btn-primary self-start">
            {t("save")}
          </button>
        </form>

        <section className="surface flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-medium">{t("calendar.title")}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("calendar.intro")}</p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{t("calendar.googleTitle")}</h3>
            <p className="text-sm text-[var(--muted)]">{t("calendar.googleHint")}</p>
            {googleConnection ? (
              <>
                <p className="text-sm">
                  {googleConnection.status === "ACTIVE"
                    ? t("calendar.statusActive")
                    : t("calendar.statusError")}
                  {googleConnection.lastSyncAt
                    ? ` · ${t("calendar.lastSyncHint")}`
                    : null}
                </p>
                {googleConnection.lastError ? (
                  <p className="text-sm text-[var(--muted)]" role="alert">
                    {t("calendar.syncFailedHint")}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <form action="/api/v1/me/calendars/google/sync" method="post">
                    <button type="submit" className="btn btn-secondary">
                      {t("calendar.syncNow")}
                    </button>
                  </form>
                  <form action="/api/v1/me/calendars/google/disconnect" method="post">
                    <button type="submit" className="btn btn-danger">
                      {t("calendar.disconnect")}
                    </button>
                  </form>
                </div>
              </>
            ) : googleEnabled ? (
              <a
                href="/api/v1/me/calendars/google/connect"
                className="btn btn-primary self-start"
              >
                {t("calendar.connectGoogle")}
              </a>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                {t("calendar.notConfigured")}
              </p>
            )}
          </div>
        </section>

        <section className="surface flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-medium">{t("privacyTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("privacyIntro")}</p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("exportTitle")}</h3>
            <p className="text-sm text-[var(--muted)]">{t("exportHint")}</p>
            <a href="/api/v1/me/export" className="btn btn-secondary self-start">
              {t("exportButton")}
            </a>
          </div>

          <form action={deleteAccountAction} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{t("deleteTitle")}</h3>
            <p className="text-sm text-[var(--muted)]">{t("deleteHint")}</p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="confirm"
                value="delete"
                className="mt-1"
                required
              />
              <span>{t("deleteConfirm")}</span>
            </label>
            <button type="submit" className="btn btn-danger self-start">
              {t("deleteSubmit")}
            </button>
          </form>
        </section>
      </PageMain>
    </>
  );
}
