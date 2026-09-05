# Dietitian Booking Platform

User-friendly booking for dietitians and nutrition experts (Turkey-first).
Web application now → iOS later. **No health/clinical patient data.**

## Status

**Scaffold (M1) + data model (M1.5, ADR-003) complete.** The app builds, runs,
and serves an English/Turkish home page plus a versioned API health endpoint.
The Prisma schema and first migration exist, and a test proves double booking
is impossible at the database layer. There is still **no UI, no auth, and no
booking flow** — that is M2.

Source: <https://github.com/mtogi/ortak-randevu>

## Requirements

- **Node.js ≥ 20.9** (developed on 22.23.2) and npm

If `node -v` fails, install Node — for example the official macOS arm64 tarball:

```bash
curl -fLO https://nodejs.org/dist/v22.23.2/node-v22.23.2-darwin-arm64.tar.xz
tar -xJf node-v22.23.2-darwin-arm64.tar.xz -C /tmp
mv /tmp/node-v22.23.2-darwin-arm64 ~/.local/node
```

Then add it to your shell profile so it is on `PATH` in new terminals:

```bash
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc
```

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You should see the scaffold home page with a
language switcher.

Verify the API boundary:

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","apiVersion":"v1","time":"..."}
```

No `.env` file is needed to run the scaffold — `npm run dev` still needs no
database. `DATABASE_URL` is only needed to run migrations against your own
Postgres (`npm run db:migrate:dev`); the double-booking test manages its own
throwaway Postgres and ignores `DATABASE_URL`. See
[docs/architecture/ENV.md](docs/architecture/ENV.md).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — includes an integration test that spins up a throwaway Postgres to prove double booking is impossible |
| `npm run format` | Prettier write (app code only; `docs/` and `*.md` are excluded) |
| `npm run db:generate` | Regenerate the Prisma client from `prisma/schema.prisma` |
| `npm run db:migrate:dev` | Create/apply a migration against `DATABASE_URL` (local dev) |
| `npm run db:migrate:deploy` | Apply existing migrations, no new migration created (CI/prod) |

CI runs format check, lint, typecheck, test, and build — see `.github/workflows/ci.yml`.
`npm test` needs no `DATABASE_URL` and no Docker: the double-booking test uses
`embedded-postgres` to run a real, disposable Postgres server per test run.

## Layout

```text
src/app/            routes; UI pages and /api/v1/* handlers (thin adapters)
src/lib/            domain modules — booking logic lives here, not in routes
src/lib/db/         Prisma client singleton + test-only local-Postgres helper
src/i18n/           locale config, next-intl request config, locale server action
messages/           en.json, tr.json message catalogs
prisma/             schema.prisma + migrations (ADR-003)
docs/               product, architecture, legal, process
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · next-intl (EN default, TR) ·
PostgreSQL/Prisma (schema + migrations, M1.5). Auth.js magic link and Resend
are decided but still wired in M2. Rationale:
[ADR-002](docs/architecture/ADR/002-tech-stack.md),
[ADR-003](docs/architecture/ADR/003-data-model.md).

## Docs (start here)

| Doc | Purpose |
|-----|---------|
| [docs/CURSOR-BRIEF.md](docs/CURSOR-BRIEF.md) | Always-on project context for Cursor |
| [docs/WAR-PLAN.md](docs/WAR-PLAN.md) | Build phases and MVP defaults |
| [docs/architecture/ADR/](docs/architecture/ADR/) | ADR-001 system overview, ADR-002 tech stack, ADR-003 data model |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Settled calls |
| [docs/product/PRD.md](docs/product/PRD.md) | MVP requirements (stub) |
| [docs/product/OPEN-QUESTIONS.md](docs/product/OPEN-QUESTIONS.md) | What is still undecided |
| [docs/legal/DATA-CLASSIFICATION.md](docs/legal/DATA-CLASSIFICATION.md) | What must never be stored |
| [docs/process/SESSION-HANDOFF.md](docs/process/SESSION-HANDOFF.md) | Where the last session left off |
| [AGENTS.md](AGENTS.md) | How Cursor agents should work in this repo |

## Next milestone

**M2 — the vertical slice.** Provider auth → availability → public booking
page → book → confirmation email. Double-booking is already prevented by a
database constraint (proven in `src/lib/db/double-booking.test.ts`); M2 wires
that into real application code, still with **no UI until the flow is real**.

## License

_TBD_
