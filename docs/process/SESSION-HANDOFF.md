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

### 2026-09-05 — M2c: public booking + Resend

**Goal:** Public `/book/[providerSlug]`, guest booking, 24h rule (Q-P6), Resend for booking mail + magic links (Q-T14). No schema change.

**Done:**

- **ADR-005 accepted** — guest access is a stateless HMAC capability token
  (`AUTH_SECRET` over the booking id), management at `/bookings/[bookingId]`,
  not `/book/manage/...`
- `src/lib/booking/` — create / cancel / reschedule; slot claimed with a
  compare-and-set inside a transaction, server-side `now` re-check, `P2002`
  from `booking_slot_active_unique` as the backstop. Cancel frees the slot,
  reschedule moves `slotId` and stays CONFIRMED
- `src/lib/mail/` — Resend over REST (no SDK), SMTP fallback, dev log;
  magic links now use the same sender; mail failures are logged, never fatal
- Pages `/book/[providerSlug]` + `/bookings/[bookingId]`, EN/TR copy under
  `book.*`, `manageBooking.*`, `email.*`
- `/api/v1/public/{providers,bookings}` mirroring the pages for future iOS
- `src/i18n/request.ts` honors an explicit locale so each email renders in
  its recipient's language
- Tests: `booking.test.ts` (embedded Postgres: race, rebook after cancel,
  reschedule, 24h refusal, bad token), plus `rules` / `token` / `guest` units
  — 46 tests green; `lint`, `typecheck`, `next build` clean
- Verified end-to-end against a throwaway Postgres + `next start`: EN/TR
  page render, book → confirm → reschedule → cancel, duplicate booking → 409,
  bad token → 404, slot released after cancel

**Not done / deferred:** provider-side cancel/reschedule and COMPLETED/NO_SHOW (M3); no "load more" on the public slot list (first 60); Q-T7, Q-L3, Q-L4; Q-T15 Google

**Also — CI is green again for the first time since M2b.** Two pre-existing
failures were fixed: `eslint` on `app-header.tsx` (`<a href="/">` →
`next/link`), and `format:check` on 11 files M2a/M2b left unformatted.
Because `format:check` runs first in `ci.yml`, the pipeline had been dying
before `npm test`, which is why the `embedded-postgres` question below was
open for so long.

**Closed a long-standing unknown:** `embedded-postgres` works on GitHub
Actions `ubuntu-latest` — the Postgres-backed tests ran green there (run
`34003266541`). ADR-003 flagged this as unverified since M1.5.

**Blockers:** Resend has never been called for real — no `RESEND_API_KEY` in this environment. Only transport selection and template rendering were exercised.

**Next session should:** new chat, WAR-PLAN §6 (M3). Note that `?t=` management links are secrets — logging hygiene is an M4 item.

**Files touched:** `src/lib/booking/**`, `src/lib/mail/**`, `src/lib/app-url.ts`, `src/lib/http/booking-error.ts`, `src/app/book/**`, `src/app/bookings/**`, `src/app/api/v1/public/**`, `src/components/slot-picker.tsx`, `src/i18n/request.ts`, `src/lib/identity/send-verification-request.ts`, `messages/*`, docs listed above

---

### 2026-09-05 — M2b: availability → materialized slots

**Goal:** Provider weekly hours, services, closed days, and Slot generation (Q-T11–T13).

**Done:**

- `src/lib/availability/` — 15-minute grid, 56-day horizon, Europe/Istanbul wall times
- Signed-in `/me/availability` + `/api/v1/me/{services,availability,weekly-hours,exceptions,slots}`
- Regenerates OPEN slots on hours/service/exception save; leaves BOOKED rows
- Tests: `generate.test.ts`, `regenerate.test.ts` (embedded Postgres)

**Not done / deferred:** public `/book`; Resend (Q-T14/M2c); Google (Q-T15); Q-T7/Q-L3/Q-L4

**Decisions made:** Q-T9, Q-T11–T15 already in DECISIONS

**Next session should:** new chat, WAR-PLAN §6 (M2c). Needs `DATABASE_URL` + signed-in provider to use the UI.

**Files touched:** `src/lib/availability/**`, `src/app/me/availability/**`, `src/app/api/v1/me/**`, `messages/*`, docs listed above

---

### 2026-09-05 — QnA: Q-T14 (Resend) + Q-T15 (Google later)

