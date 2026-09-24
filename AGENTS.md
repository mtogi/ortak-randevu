# AGENTS.md — Guidance for Cursor (and humans)

This repository is developed primarily in **Cursor** across many sessions. Follow these rules unless a newer ADR or `docs/DECISIONS.md` entry overrides them.

## Mission

Build a user-friendly **web booking** product for **anyone who accepts bookings** (hosts) in **Turkey**, Turkish UI by default with English via the header, designed so a later **iOS** client can use the same API. **Do not store health/clinical patient data.**

## Before coding

1. Read `docs/CURSOR-BRIEF.md` (not the whole docs tree).
2. Check latest `docs/process/SESSION-HANDOFF.md` and only the OPEN-QUESTIONS / DECISIONS needed for this slice.
3. Prefer implementing a decided vertical slice over expanding scope.
4. Follow `.cursor/rules/token-efficiency.mdc` — new chats beat giant threads; no speculative work.

## Scope lock

- In scope: scheduling, availability, booking confirmation, host/guest accounts, i18n EN/TR, **Google + Microsoft calendar sync** (MVP-must before invites).
- Out of scope until product says otherwise: marketplace, payments (owner gate), EHR / clinical intake, native iOS UI (until web is satisfactory), Apple calendar (after iOS).
- See `docs/legal/DATA-CLASSIFICATION.md` before adding any user-input field.

## Documentation discipline

| When | Update |
| --- | --- |
| Scope/stack decision | `docs/DECISIONS.md` and/or `docs/architecture/ADR/` |
| End of session | `docs/process/SESSION-HANDOFF.md` |
| User-visible behavior change | `docs/product/` stories or PRD if MVP changes |
| New forbidden/allowed data | `docs/legal/DATA-CLASSIFICATION.md` |

## Code expectations (once scaffold exists)

- Small, reviewable changes; one vertical concern per PR when possible.
- All user-facing strings via i18n keys (EN + TR).
- API-first boundaries suitable for future mobile.
- Tests for booking conflict / double-book prevention — **exists** at
  `src/lib/db/double-booking.test.ts` (M1.5). Keep it green; do not drop the
  partial unique index in new migrations.
- No secrets in git; use env vars per `docs/architecture/ENV.md`.

## Do not

- Invent legal ToS/privacy final copy — use outlines in `docs/legal/`.
- Add “reason for visit”, lab uploads, or measurement fields without explicit written approval in DECISIONS.
- Add marketplace / directory discovery in the same PR as core booking or calendar.

## Cursor rules

Project rules live in `.cursor/rules/`. Keep them short and actionable; link to docs for detail.

## Cursor Cloud specific instructions

Cloud agents clone this repo on Ubuntu. `.cursor/environment.json` runs `npm install` during a Build (`postinstall` runs `prisma generate`). Port 3000 is the app.

- Verify with `npm test`, `npm run lint`, and `npm run typecheck`. Tests spin up embedded Postgres and do not read `DATABASE_URL`.
- `npm run dev` serves the home page and login form with no env file. Booking, magic links, and `/api/v1/me` need `DATABASE_URL`.
- Secrets stay in the Cursor Cloud Agents Secrets tab, never in git. Names and which ones are required: `docs/architecture/ENV.md`. Use a non-production database. Do not copy or rotate the production `AUTH_SECRET` (it signs guest booking links).
- With neither `RESEND_API_KEY` nor `AUTH_EMAIL_SERVER`, development logs mail instead of sending it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
