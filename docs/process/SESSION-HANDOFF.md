# Session Handoff

> Update at the end of every meaningful Cursor/dev session.  
> Newest entry on top. Keep each entry short.

---

## Template

```md
### YYYY-MM-DD — <session title>

**Goal:**  
**Done:**
-

**Not done / deferred:**
-

**Decisions made:** (link DECISIONS.md / ADR)  
**Blockers:**  
**Next session should:**  
1.  
**Files touched:**
-
```

---

## Entries

### 2026-09-05 — M1.5: data model (ADR-003) + Prisma schema/migration + double-booking test

**Goal:** Close Q-D1…Q-D9, write ADR-003 as accepted, add the Prisma schema and
first migration, and prove double booking is impossible with a failing-insert
test. No UI, no auth, no booking flow.

**Done:**

- **Q-D1…Q-D9 all decided** — see the "Data model" table in `OPEN-QUESTIONS.md`
  and full rationale in ADR-003. Highlights: `Provider` is a person with an
  unused `Organization` hedge (nullable FK); `Slot` rows are materialized, not
  computed; weekly hours + dated exceptions (no RRULE); guest booker is a
  `Client` entity keyed by email; `BookingStatus` enum + append-only
  `BookingEvent`; soft delete only (KVKK deletion = scrub PII + `deletedAt`,
  never hard-delete); price as minor-unit `Int` + currency code; `cuid()`
  string IDs everywhere; cursor pagination contract for future `/api/v1` lists
- **ADR-003 written and accepted** at `docs/architecture/ADR/003-data-model.md`,
  including an explicit "no-PHI fence in schema terms" table mapping every
  field to `DATA-CLASSIFICATION.md`
- **Prisma schema** (`prisma/schema.prisma`): `Organization`, `Provider`,
  `Service`, `WeeklyHours`, `AvailabilityException`, `Slot`, `Client`,
  `Booking`, `BookingEvent`
- **First migration** created and hand-edited:
  `prisma/migrations/20260905220605_init/migration.sql` — added a **partial
  unique index** `booking_slot_active_unique` on `Booking(slotId) WHERE
  status = 'CONFIRMED'` (Prisma's schema DSL can't express partial indexes;
  this is the documented Prisma "customizing migrations" pattern)
- **Double-booking proven**: `src/lib/db/double-booking.test.ts` — inserts a
  `CONFIRMED` booking, then a conflicting one for the same slot and asserts it
  fails with Postgres unique-violation (`P2002`); a second case proves the
  slot frees up for rebooking once the first booking is `CANCELLED`
- **No Docker/Homebrew available in this environment** — solved by
  `embedded-postgres` (real Postgres binary, downloaded per-platform via npm's
  `optionalDependencies`, no daemon/root install needed). Used both to
  generate the migration and inside the test (`src/lib/db/test/local-postgres.ts`
  starts a throwaway instance per test run and applies `prisma migrate deploy`)
- **Prisma pinned to 6.19.3**, not the newer 7.x line — Prisma 7 dropped the
  classic `datasource { url = env(...) }` config in schema files in favor of
  `prisma.config.ts` + driver adapters; 6.x matches the "boring, well-documented"
  bar ADR-002 set
- Added `src/lib/db/client.ts` (Prisma client singleton) and
  `npm run db:generate|db:migrate:dev|db:migrate:deploy`; `postinstall` now runs
  `prisma generate` so `npm ci`/`npm install` always produce a usable client
- **Verified:** `npm run lint`, `typecheck`, `test` (5/5 passing, includes the
  double-booking test), `build`, and `format:check` (pre-existing `tsconfig.json`
  warning only, see gotcha below) all pass
- `DECISIONS.md`, `OPEN-QUESTIONS.md`, `docs/architecture/ADR/README.md`,
  `CURSOR-BRIEF.md`, `WAR-PLAN.md`, `README.md`, `docs/architecture/ENV.md`,
  `src/lib/README.md`, `.env.example` all updated to reflect M1.5 as done

**Not done / deferred (by design — schema only):**

- No provider auth, availability UI, public booking page, or booking flow
- No slot-generation job (turns `WeeklyHours`/`AvailabilityException` into
  `Slot` rows) — that's M2, alongside the domain modules in `src/lib/README.md`
- KVKK PII-scrub job (the *mechanism* the schema supports via `deletedAt`) is
  still not implemented — Q-L3/Q-L4 remain deferred, unchanged by this session
- No `CHECK` constraint enforcing `priceAmount`/`priceCurrency` are both null
  or both set — documented as an accepted invariant, not DB-enforced, since no
  code exists yet to violate it

**Decisions made:** DECISIONS.md rows dated 2026-09-05; ADR-003 (accepted)

**Gotchas for next session:**

