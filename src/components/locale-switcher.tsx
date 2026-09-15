"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const router = useRouter();
  const rawLocale = useLocale();
  const current = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === current) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="locale-switcher-trigger"
        aria-label={t("label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
      >
        <LocaleFlag locale={current} />
        <span>{t(current)}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("label")}
          className="locale-switcher-menu"
        >
          {locales.map((locale) => {
            const selected = locale === current;
            return (
              <li key={locale} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? "locale-switcher-option locale-switcher-option-active"
                      : "locale-switcher-option"
                  }
                  onClick={() => choose(locale)}
                >
                  <LocaleFlag locale={locale} />
                  <span>{t(locale)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function LocaleFlag({ locale }: { locale: Locale }) {
  if (locale === "tr") {
    return (
      <svg
        viewBox="0 0 24 16"
        width="20"
        height="14"
        aria-hidden="true"
        className="locale-flag"
      >
        <rect width="24" height="16" rx="2" fill="#E30A17" />
        <circle cx="10" cy="8" r="4.1" fill="#fff" />
        <circle cx="11.4" cy="8" r="3.2" fill="#E30A17" />
        <polygon
          fill="#fff"
          points="15.05,5.7 15.55,7.25 17.2,7.25 15.85,8.2 16.35,9.75 15.05,8.8 13.75,9.75 14.25,8.2 12.9,7.25 14.55,7.25"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 16"
      width="20"
      height="14"
      aria-hidden="true"
      className="locale-flag"
    >
      <rect width="24" height="16" rx="2" fill="#fff" />
      <rect width="24" height="1.23" y="0" fill="#B22234" />
      <rect width="24" height="1.23" y="2.46" fill="#B22234" />
      <rect width="24" height="1.23" y="4.92" fill="#B22234" />
      <rect width="24" height="1.23" y="7.38" fill="#B22234" />
      <rect width="24" height="1.23" y="9.85" fill="#B22234" />
      <rect width="24" height="1.23" y="12.31" fill="#B22234" />
      <rect width="24" height="1.23" y="14.77" fill="#B22234" />
      <rect width="10" height="8.6" fill="#3C3B6E" />
    </svg>
  );
}
