import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";

export default async function Home() {
  const [tApp, tHome] = await Promise.all([
    getTranslations("app"),
    getTranslations("home"),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 pb-16">
        <p className="text-lg">{tApp("tagline")}</p>

        <div className="rounded-lg border border-current/15 p-4 text-sm">
          <p className="font-medium">{tHome("scaffoldNotice")}</p>
          <p className="mt-1 opacity-70">{tHome("nextStep")}</p>
        </div>

        <a href="/api/v1/health" className="text-sm underline underline-offset-4">
          {tHome("healthLink")}
        </a>
      </main>
    </>
  );
}