- **No Docker or Homebrew in this dev environment.** Do not assume either is
  available; `embedded-postgres` is the working pattern for both local
  migration generation and tests. It has **not yet been verified inside
  GitHub Actions** (`ubuntu-latest`) — the platform binary should resolve the
  same way via npm, but confirm on the next push before trusting CI green.
- The partial unique index (`booking_slot_active_unique`) lives **only** in
  the migration SQL, not in `schema.prisma` (Prisma can't express partial
  indexes declaratively). If `Booking` is ever edited and `prisma migrate dev`
  is run again, check the generated diff carefully — it will not know the
  partial index exists and could propose a conflicting plain index.
- `npm run format:check` reports a pre-existing, unrelated `tsconfig.json`
  formatting warning (confirmed via `git diff` — not introduced this session,
  not touched). Fine to fix in a future cleanup slice; left alone here to keep
  the diff scoped to the data model.
- Node is still at `~/.local/node/bin`, not on `PATH` by default — same as the
  2026-09-03 gotcha.

**Next session should (new chat) — M2, the vertical slice:**

Copy/paste prompt is in `WAR-PLAN.md` §6. Provider auth (Auth.js magic link) →
availability → public booking page → guest books → confirmation email. The
schema and double-booking constraint already exist; M2 wires domain modules
(`src/lib/{identity,availability,booking,provider,notification}/`) around them
behind `/api/v1/*`, per ADR-001. Still no UI polish beyond making the flow work.

**Files touched:** `prisma/schema.prisma`, `prisma/migrations/**`,
`src/lib/db/client.ts`, `src/lib/db/test/local-postgres.ts`,
`src/lib/db/double-booking.test.ts`, `src/lib/README.md`, `package.json`,
`package-lock.json`, `.env.example`, `docs/architecture/ENV.md`,
`docs/architecture/ADR/003-data-model.md`, `docs/architecture/ADR/README.md`,
`docs/DECISIONS.md`, `docs/product/OPEN-QUESTIONS.md`, `docs/CURSOR-BRIEF.md`,
`docs/WAR-PLAN.md`, `README.md`

---

### 2026-09-05 — Remote repo published + commit authorship repaired

**Goal:** Get the local repo onto GitHub before the M1.5 schema session.

**Done:**

- Created **https://github.com/mtogi/ortak-randevu** and pushed `main` (3 commits); `main` tracks `origin/main`
- Installed **GitHub CLI 2.100.0** to `~/.local/bin/gh` (official arm64 release tarball — no Homebrew on this machine) and authenticated as `mtogi`; `gh` is now the git credential helper, so pushes no longer prompt
- **Fixed commit misattribution** — see gotcha below; all 3 commits now link to `mtogi`

**Not done / deferred:**

- Nothing outstanding. No code changed this session — docs and git plumbing only

**Gotchas for next session:**

- **Git identity was unset in every scope** (`local`, `global`, `system`), so the commit tool guessed an author from the macOS account name and produced `Toygar <toygar@users.noreply.github.com>`. GitHub resolves `<username>@users.noreply.github.com` **by username**, so it credited an unrelated real account named `toygar` as a contributor. Fixed by setting a global identity to `Toygar <76550003+mtogi@users.noreply.github.com>`, rewriting the 3 commits, and recreating the repo. **If you ever build on another machine, set `user.email` before the first commit.**
- `git filter-branch` stashes pre-rewrite history at `refs/original/refs/heads/main`; garbage collection will not purge old commits until that ref is deleted
- Commit SHAs changed in the rewrite: `71ecd72→af9b0d9`, `03423c3→aee9de4`, `02279da→617d1f0`. Any SHA written in older notes is stale

**Next session should:** unchanged — **M1.5, data model only.** See the 2026-09-03 entry below and the copy/paste prompt in WAR-PLAN §6. Start with `git pull` in a **new chat**.

**Files touched:** `LOCAL-SETUP.md`, `docs/WAR-PLAN.md`, `docs/process/SESSION-HANDOFF.md` (no app code)

---

### 2026-09-03 — Decision gate closed + M1 scaffold

**Goal:** Accept WAR-PLAN §3, write ADR-001/002, scaffold the web app, stop once README run instructions work.

**Done:**

- **WAR-PLAN §3 accepted as-is, no overrides.** OPEN-QUESTIONS rows moved to `decided`; DECISIONS.md rows added
- ADR-001 (modular monolith + versioned `/api/v1`) and ADR-002 (tech stack) written as **accepted**
- CURSOR-BRIEF stack section filled in; added `docs/architecture/ENV.md`
- Scaffolded Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + next-intl 4, npm
- `src/app/api/v1/health` route proves the versioned API boundary; `src/lib/README.md` documents the domain-module seam
- i18n: EN default + TR via cookie, `Europe/Istanbul` timezone, catalogs in `messages/`, `LocaleSwitcher` server action
- Tooling: ESLint 9 flat config, Prettier, Vitest (3 passing tests incl. an EN/TR catalog-parity check), GitHub Actions CI
- **Verified:** `npm install && npm run dev` → `/` returns 200 in EN and TR, `/api/v1/health` returns `{"status":"ok","apiVersion":"v1"}`. `lint`, `typecheck`, `test`, `build`, `format:check` all pass
- Installed Node 22.23.2 to `~/.local/node` (checksum-verified tarball); repo `git init` + initial commits

