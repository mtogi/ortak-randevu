"use client";

import { useState } from "react";
import { BrandIcon } from "@/components/brand-icon";

const TIMES = ["09:00", "09:30", "10:00", "11:00", "14:00", "14:30"];
const MONTH_BLANKS = 1;
const DAYS_IN_MONTH = 30;
const AVAILABLE_DAYS = new Set([14, 15, 16, 17]);

export function BookingPreview({
  provider,
  initials,
  service,
  duration,
  timezone,
  pageUrl,
  month,
  weekdays,
  timesLabel,
  nextLabel,
  previewLabel,
}: {
  provider: string;
  initials: string;
  service: string;
  duration: string;
  timezone: string;
  pageUrl: string;
  month: string;
  weekdays: string[];
  timesLabel: string;
  nextLabel: string;
  previewLabel: string;
}) {
  const [day, setDay] = useState(16);
  const [time, setTime] = useState("10:00");
  const weekdayAt = (date: number) => weekdays[(MONTH_BLANKS + date - 1) % 7] ?? "";
  const weekday = weekdayAt(day);

  return (
    <figure className="product-chrome" aria-label={previewLabel}>
      <ChromeBar url={pageUrl} />
      <div className="flex min-w-0 items-center gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
        <span className="landing-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{provider}</p>
          <p className="truncate text-sm text-[var(--muted)]">
            {service} · {duration} · {timezone}
          </p>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_5.75rem] gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_8.75rem] sm:gap-6 sm:p-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-tight">{month}</p>
          <div
            className="grid grid-cols-7 gap-y-1"
            role="listbox"
            aria-label={month}
            aria-activedescendant={`landing-day-${day}`}
          >
            {weekdays.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
              >
                {label}
              </span>
            ))}
            {Array.from({ length: MONTH_BLANKS }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: DAYS_IN_MONTH }, (_, index) => {
              const date = index + 1;
              const available = AVAILABLE_DAYS.has(date);
              const selected = date === day;
              if (!available) {
                return (
                  <span
                    key={date}
                    className="landing-day landing-day-muted"
                    aria-hidden="true"
                  >
                    {date}
                  </span>
                );
              }
              return (
                <button
                  key={date}
                  id={`landing-day-${date}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={`${weekdayAt(date)} ${date}`}
                  onClick={() => setDay(date)}
                  className={
                    selected ? "landing-day landing-day-selected" : "landing-day"
                  }
                >
                  {date}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-tight">
            {weekday} {day}
          </p>
          <div className="flex flex-col gap-2" role="group" aria-label={timesLabel}>
            {TIMES.map((value) => (
              <button
                key={value}
                type="button"
                className="landing-slot"
                aria-pressed={time === value}
                onClick={() => setTime(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <span
            className="btn btn-primary pointer-events-none mt-1 w-full"
            aria-hidden="true"
          >
            {nextLabel}
          </span>
        </div>
      </div>
    </figure>
  );
}

export function DetailsPreview({
  pageUrl,
  previewLabel,
  summary,
  nameLabel,
  emailLabel,
  phoneLabel,
  nameValue,
  emailValue,
  phoneValue,
  submitLabel,
}: {
  pageUrl: string;
  previewLabel: string;
  summary: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  nameValue: string;
  emailValue: string;
  phoneValue: string;
  submitLabel: string;
}) {
  return (
    <figure className="product-chrome" aria-label={previewLabel}>
      <ChromeBar url={pageUrl} />
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <p className="landing-summary">{summary}</p>
        <MockField label={nameLabel} value={nameValue} />
        <MockField label={emailLabel} value={emailValue} />
        <MockField label={phoneLabel} value={phoneValue} />
        <span
          className="btn btn-primary pointer-events-none mt-1 self-start"
          aria-hidden="true"
        >
          {submitLabel}
        </span>
      </div>
    </figure>
  );
}

export function HoursPreview({
  pageUrl,
  previewLabel,
  heading,
  closedLabel,
  rows,
}: {
  pageUrl: string;
  previewLabel: string;
  heading: string;
  closedLabel: string;
  rows: { day: string; hours: string; closed: boolean }[];
}) {
  const [closedDays, setClosedDays] = useState(
    () => new Set(rows.filter((row) => row.closed).map((row) => row.day)),
  );

  return (
    <figure className="product-chrome" aria-label={previewLabel}>
      <ChromeBar url={pageUrl} />
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="text-sm font-semibold tracking-tight">{heading}</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => {
          const closed = closedDays.has(row.day);
          return (
            <div
              key={row.day}
              className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-5 sm:py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight">{row.day}</p>
                <p className={`text-sm ${closed ? "text-[var(--muted)]" : ""}`}>
                  {closed ? closedLabel : row.hours}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!closed}
                aria-label={row.day}
                onClick={() => {
                  setClosedDays((current) => {
                    const next = new Set(current);
                    if (next.has(row.day)) next.delete(row.day);
                    else next.add(row.day);
                    return next;
                  });
                }}
                className={closed ? "landing-switch" : "landing-switch landing-switch-on"}
              />
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function ConfirmPreview({
  pageUrl,
  previewLabel,
  title,
  service,
  when,
  note,
}: {
  pageUrl: string;
  previewLabel: string;
  title: string;
  service: string;
  when: string;
  note: string;
}) {
  return (
    <figure className="product-chrome" aria-label={previewLabel}>
      <ChromeBar url={pageUrl} />
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <span className="landing-ok-mark" aria-hidden="true">
          <BrandIcon name="check" />
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-[var(--muted)]">{service}</p>
          <p className="text-lg font-semibold tracking-tight">{when}</p>
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{note}</p>
      </div>
    </figure>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span>{label}</span>
      <input readOnly tabIndex={-1} value={value} className="field" />
    </label>
  );
}

function ChromeBar({ url }: { url: string }) {
  return (
    <div className="product-chrome-bar">
      <span className="product-chrome-dot" />
      <span className="product-chrome-dot" />
      <span className="product-chrome-dot" />
      <span className="ml-2 truncate text-xs text-[var(--muted)]">{url}</span>
    </div>
  );
}