**Goal:** Close remaining M2b/M2c questions. Docs only.

**Done:**

- **Q-T14:** M2b unblocked without Resend; Resend in M2c for booking + magic link
- **Q-T15:** Google sign-in optional after M2b; magic link stays primary

**Not done / deferred:** Q-T7, Q-L3, Q-L4 (beta). No open M2b questions.

**Decisions made:** OPEN-QUESTIONS + DECISIONS Q-T14, Q-T15

**Next session should:** M2b availability → Slot rows (WAR-PLAN §6).

**Files touched:** `docs/product/OPEN-QUESTIONS.md`, `docs/DECISIONS.md`, this file

---

### 2026-09-05 — QnA: close M2b/M2c product defaults (batch 1)

**Goal:** Fewer open questions before M2b. Docs only; no app code.

**Done:**

- **Q-T9 decided:** cookie locale, no `/en`/`/tr`
- **Q-T11:** materialize slots 56 days ahead; regen on hours/exceptions
- **Q-T12:** 15-minute grid; duration multiple of 15
- **Q-T13:** no buffers in M2b
- **Q-P6 numbers:** guest cancel/reschedule until 24h before; provider anytime

**Not done / deferred:** Q-T7 calendar sync; Q-L3 deletion/export; Q-L4 retention. Production magic-link mail vs Resend still to confirm (batch 2).

**Decisions made:** OPEN-QUESTIONS + DECISIONS (Q-T9, Q-T11–T13, Q-P6)

**Next session should:** finish QnA (mail) or start M2b per WAR-PLAN §6.

**Files touched:** `docs/product/OPEN-QUESTIONS.md`, `docs/DECISIONS.md`, this file

---

### 2026-09-05 — M2a: ADR-004 + Auth.js magic link + Provider identity

**Goal:** Auth & identity only. Do not build availability, public booking, or Resend.

**Done:**

- **ADR-004 accepted** — provider-only magic link, Auth.js v5 pin
  `5.0.0-beta.32`, Prisma adapter tables additive, JWT sessions, first
  verified login creates/links `Provider` by email
- **Q-T10 decided:** `/book/[providerSlug]` (page not built)
- **Q-T9 left** as cookie locale
- `src/lib/identity/` + tests; `GET /api/v1/me`; `/login`, `/login/sent`, `/me`
- Migration `20260905223800_authjs` (Auth.js tables only; booking index untouched)
- Magic-link send: optional SMTP; local log; no Resend

**Not done / deferred:** M2b slots; M2c `/book` + Resend; production SMTP

**Decisions made:** ADR-004, DECISIONS (Q-T10, Auth.js pin), OPEN-QUESTIONS Q-T10

**Next session should:** new chat, paste WAR-PLAN §6 (M2b). Needs `DATABASE_URL`
to consume a magic link locally.

**Files touched:** `src/auth.ts`, `src/lib/identity/**`, `src/app/login/**`,
`src/app/me/**`, `src/app/api/v1/me/**`, `prisma/**`, `docs/**` listed above

---

### 2026-09-05 — Docs aligned for M2a; original M2 split

**Goal:** After M1.5 landed, make every living markdown match reality and
leave a small next-chat prompt. No app code.

**Done:**

- Stale “no database / M1.5 next / M1 = vertical slice” language updated in
  `LOCAL-SETUP.md`, `ROADMAP.md`, `PRD.md`, `00-DOCUMENT-INVENTORY.md`,
  ADR-002 status note, ADR README, README, CURSOR-BRIEF, WAR-PLAN
- Original M2 split into **M2a auth → M2b slots → M2c book+email** (one
  concern per chat). Copy/paste prompt is WAR-PLAN §6
- Q-T9/Q-T10 left **open** with recommendations (cookie locale;
  `/book/[slug]`) for M2a to close Q-T10

**Not done / deferred:** M2a itself; push of `d9c23ed` (M1.5) to GitHub —
local `main` is 1 commit ahead of `origin/main` plus this docs-only working
tree

**Next session should:** new chat, paste WAR-PLAN §6. Start with
`git status` — commit/push these doc updates if they are still uncommitted.

**Files touched:** `LOCAL-SETUP.md`, `README.md`, `docs/**` listed above

---

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

**Next session should:** superseded the same day — M1.5 is done. Next is **M2a** (see top entry).

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