**Not done / deferred (by design — scaffold only):**

- Prisma, Auth.js, Resend are decided in ADR-002 but **not wired**; the scaffold runs with no DB and no env file
- No booking, availability, provider, or auth code at all

**Decisions made:** DECISIONS.md rows dated 2026-09-03; ADR-001, ADR-002

**Gotchas for next session:**

- Node lives at `~/.local/node/bin` and is **not** on `PATH` in new shells. Add `export PATH="$HOME/.local/node/bin:$PATH"` to `~/.zshrc` (README has the line)
- ESLint is pinned to `^9`; `eslint-config-next@16` crashes on ESLint 10
- Prettier deliberately ignores `docs/` and root `*.md` — it padded markdown tables into very wide columns
- `next dev` appends a `nextjs-agent-rules` block to `AGENTS.md` on every run; it is committed so the tree stays clean

**Next session should (new chat) — M1.5, data model only:**

The plan changed at the end of this session: the vertical slice is **split**, and
the schema goes first. Rationale is in WAR-PLAN §4 — a wrong booking form costs an
afternoon, a wrong availability/slot representation costs a migration on live data.

1. Answer **Q-D1…Q-D9** in OPEN-QUESTIONS (provider-vs-clinic, materialized vs computed slots, recurrence, guest identity, lifecycle/audit, deletion, money, ID type, pagination)
2. Write **ADR-003 (data model)** as accepted; it must state the no-PHI fence in schema terms
3. Add the Prisma schema + first migration against a local Postgres
4. Prove double-booking is impossible with a test that attempts a conflicting insert and expects it to fail (Q-T5)
5. **No UI, no auth screens, no booking flow** — those are M2

Copy/paste prompt is in WAR-PLAN §6.

**Files touched:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mts`, `.prettierrc.json`, `.prettierignore`, `.env.example`, `.gitignore`, `.github/workflows/ci.yml`, `src/**`, `messages/**`, `README.md`, `AGENTS.md`, `docs/CURSOR-BRIEF.md`, `docs/DECISIONS.md`, `docs/product/OPEN-QUESTIONS.md`, `docs/architecture/ENV.md`, `docs/architecture/ADR/{README,001-system-overview,002-tech-stack}.md`

---

### 2026-09-03 — Token efficiency + war plan wrap

**Goal:** Explain usage meters; encode efficiency in rules; wrap war plan for local IDE build.

**Done:**

- Added `.cursor/rules/token-efficiency.mdc` + `docs/process/TOKEN-EFFICIENCY.md`
- Added `docs/WAR-PLAN.md` with recommended MVP defaults and ready-to-build checklist
- Marked OPEN-QUESTIONS as `proposed` defaults

**Not done / deferred:**

- User must copy docs to local repo, accept/override defaults, write ADR-002, then scaffold

**Next session should (on local IDE):**

1. Accept WAR-PLAN §3 (or overrides)
2. ADR-001/002 accepted
3. Scaffold only (new chat), then vertical slice (another new chat)

**Files touched:** rules, WAR-PLAN, TOKEN-EFFICIENCY, OPEN-QUESTIONS, DECISIONS, AGENTS, CURSOR-BRIEF

---

### 2026-09-02 — Planning bootstrap (docs only)

**Goal:** Inventory documents beyond PRD; start real planning artifacts for Cursor multi-session work.

**Done:**

- Created `docs/00-DOCUMENT-INVENTORY.md`
- Created `docs/CURSOR-BRIEF.md`, `OPEN-QUESTIONS.md`, `DECISIONS.md`, `DATA-CLASSIFICATION.md`
- Scaffolded `AGENTS.md`, Cursor rules, PRD stub, README

**Not done / deferred:**

- Full PRD content, stack ADRs, flows, app scaffold

**Decisions made:** Scope lock (dietitians TR, EN+TR, no health data, web→iOS) recorded in DECISIONS.md

**Blockers:** Foundational questions still open (see OPEN-QUESTIONS.md)

**Next session should:**

1. Draft MVP PRD
2. Close top open questions (booking model, payments, stack)
3. Flesh Cursor rules once stack is chosen

**Files touched:** `docs/**`, `AGENTS.md`, `.cursor/rules/**`, `README.md`
