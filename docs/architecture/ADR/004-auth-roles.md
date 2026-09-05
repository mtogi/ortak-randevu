# ADR-004: Auth and roles

- Status: accepted
- Date: 2026-09-05
- Deciders: Toygar (product owner), Cursor agent
- Supersedes: —

## Context

Q-T3 already chose email magic links via Auth.js. ADR-002 named Auth.js
(NextAuth v5) and a Prisma adapter sharing the Postgres instance, but left
them unwired so M1 could run without secrets. ADR-003 shipped `Provider` as
the product identity (unique email, unique slug) without an auth table.

M2a has to answer: who can sign in, how a session maps to `Provider`, where
the public booking URL will live (Q-T10), and how `/api/v1` exposes identity
without putting domain logic in route handlers (ADR-001). Availability, the
public booking page, and Resend are explicitly out of this slice (M2b/M2c).

## Decision

### Provider-only accounts in M2a

A verified magic-link login is a **dietitian** (`Provider`). Guests stay
unauthenticated (Q-P7). There is no client role, no Organization-scoped
auth (Q-D1 hedge unused), and no passwords.

### Auth.js v5 email magic link + Prisma adapter

Pinned to `next-auth@5.0.0-beta.32` (v5 is still published as beta; ADR-002
required an exact pin). Email provider is Nodemailer. Verification tokens
and Auth.js `User` / `Account` / `Session` / `VerificationToken` rows live
in Postgres via `@auth/prisma-adapter`.

Those tables are **credential storage**. They are additive and do not change
`Slot`, `Booking`, or the hand-maintained `booking_slot_active_unique`
index.

Sessions use the **JWT** strategy so reading a session does not require a
database round-trip. The adapter is still required so magic-link tokens can
be stored.

### First verified login creates or links `Provider`

`src/lib/identity/` is the domain module. On sign-in, `ensureProviderForEmail`
normalizes the email (trim + lowercase), finds an existing `Provider` by
email, or creates one with a unique slug. Soft-deleted providers
(`deletedAt` set) are not revived (Q-D6). Link is by email, not a new FK on
`Provider` — no redesign of the ADR-003 product schema.

Magic-link **delivery** is SMTP via `AUTH_EMAIL_SERVER` when set. Resend is
not used (M2c). Without SMTP, development logs the URL (not the address);
production refuses to pretend the mail was sent.

### Thin `/api/v1` adapter

`GET /api/v1/me` calls `auth()` then `getActiveProviderById` and returns
the public provider DTO (id, email, name, slug, timezone, locale,
`publicBookingPath`). 401 when there is no session. No other identity
endpoints in this slice. Auth.js keeps `/api/auth/*` for the protocol.

### Q-T10 — public booking URL

Closed: **`/book/[providerSlug]`**. Reserved app routes (`api`, `login`,
`me`, `settings`, `auth`) never sit at `/{slug}`. The page is not built
here; `/me` only displays the path.

### Q-T9 — locale

Left as **cookie locale** (already in the M1 scaffold). No `/en`/`/tr`
prefix in this slice. Revisit only if SEO/marketing needs localized URLs.

## Consequences

**Good**

- Product identity stays `Provider`; Auth.js stays a credential layer.
- iOS can later call `GET /api/v1/me` with the same session/token boundary.
- Public URLs are decided before any public page exists, so M2c cannot pick
  a colliding path.

**Costs / risks**

- Auth.js v5 is still beta; the pin must be bumped consciously.
- `next build` needs `AUTH_SECRET`. Login that consumes a link needs
  `DATABASE_URL`. Home/login GET still compile without a live database.
- Production magic links need `AUTH_EMAIL_SERVER` until M2c (Resend) can
  become the sender.
- JWT claims can go stale if a slug is renamed later; `/api/v1/me` and
  `/me` re-read Postgres by `providerId`.

## Related

- ADR-001 (system overview), ADR-002 (tech stack), ADR-003 (data model)
- `docs/product/OPEN-QUESTIONS.md` Q-T3, Q-T9, Q-T10, Q-P7, Q-D6
- `src/lib/identity/`, `src/auth.ts`, `src/app/api/v1/me/route.ts`
