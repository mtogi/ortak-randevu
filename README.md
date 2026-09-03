# Dietitian Booking Platform

User-friendly booking for dietitians and nutrition experts (Turkey-first).
Web application now → iOS later. **No health/clinical patient data.**

## Status

**Scaffold (M1) complete.** The app builds, runs, and serves an English/Turkish
home page plus a versioned API health endpoint. **Booking is not implemented
yet** — that is the M2 vertical slice.

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

No `.env` file is needed to run the scaffold. Copy `.env.example` →
`.env.local` when you start M2; see [docs/architecture/ENV.md](docs/architecture/ENV.md).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run format` | Prettier write (app code only; `docs/` and `*.md` are excluded) |

CI runs format check, lint, typecheck, test, and build — see `.github/workflows/ci.yml`.

## Layout

```text
src/app/            routes; UI pages and /api/v1/* handlers (thin adapters)
src/lib/            domain modules — booking logic lives here, not in routes
src/i18n/           locale config, next-intl request config, locale server action
messages/           en.json, tr.json message catalogs
docs/               product, architecture, legal, process
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · next-intl (EN default, TR).
Postgres/Prisma, Auth.js magic link, and Resend are decided but wired in M2.
Rationale: [ADR-002](docs/architecture/ADR/002-tech-stack.md).

## Docs (start here)

| Doc | Purpose |
|-----|---------|
| [docs/CURSOR-BRIEF.md](docs/CURSOR-BRIEF.md) | Always-on project context for Cursor |
| [docs/WAR-PLAN.md](docs/WAR-PLAN.md) | Build phases and MVP defaults |
| [docs/architecture/ADR/](docs/architecture/ADR/) | ADR-001 system overview, ADR-002 tech stack |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Settled calls |
| [docs/product/PRD.md](docs/product/PRD.md) | MVP requirements (stub) |
| [docs/product/OPEN-QUESTIONS.md](docs/product/OPEN-QUESTIONS.md) | What is still undecided |
| [docs/legal/DATA-CLASSIFICATION.md](docs/legal/DATA-CLASSIFICATION.md) | What must never be stored |
| [docs/process/SESSION-HANDOFF.md](docs/process/SESSION-HANDOFF.md) | Where the last session left off |
| [AGENTS.md](AGENTS.md) | How Cursor agents should work in this repo |

## Next milestone

**M1.5 — data model and schema (ADR-003).** The schema lands before any booking
UI, because it is the least reversible thing in the product. Open inputs are
`Q-D1`…`Q-D9` in [OPEN-QUESTIONS](docs/product/OPEN-QUESTIONS.md).

M2 follows: provider auth → availability → public booking page → book →
confirmation email, with double-booking prevented by a database constraint plus
a transaction.

## License

_TBD_
