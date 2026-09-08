import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

export default async function Home() {
  const session = await auth();
  const [tApp, tHome] = await Promise.all([
    getTranslations("app"),
    getTranslations("home"),
  ]);

  return (
    <>
      <AppHeader />
      <PageMain>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">{tApp("name")}</h1>
          <p className="text-lg text-[var(--muted)]">{tApp("tagline")}</p>
        </div>

        <div className="surface flex flex-col gap-4">
          <p className="font-medium">{tHome("scaffoldNotice")}</p>
          <p className="text-sm text-[var(--muted)]">{tHome("nextStep")}</p>
          {session?.providerId ? (
            <Link href="/me" className="btn btn-primary self-start">
              {tHome("accountLink")}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary self-start">
              {tHome("loginLink")}
            </Link>
          )}
        </div>
      </PageMain>
    </>
  );
}
