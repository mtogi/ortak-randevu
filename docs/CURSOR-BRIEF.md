# Cursor Brief — Dietitian Booking (Web → iOS later)

> **Read this at the start of every significant Cursor session.**  
> Keep ≤ 2 pages. Update when scope or stack changes.

## One-liner

Calendly-like, comfortable booking for **dietitians / nutrition experts in Turkey**. Web first; API-shaped for a future iOS app. **No health/clinical patient data.**

## Current scope (MVP)

- Providers: dietitians create availability + public booking page
- Clients: pick a slot, leave contact details needed for the appointment, receive confirmation
- Languages: **English default**; **Turkish** switchable in user settings
- Geography focus: Turkey (timezone default `Europe/Istanbul`)

## Hard non-goals (do not build / do not schema)

- Storing diagnoses, lab results, meal plans as clinical records, weight/BMI history, medications, allergies as health records
- Expanding to other professions (post-MVP)
- Native iOS app (post web MVP; design API for it now)
- Full marketplace discovery unless product decides otherwise

## Competitor north star

- **Calendly** for frictionless scheduling UX
- Differentiate later: professional practice context, TR-friendly notifications/payments, dietitian workflows — without becoming an EHR

## Stack

> Accepted in [ADR-002](./architecture/ADR/002-tech-stack.md) on 2026-09-03.

- Frontend: Next.js (App Router) + React + TypeScript strict + Tailwind CSS
- Backend / API: same Next.js app; versioned route handlers under `/api/v1` ([ADR-001](./architecture/ADR/001-system-overview.md))
- DB: PostgreSQL via Prisma — schema + first migration landed in M1.5 ([ADR-003](./architecture/ADR/003-data-model.md)); app code wiring (queries in domain modules) is still M2
- Auth: Auth.js (NextAuth v5) email magic link _(wired in M2)_
- i18n: next-intl, EN default + TR, locale in a cookie
- Hosting: Vercel `fra1` + Neon Postgres EU (Frankfurt)
- Email / SMS: Resend for email; SMS/WhatsApp later

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
7. War plan / build gate: `docs/WAR-PLAN.md`.
