import Link from "next/link";

export function Wordmark({ href = "/", label }: { href?: string; label: string }) {
  return (
    <Link href={href} className="wordmark">
      <Logomark />
      <span className="wordmark-label">{label}</span>
    </Link>
  );
}

function Logomark() {
  return (
    <svg className="logomark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="logomark-plate" x="1" y="1" width="30" height="30" rx="9" />
      <circle className="logomark-ring" cx="16" cy="16" r="7.25" />
      <circle className="logomark-dot" cx="16" cy="16" r="2.6" />
    </svg>
  );
}
