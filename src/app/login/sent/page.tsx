import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";

export default async function LoginSentPage() {
  const t = await getTranslations("auth");

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-6 pb-16">
        <h1 className="text-2xl font-semibold">{t("sentTitle")}</h1>
        <p className="text-sm opacity-80">{t("sentBody")}</p>
      </main>
    </>
  );
}
