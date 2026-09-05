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
