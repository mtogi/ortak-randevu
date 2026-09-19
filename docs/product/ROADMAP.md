# Roadmap

Aligned with [WAR-PLAN](../WAR-PLAN.md) phases. Product capabilities, not git
commits.

## Now (private beta)

Brand follows Calendly (2026-09-14, `docs/design/BRAND.md`). Home is the
conversion landing. TR is the default locale (2026-09-14).

**Hygiene before Later features** (2026-09-15). Do not start calendar/payments
until this queue is through, unless the owner overrides.

1. **Mobile layout** + dynamic © footer — done 2026-09-15
2. **GitHub license** — PolyForm Noncommercial 1.0.0 — done 2026-09-16
   (education/hobby OK, not-for-profit commercial use). Source-available,
   not OSI “open source”
3. **Geo default locale (Q-T16)** — cookie wins; else TR if
   `x-vercel-ip-country=TR`, else EN — done 2026-09-16
4. **Brand session** — **in progress** (2026-09-18): decisions locked;
   compact + tab/Apple icons shipped; 16px www tab confirmed; full header
   mark shipped (`mark-full.svg` + `wordmark.tsx`). Still open: Geist
   lockup file, 3B-harmonize CSS, Q7 clouds, ~16 icon pack. Do not mix
   layout or SEO.
5. **Technical SEO** — after (1) and (4); not a feature sprint yet

Human ops (not a chat): Neon `migrate deploy` for `Provider.locale` default
`tr`; re-signup test provider; smoke Google G + guest erase on www.

Google OAuth (Q-T15) smoked on www 2026-09-13. Magic link stays primary.

## Later (post-beta)

- Calendar sync (Google/Outlook) — not the same as Google sign-in
- Payments / deposits
- Provider verification
- Native **iOS** app on the same `/api/v1` (freeze `v1` first — Q-T8)
- Expand to other professions
- Optional light marketplace discovery

## Explicit parking lot

- Clinical intake, meal plans as records, wearable/lab integrations — **not planned**
