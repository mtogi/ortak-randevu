import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmailCapture } from "@/components/home/email-capture";
import {
  BookingPreview,
  ConfirmPreview,
  DetailsPreview,
  HoursPreview,
} from "@/components/home/previews";

export async function HomeLanding({ signedIn }: { signedIn: boolean }) {
  const [t, tAuth, tBook] = await Promise.all([
    getTranslations("home"),
    getTranslations("auth"),
    getTranslations("book"),
  ]);

  const cta = signedIn ? (
    <Link href="/me" className="btn btn-primary">
      {t("accountLink")}
    </Link>
  ) : (
    <EmailCapture
      emailLabel={tAuth("emailLabel")}
      emailPlaceholder={t("emailPlaceholder")}
      submitLabel={t("loginLink")}
      inputId="home-email"
    />
  );

  const closeCta = signedIn ? (
    <Link href="/me" className="btn btn-primary">
      {t("accountLink")}
    </Link>
  ) : (
    <EmailCapture
      emailLabel={tAuth("emailLabel")}
      emailPlaceholder={t("emailPlaceholder")}
      submitLabel={t("loginLink")}
      inputId="home-email-close"
      className="mx-auto"
    />
  );

  const weekdays = t.raw("mock.weekdays") as string[];
  const summary = `${t("mock.service")} · ${t("mock.when")}`;

  return (
    <>
      <main>
        <section className="py-24 lg:py-32" aria-labelledby="home-hero-heading">
          <div className="landing-shell grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.05fr)] lg:gap-20">
            <div className="flex flex-col items-start">
              <p className="landing-kicker">{t("kicker")}</p>
              <h1 id="home-hero-heading" className="landing-hero-title mt-5">
                {t("headline")}
              </h1>
              <p className="landing-lede mt-6">{t("lede")}</p>
              <div className="mt-10 flex w-full flex-col items-start gap-3">
                {cta}
                {signedIn ? null : (
                  <p className="text-sm text-[var(--muted)]">{t("ctaHint")}</p>
                )}
              </div>
            </div>
            <div className="landing-hero-visual">
              <BookingPreview
                provider={t("mock.provider")}
                initials={t("mock.initials")}
                service={t("mock.service")}
                duration={t("mock.duration")}
                timezone={t("mock.timezone")}
                pageUrl={t("mock.bookingUrl")}
                month={t("mock.month")}
                weekdays={weekdays}
                timesLabel={t("mock.timesLabel")}
                nextLabel={t("mock.next")}
                previewLabel={t("mock.bookingPreview")}
              />
            </div>
          </div>
        </section>

        <section aria-label={t("trust.label")} className="landing-band py-12">
          <ul className="landing-trust">
            <li>{t("trust.audience")}</li>
            <li>{t("trust.languages")}</li>
            <li>{t("trust.privacy")}</li>
            <li>{t("trust.timezone")}</li>
          </ul>
        </section>

        <section aria-labelledby="home-how-heading" className="py-24 lg:py-32">
          <div className="landing-shell space-y-16 lg:space-y-20">
            <div className="max-w-xl space-y-5">
              <p className="landing-kicker">{t("how.kicker")}</p>
              <h2 id="home-how-heading" className="landing-section-title">
                {t("how.title")}
              </h2>
              <p className="landing-lede">{t("how.lede")}</p>
            </div>
            <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
              <Step
                n="1"
                title={t("how.step1Title")}
                body={t("how.step1Body")}
                icon={<ClockIcon />}
              />
              <Step
                n="2"
                title={t("how.step2Title")}
                body={t("how.step2Body")}
                icon={<LinkIcon />}
              />
              <Step
                n="3"
                title={t("how.step3Title")}
                body={t("how.step3Body")}
                icon={<CheckIcon />}
              />
            </ol>
          </div>
        </section>

        <section aria-label={t("features.label")} className="landing-band py-24 lg:py-32">
          <div className="landing-shell space-y-28 lg:space-y-36">
            <FeatureBlock
              kicker={t("features.bookingKicker")}
              title={t("features.bookingTitle")}
              body={t("features.bookingBody")}
            >
              <DetailsPreview
                pageUrl={t("mock.bookingUrl")}
                previewLabel={t("mock.detailsPreview")}
                summary={summary}
                nameLabel={tBook("name")}
                emailLabel={tBook("email")}
                phoneLabel={tBook("phone")}
                nameValue={t("mock.clientName")}
                emailValue={t("mock.clientEmail")}
                phoneValue={t("mock.clientPhone")}
                submitLabel={tBook("submit")}
              />
            </FeatureBlock>
            <FeatureBlock
              kicker={t("features.hoursKicker")}
              title={t("features.hoursTitle")}
              body={t("features.hoursBody")}
              reverse
            >
              <HoursPreview
                pageUrl={t("mock.hoursUrl")}
                previewLabel={t("mock.hoursPreview")}
                heading={t("mock.hoursHeading")}
                closedLabel={t("mock.closed")}
                rows={[
                  { day: t("mock.mon"), hours: t("mock.fullDay"), closed: false },
                  { day: t("mock.tue"), hours: t("mock.fullDay"), closed: false },
                  { day: t("mock.wed"), hours: t("mock.fullDay"), closed: true },
                  { day: t("mock.thu"), hours: t("mock.fullDay"), closed: false },
                  { day: t("mock.fri"), hours: t("mock.halfDay"), closed: false },
                ]}
              />
            </FeatureBlock>
            <FeatureBlock
              kicker={t("features.confirmKicker")}
              title={t("features.confirmTitle")}
              body={t("features.confirmBody")}
            >
              <ConfirmPreview
                pageUrl={t("mock.confirmUrl")}
                previewLabel={t("mock.confirmPreview")}
                title={t("mock.confirmed")}
                service={t("mock.service")}
                when={t("mock.when")}
                note={t("mock.confirmNote")}
              />
            </FeatureBlock>
          </div>
        </section>

        <section
          aria-labelledby="home-close-heading"
          className="landing-closer py-28 lg:py-36"
        >
          <div className="landing-shell flex flex-col items-center gap-8 text-center">
            <h2 id="home-close-heading" className="landing-close-title">
              {t("close.title")}
            </h2>
            <p className="landing-lede mx-auto">{t("close.lede")}</p>
            <div className="flex w-full flex-col items-center gap-3">
              {closeCta}
              {signedIn ? null : (
                <p className="landing-cta-hint text-sm">{t("ctaHint")}</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--border)] py-10">
        <p className="landing-shell text-sm text-[var(--muted)]">{t("footer")}</p>
      </footer>
    </>
  );
}

function FeatureBlock({
  kicker,
  title,
  body,
  reverse = false,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  reverse?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
      <div className={`space-y-5 md:sticky md:top-28 ${reverse ? "lg:order-2" : ""}`}>
        <p className="landing-kicker">{kicker}</p>
        <h2 className="landing-section-title max-w-[20ch]">{title}</h2>
        <p className="landing-lede">{body}</p>
      </div>
      <div className={reverse ? "lg:order-1" : undefined}>{children}</div>
    </article>
  );
}

function Step({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <li className="landing-card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="landing-step-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="text-sm font-semibold tabular-nums text-[var(--muted)]">
          {n.padStart(2, "0")}
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="leading-relaxed text-[var(--muted)]">{body}</p>
      </div>
    </li>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v4.2l2.6 1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 14a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6.93"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 10a5 5 0 0 0-7.07 0L5.52 11.41a5 5 0 0 0 7.07 7.07L14 17.07"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.2 12.2 10.7 14.7 15.8 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
