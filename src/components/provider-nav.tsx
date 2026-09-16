"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

const ITEMS = [
  { href: "/me", key: "account" },
  { href: "/me/bookings", key: "bookings" },
  { href: "/me/availability", key: "availability" },
  { href: "/me/settings", key: "settings" },
] as const;

export function ProviderNav({
  menuLabel,
  account,
  bookings,
  availability,
  settings,
}: {
  menuLabel: string;
  account: string;
  bookings: string;
  availability: string;
  settings: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const labels = { account, bookings, availability, settings };

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

  return (
    <>
      <nav className="site-nav-desktop" aria-label={menuLabel}>
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="nav-link">
            {labels[item.key]}
          </Link>
        ))}
      </nav>
      <div ref={rootRef} className="site-nav-mobile">
        <button
          type="button"
          className="site-menu-trigger"
          aria-label={menuLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <MenuIcon />
        </button>
        {open ? (
          <div id={menuId} role="menu" className="site-menu">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="site-menu-item"
                onClick={() => setOpen(false)}
              >
                {labels[item.key]}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
