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
        <div className="hero">
          <h1>{tApp("tagline")}</h1>
          <p className="hero-lede">{tHome("scaffoldNotice")}</p>
          <div className="hero-actions">
            {session?.providerId ? (
              <Link href="/me" className="btn btn-primary">
                {tHome("accountLink")}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                {tHome("loginLink")}
              </Link>
            )}
            <p className="text-sm text-[var(--muted)]">{tHome("nextStep")}</p>
          </div>
        </div>
      </PageMain>
    </>
  );
}
