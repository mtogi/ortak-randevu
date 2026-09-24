# Cursor Brief — Ortak Randevu (Web → iOS later)

> **Read this at the start of every significant Cursor session.**  
> Keep ≤ 2 pages. Update when scope or stack changes.

## One-liner

Calendly-like, comfortable booking for **anyone who accepts bookings** (hosts) in **Turkey**. Web first; API-shaped for a future iOS app. **No health/clinical patient data.** TR default + EN.

## Current scope (MVP)

- Hosts: create availability + public booking page; share a link
- Guests: pick a slot, leave contact details needed for the appointment, receive confirmation
- **Calendar sync (MVP-must before invites):** Google + Microsoft — busy hides OPEN slots; write Ortak bookings out
- Languages: **Turkish default**; **English** switchable in the header
- Geography focus: Turkey (timezone default `Europe/Istanbul`)

## Hard non-goals (do not build / do not schema)

- Storing diagnoses, lab results, meal plans as clinical records, weight/BMI history, medications, allergies as health records
- Marketplace / directory / SEO “find a provider” unless `DECISIONS.md` says so
- Payments / deposits until owner gate (post web MVP + ~10–20 users + iOS App Store parity)
- Native iOS app until web is satisfactory for users (design API for it now)
- Apple / iCloud calendar sync until after the iOS app (EventKit preferred)

## Competitor north star

- **Calendly** for frictionless scheduling UX
- Differentiate: TR-friendly UX, KVKK-honest scheduling-only fence, simple share-link — without becoming an EHR

## Stack

> Accepted in [ADR-002](./architecture/ADR/002-tech-stack.md) on 2026-09-03.

- Frontend: Next.js (App Router) + React + TypeScript strict + Tailwind CSS
- Backend / API: same Next.js app; versioned route handlers under `/api/v1` ([ADR-001](./architecture/ADR/001-system-overview.md))
- DB: PostgreSQL via Prisma — schema + migrations ([ADR-003](./architecture/ADR/003-data-model.md)); identity queries in `src/lib/identity/` (M2a)
- Auth: Auth.js (NextAuth v5) email magic link + optional Google ([ADR-004](./architecture/ADR/004-auth-roles.md)); magic link stays primary (Q-T3, Q-T15)
- Booking: public `/book/[providerSlug]`, guest capability links ([ADR-005](./architecture/ADR/005-public-booking.md)); provider dashboard `/me/bookings` + settings `/me/settings`; domain code in `src/lib/booking/`
- i18n: next-intl, TR default + EN, locale in a cookie; first visit uses Vercel country (Q-T16)
- Hosting: Vercel `fra1` + Neon Postgres EU (Frankfurt)
- Email / SMS: Resend (REST) for booking mail + magic links, SMTP fallback (M2c); SMS/WhatsApp later

## Source of truth links

| Topic | Doc |
| --- | --- |
| Full doc list | [00-DOCUMENT-INVENTORY.md](./00-DOCUMENT-INVENTORY.md) |
| PRD | [product/PRD.md](./product/PRD.md) |
| Open questions | [product/OPEN-QUESTIONS.md](./product/OPEN-QUESTIONS.md) |
| Decisions | [DECISIONS.md](./DECISIONS.md) |
| No-PHI rules | [legal/DATA-CLASSIFICATION.md](./legal/DATA-CLASSIFICATION.md) |
| Session handoff | [process/SESSION-HANDOFF.md](./process/SESSION-HANDOFF.md) |

## Agent operating rules (summary)

1. Prefer vertical slices over sprawling refactors.
2. Never add health-data fields.
3. User-facing copy goes through i18n (EN + TR).
4. End meaningful sessions by updating SESSION-HANDOFF.
5. Promote closed questions into DECISIONS.md or an ADR.
6. Token hygiene is mandatory (see `.cursor/rules/token-efficiency.mdc`) — do not make the user restate it.
7. War plan / build gate: `docs/WAR-PLAN.md`. **M0–M4 done.** Site: `https://www.ortakrandevu.com`. **TR default locale** (2026-09-14) + geo first-visit (Q-T16). LICENSE is PolyForm Noncommercial 1.0.0 (source-available, not OSI). Hygiene queue done. Vercel Web Analytics **on**. Speed Insights out. **Next:** Phase 0 host copy (if needed) → calendar foundation + Google read-busy. Never Rotate `AUTH_SECRET`.
