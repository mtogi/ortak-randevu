import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

export default async function LoginSentPage() {
  const t = await getTranslations("auth");

  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <div className="surface flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("sentTitle")}</h1>
          <p className="text-sm text-[var(--muted)]">{t("sentBody")}</p>
        </div>
      </PageMain>
    </>
  );
}
