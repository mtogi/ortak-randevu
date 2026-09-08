import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";
import { saveSettingsAction, deleteAccountAction } from "./actions";

export const dynamic = "force-dynamic";

const SETTINGS_ERRORS = ["NAME_INVALID", "LOCALE_INVALID", "DELETE_CONFIRM"] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  const { saved, error } = await searchParams;
  const [t, tLocale] = await Promise.all([
    getTranslations("settings"),
    getTranslations("locale"),
  ]);
  const errorMessage = error
    ? SETTINGS_ERRORS.includes(error as (typeof SETTINGS_ERRORS)[number])
      ? t(`errors.${error}`)
      : t("errors.UNKNOWN")
    : null;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-16">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm opacity-80">{t("intro")}</p>
        </div>

        {saved ? (
          <p className="rounded-lg border border-current/20 px-3 py-2 text-sm">
            {t("saved")}
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

        <form action={saveSettingsAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t("displayName")}
            <input
              name="name"
              defaultValue={provider.name ?? ""}
              maxLength={80}
              className="rounded border border-current/20 bg-transparent px-3 py-2"
            />
            <span className="opacity-70">{t("displayNameHint")}</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("locale")}
            <select
              name="locale"
              defaultValue={isLocale(provider.locale) ? provider.locale : defaultLocale}
              className="rounded border border-current/20 bg-transparent px-3 py-2"
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {tLocale(locale)}
                </option>
              ))}
            </select>
            <span className="opacity-70">{t("localeHint")}</span>
          </label>
          <button
            type="submit"
            className="self-start rounded border border-current/20 px-3 py-2 text-sm"
          >
            {t("save")}
          </button>
        </form>

        <section className="flex flex-col gap-4 border-t border-current/20 pt-6">
          <div>
            <h2 className="text-lg font-medium">{t("privacyTitle")}</h2>
            <p className="mt-2 text-sm opacity-80">{t("privacyIntro")}</p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("exportTitle")}</h3>
            <p className="text-sm opacity-70">{t("exportHint")}</p>
            <a
              href="/api/v1/me/export"
              className="self-start rounded border border-current/20 px-3 py-2 text-sm"
            >
              {t("exportButton")}
            </a>
          </div>

          <form action={deleteAccountAction} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{t("deleteTitle")}</h3>
            <p className="text-sm opacity-70">{t("deleteHint")}</p>
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
            <button
              type="submit"
              className="self-start rounded border border-red-500/40 px-3 py-2 text-sm"
            >
              {t("deleteSubmit")}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
