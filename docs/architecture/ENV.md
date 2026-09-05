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

## Reserved for the M2 vertical slice

Commented out in `.env.example` until the code that reads them exists.

| Name | Purpose | Where it comes from |
|------|---------|---------------------|
| `AUTH_SECRET` | Auth.js session/token signing | `npx auth secret` |
| `RESEND_API_KEY` | Transactional email | Resend dashboard |
| `EMAIL_FROM` | Sender identity on confirmation emails | Verified domain in Resend |

## Rules

- Anything prefixed `NEXT_PUBLIC_` is shipped to the browser. Never put a secret behind that prefix.
- Server-only values are read in server components, route handlers, or server actions — never imported into client components.
- Add a row here in the same change that introduces the variable, and add a commented entry to `.env.example`.
- Production secrets live in the Vercel project settings, scoped per environment. Rotate rather than reuse across preview/production.
