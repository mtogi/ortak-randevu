import Link from "next/link";

export function Wordmark({
  href = "/",
  label,
}: {
  href?: string;
  label: string;
}) {
  return (
    <Link href={href} className="wordmark">
      <Logomark />
      <span className="wordmark-label">{label}</span>
    </Link>
  );
}

function Logomark() {
  return (
    <svg
      className="logomark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="logomark-slot-a" x="2.5" y="6.5" width="17" height="17" rx="4.5" />
      <rect className="logomark-slot-b" x="12.5" y="8.5" width="17" height="17" rx="4.5" />
    </svg>
  );
}
