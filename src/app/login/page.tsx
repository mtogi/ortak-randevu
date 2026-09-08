import { getTranslations } from "next-intl/server";
import { requestMagicLink } from "./actions";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const t = await getTranslations("auth");
  const { error, deleted } = await searchParams;
  const errorMessage =
    error === "invalid-email" ? t("invalidEmail") : error ? t("sendFailed") : null;

  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("description")}</p>
        </div>
        {deleted ? <p className="banner banner-ok">{t("accountDeleted")}</p> : null}
        {errorMessage ? (
          <p className="banner banner-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form action={requestMagicLink} className="surface flex flex-col gap-3">
          <label htmlFor="email" className="text-sm">
            {t("emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
          />
          <button type="submit" className="btn btn-primary btn-block">
            {t("submit")}
          </button>
        </form>
      </PageMain>
    </>
  );
}
