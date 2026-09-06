# Environment variables

Copy `.env.example` → `.env.local` and fill in. `.env*` files are gitignored except
`.env.example`; **never commit real values** (`.cursor/rules/security.mdc`).

## Used by the scaffold (M1)

| Name | Required | Example | Purpose |
|------|----------|---------|---------|
| `APP_URL` | no (defaults to `http://localhost:3000`) | `https://app.example.com` | Public origin; absolute links in emails once notifications exist |

The scaffold runs with **no** environment file at all. That is deliberate — see
ADR-002 §Scaffold scope.

## Wired in M1.5 (ADR-003 — data model)

| Name | Required | Example | Purpose |
|------|----------|---------|---------|
| `DATABASE_URL` | yes, for anything Prisma (`db:migrate:*`, app runtime) | `postgresql://user:password@host/db?sslmode=require` | Postgres connection string. Local dev: your own Postgres. Production: Neon project, EU (Frankfurt) region. |

Tests do **not** read `DATABASE_URL` — `src/lib/db/double-booking.test.ts` spins up
its own throwaway local Postgres via `embedded-postgres` (no Docker/Homebrew
needed) and applies `prisma/migrations` fresh each run. See
[ADR-003](./ADR/003-data-model.md).

## Wired in M2a (ADR-004 — auth)

| Name | Required | Example | Purpose |
|------|----------|---------|---------|
| `AUTH_SECRET` | yes for `next build` / production; local dev falls back to an insecure default | output of `npx auth secret` | Auth.js session/token signing — **and** the HMAC that signs guest booking-management links (ADR-005). Rotating it invalidates outstanding links. |
| `AUTH_EMAIL_FROM` | no | `Ortak Randevu <noreply@localhost>` | Legacy from-address; `EMAIL_FROM` wins when both are set |
| `AUTH_EMAIL_SERVER` | no (fallback only) | `smtp://user:pass@smtp.example.com:587` | Nodemailer SMTP, used when `RESEND_API_KEY` is absent. Unset in local dev: the magic link is printed to the server log. |

`GET /api/v1/health`, the home page, and the login form still run without
`DATABASE_URL`. Creating or consuming a magic link, and `GET /api/v1/me`
while signed in, need Postgres.

## Wired in M2c (ADR-005 — public booking + email)

| Name | Required | Example | Purpose |
|------|----------|---------|---------|
| `RESEND_API_KEY` | yes in production (or `AUTH_EMAIL_SERVER` instead) | `re_...` | Transactional email via Resend's REST API: booking confirmed / cancelled / rescheduled, plus magic links (Q-T14) |
| `EMAIL_FROM` | recommended wherever mail is sent | `Ortak Randevu <no-reply@example.com>` | Sender identity; must be a domain verified in Resend |
| `APP_URL` | yes wherever mail is sent | `https://app.example.com` | Origin used to build the absolute booking-management link inside emails |

With neither `RESEND_API_KEY` nor `AUTH_EMAIL_SERVER`, development logs
instead of sending and production refuses to pretend the mail was sent. A
send failure is logged and swallowed — it never rolls back a booking
(ADR-005).

The public booking page, `/bookings/[bookingId]`, and `/api/v1/public/*` all
need `DATABASE_URL`.

## Rules

- Anything prefixed `NEXT_PUBLIC_` is shipped to the browser. Never put a secret behind that prefix.
- Server-only values are read in server components, route handlers, or server actions — never imported into client components.
- Add a row here in the same change that introduces the variable, and add a commented entry to `.env.example`.
- Production secrets live in the Vercel project settings, scoped per environment. Rotate rather than reuse across preview/production.
