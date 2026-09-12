import { getTranslations } from "next-intl/server";
import { requestGoogleSignIn, requestMagicLink } from "./actions";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { authPageErrorKey, isGoogleSignInEnabled } from "@/lib/identity";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const t = await getTranslations("auth");
  const { error, deleted } = await searchParams;
  const errorKey = authPageErrorKey(error);
  const googleEnabled = isGoogleSignInEnabled();

  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("description")}</p>
        </div>
        {deleted ? <p className="banner banner-ok">{t("accountDeleted")}</p> : null}
        {errorKey ? (
          <p className="banner banner-error" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        <div className="surface flex flex-col gap-3">
          <form action={requestMagicLink} className="flex flex-col gap-3">
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
          {googleEnabled ? (
            <>
              <p className="text-center text-sm text-[var(--muted)]">{t("or")}</p>
              <form action={requestGoogleSignIn}>
                <button type="submit" className="btn btn-secondary btn-block">
                  {t("google")}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </PageMain>
    </>
  );
}
