import type { SVGProps } from "react";

const ICONS = {
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8v4.2l2.6 1.6" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6.93" />
      <path d="M14 10a5 5 0 0 0-7.07 0L5.52 11.41a5 5 0 0 0 7.07 7.07L14 17.07" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M8.2 12.2 10.7 14.7 15.8 9.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.25" />
      <path d="M8 3.75v3M16 3.75v3M3.75 9.75h16.5" />
      <circle cx="8.25" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15.75" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8.25" cy="16.75" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.75" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.75 7.5 6.4 4.6a1.5 1.5 0 0 0 1.7 0l6.4-4.6" />
    </>
  ),
  phone: (
    <>
      <rect x="7.25" y="3.5" width="9.5" height="17" rx="2.25" />
      <path d="M10.5 17.75h3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.25" r="3.25" />
      <path d="M5.5 18.5c.85-3.1 3.3-5 6.5-5s5.65 1.9 6.5 5" />
    </>
  ),
  settings: (
    <>
      <path d="M4.75 8h14.5M4.75 16h14.5" />
      <circle cx="9" cy="8" r="1.85" />
      <circle cx="15" cy="16" r="1.85" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13M5.5 12h13" />
    </>
  ),
  close: (
    <>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </>
  ),
  chevron: (
    <>
      <path d="m9 6 6 6-6 6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5M12 3.75c2.4 2.3 3.7 5.1 3.7 8.25S14.4 18 12 20.25C9.6 18 8.3 15.2 8.3 12S9.6 6 12 3.75Z" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11.25" height="11.25" rx="2" />
      <path d="M15.25 8V6.75A1.75 1.75 0 0 0 13.5 5H6.75A1.75 1.75 0 0 0 5 6.75V13.5c0 .97.78 1.75 1.75 1.75H8" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7.5h14M9.25 7.5V5.75A1.25 1.25 0 0 1 10.5 4.5h3a1.25 1.25 0 0 1 1.25 1.25V7.5M8 7.5l.7 11.25A1.5 1.5 0 0 0 10.2 20h3.6a1.5 1.5 0 0 0 1.5-1.25L16 7.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.75v10.5M8.25 11.5 12 15.25 15.75 11.5M5.5 18.5h13" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10.25a5.5 5.5 0 1 1 11 0c0 4.25 1.25 5.5 1.25 5.5H5.25S6.5 14.5 6.5 10.25Z" />
      <path d="M10 17.75a2 2 0 0 0 4 0" />
    </>
  ),
} as const;

export type BrandIconName = keyof typeof ICONS;

export function BrandIcon({
  name,
  size = 20,
  ...props
}: { name: BrandIconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
}
