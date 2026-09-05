import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function Home() {
  const [tApp, tHome] = await Promise.all([
    getTranslations("app"),
    getTranslations("home"),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{tApp("name")}</h1>
        <LocaleSwitcher />
      </header>

      <p className="text-lg">{tApp("tagline")}</p>

      <div className="rounded-lg border border-current/15 p-4 text-sm">
        <p className="font-medium">{tHome("scaffoldNotice")}</p>
        <p className="mt-1 opacity-70">{tHome("nextStep")}</p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <a href="/login" className="underline underline-offset-4">
          {tHome("loginLink")}
        </a>
        <a href="/api/v1/health" className="underline underline-offset-4">
          {tHome("healthLink")}
        </a>
      </div>
    </main>
  );
}
