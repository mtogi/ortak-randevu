# ADR-002: Tech stack

- Status: accepted
- Date: 2026-09-03
- Deciders: Toygar (product owner), Cursor agent
- Supersedes: —

## Context

`docs/WAR-PLAN.md` §3 flagged Q-T2 as the single item to consciously confirm
before scaffolding: "Next.js + TypeScript + Postgres + hosted magic-link auth".
That recommendation was accepted on 2026-09-03. This ADR pins the concrete
libraries so the scaffold is reproducible and future sessions do not relitigate
them.

Constraints carried in: EU data residency preference (Q-T4), email-first
notifications (Q-T6), EN default with TR from settings, database-enforced
booking integrity (Q-T5), and an API shaped for a future iOS client (ADR-001).

## Decision

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js (App Router) + React, TypeScript strict** | Server components for the provider dashboard, route handlers for `/api/v1`, one deploy |
| Styling | **Tailwind CSS** | No design system to maintain pre-beta; wireframe-speed UI |
| Database | **PostgreSQL** | Unique constraints + transactions for double-booking (Q-T5); range types available later |
| ORM / migrations | **Prisma** | Mainstream, good migration story, strong Cursor support |
| Auth | **Auth.js (NextAuth v5), email magic link** | Q-T3; no password storage; adapter shares the Postgres instance |
| i18n | **next-intl**, EN default + TR | Message catalogs, App Router native, locale from user settings |
| Email | **Resend** | Simple API, EU sending region available |
| Hosting | **Vercel (`fra1`)** + **Neon Postgres (EU / Frankfurt)** | EU residency preference (Q-T4) with zero ops |
| Tests | **Vitest** (unit/domain) | Booking-conflict tests land with the first slice |
| Quality | **ESLint + Prettier**, GitHub Actions CI | Lint + typecheck + test on push |
| Package manager | **npm** | Fewest moving parts; lockfile committed |

**Deliberately deferred** (not in the scaffold, arrives with the vertical slice
or later): payments, SMS/WhatsApp, calendar sync, analytics, error tracking,
Docker, monorepo tooling.

### Scaffold scope (M1)

The scaffold contains only: Next.js + TypeScript + Tailwind, next-intl with EN
and TR catalogs, a `/api/v1/health` route proving the versioned API boundary,
`.env.example`, CI, lint/format/test config, and README run instructions.

Prisma, Auth.js, and Resend were **named here but not in the M1 scaffold**,
so `npm run dev` stayed runnable without a database or API keys.

**Status 2026-09-05:** Prisma schema + first migration landed in M1.5
([ADR-003](./003-data-model.md)). Auth.js magic link is wired in M2a
([ADR-004](./004-auth-roles.md)). Resend remains unwired until M2c. Home and
login GET still run without a live database; consuming a magic link needs
`DATABASE_URL`.

## Consequences

**Good**

- `npm install && npm run dev` works with no external services — the scaffold is
  a real, verifiable starting point rather than a config puzzle.
- Every choice is boring and well-documented, which is what we want when most
  work happens through an agent across many short sessions.
- EU hosting defaults keep KVKK conversations simple.

**Costs / risks**

- Vercel + Neon is convenient but is vendor lock-in at the edges. Mitigation:
  domain logic lives in plain TypeScript modules (ADR-001), and Postgres is
  portable.
- Prisma adds a generation step to CI and a cold-start cost on serverless. If it
  becomes a problem, Drizzle is the fallback and this ADR gets superseded.
- Auth.js v5 is still evolving; we pin an exact version when we wire it in M2.

## Related

- ADR-001 (system overview), ADR-003 (data model), ADR-004 (auth & roles), ADR-005 (i18n)
- `docs/architecture/ENV.md`, `docs/WAR-PLAN.md` §3
