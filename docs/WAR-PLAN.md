# War Plan — Ortak Randevu (Web → iOS later)

**Last updated:** 2026-09-24  
**Status:** M0–M4 + hygiene done. Canonical site `https://www.ortakrandevu.com`. Owner **accepted** MVP plan 2026-09-24: general hosts; calendar sync (Google + Microsoft) is the invite gate; Apple after iOS; payments parked. **Next:** Phase 0 host copy (if needed) → calendar foundation + Google read-busy. Vercel env: Edit only, never Rotate `AUTH_SECRET`.

---

## 1. Mission

Ship a Calendly-comfortable **web booking** product for **anyone who accepts bookings** (hosts) in **Turkey**, TR default + EN in the header, **no health/clinical data**, API-shaped for a later **iOS** app. **No marketplace** unless DECISIONS says so.

## 2. What is already done (this workspace)

| Artifact | Role |
| --- | --- |
| `docs/00-DOCUMENT-INVENTORY.md` | Full doc checklist |
| `docs/CURSOR-BRIEF.md` | Always-on short context |
| `docs/product/PRD.md` (+ VISION, ROADMAP) | MVP stub |
| `docs/product/OPEN-QUESTIONS.md` | Decision backlog |
| `docs/legal/DATA-CLASSIFICATION.md` | No-PHI fence |
| `docs/DECISIONS.md` | Settled calls |
| `AGENTS.md` + `.cursor/rules/*` | Multi-session + token hygiene |
| `docs/process/SESSION-HANDOFF.md` | Chat continuity without fat threads |
| `docs/process/TOKEN-EFFICIENCY.md` | Usage deep-dive |

This tree lives in the git repo at **https://github.com/mtogi/ortak-randevu** (pushed 2026-09-05).

## 3. Recommended MVP defaults (accept or edit once)

§3 defaults were accepted 2026-09-03. **Owner overrides 2026-09-24** (see DECISIONS):

| ID | Recommendation | Rationale |
| --- | --- | --- |
| Q-P1 | **Shareable booking link only** (no marketplace) | True Calendly wedge; fastest MVP |
| Q-P2 | **SaaS for hosts who accept bookings** (Turkey-first) — dietitian-only **superseded** | Broader Calendly wedge |
| Q-P3 | **Free booking** (no payments until owner gate: post web MVP + ~10–20 users + iOS parity) | Defer TR payment complexity |
| Q-P4 | **Both** online + in-person (flag on service) | Cheap; matches real practice |
| Q-P5 | **Self-serve** signup (no diploma gate) | Speed; verify later |
| Q-P6 | **Simple platform defaults** (cancel/reschedule windows) | Avoid policy engine |
| Q-P7 | **Guest book with email + name + phone**; optional account later | Max comfort |
| Q-P8 | **Small service catalog** (name, duration, optional price display) | Not single hard-coded type |
| Q-T1 | **Modular monolith**: Next.js (or similar) web + **versioned HTTP API** routes | One deploy; iOS-ready boundary |
| Q-T2 | **Next.js + TypeScript + Postgres +** hosted auth email magic-link | Fast, common Cursor path — **confirm in IDE** |
| Q-T3 | **Magic link email** primary | Low friction; phone later |
| Q-T4 | **EU region** hosting/DB preference | KVKK-friendly default |
| Q-T5 | **DB unique constraint** on bookable slot + transaction | Non-negotiable integrity |
| Q-T6 | **Email first**; SMS/WhatsApp later | MVP notifications |
| Q-T7 | Calendar sync **MVP-must**: Google + Microsoft before invites; **Apple after iOS** | Owner 2026-09-24 |
| Q-T8 | Evolve API with web; **freeze before iOS**; iOS after web is satisfactory |  |
| Q-L1/L2 | Forbidden list in DATA-CLASSIFICATION; **no intake/goals fields** | Already drafted |
| Q-L3/L4 | Provider JSON export + account scrub (no hard delete); private-beta retention = immediate PII removal, no timed purge | M4 |
| Q-X1 | Invite-ready = friendly **hosts** book end-to-end **with Google+MS calendar sync** | Owner 2026-09-24 |
| Q-X2 | **Docs + simple wireframes** first; Figma optional |  |

Stack (Q-T2) is the only item you should consciously confirm before scaffold — everything else above is a safe Calendly-like MVP.

## 4. Build phases (after gate)

```text
M0  Copy docs → local repo → git init → push to GitHub                   ✅ done 2026-09-05
M1  Scaffold (per ADR-002) + env + CI stub                               ✅ done 2026-09-03
M1.5 Data model + schema (ADR-003) — Postgres, Prisma, migrations        ✅ done 2026-09-05
M2a Auth & identity (ADR-004) + Auth.js magic link + Provider session    ✅ done 2026-09-05
M2b Availability: weekly hours + exceptions → generated Slot rows        ✅ done 2026-09-05
M2c Public book + guest confirm + Resend email (ADR-005)                 ✅ done 2026-09-05
M2.9 First deploy: Neon + Vercel fra1 + Resend, one real booking (Q-X1)  ✅ done 2026-09-06
M3  Provider dashboard (own bookings, cancel/reschedule) + EN/TR settings ✅ done 2026-09-06
M4  Private beta hardening (KVKK delete, logging hygiene) ✅ done 2026-09-07
Hygiene ROADMAP Now 1–5 ✅ done 2026-09-19
Now   calendar foundation → Google → Microsoft → invite (Apple post-iOS)
Later payments (owner gate), SMS, iOS, Apple calendar, marketplace only if DECISIONS
```

**Why M1.5 was split out of M2:** the schema is the least reversible artifact in
the product. Getting auth and a booking form wrong costs an afternoon; getting
the availability/slot representation wrong costs a data migration on live
bookings. The questions that decide it are `Q-D1`…`Q-D9` in
[OPEN-QUESTIONS](./product/OPEN-QUESTIONS.md); they close into **ADR-003**.

M1.5 is done when: ADR-003 is accepted, the Prisma schema exists, the first
migration runs against a local Postgres, the double-booking constraint is proven
by a test that tries to insert a conflict and fails, and **no UI has been built**.
✅ **Done 2026-09-05** — see ADR-003 and `src/lib/db/double-booking.test.ts`.

## 5. Ready-to-build checklist

Gate cleared on 2026-09-03:

- [x] This docs tree exists in your **local** project (git repo initialised)
- [x] Pushed to the GitHub remote `https://github.com/mtogi/ortak-randevu` (2026-09-05)
- [x] §3 defaults **accepted as-is, no overrides** (2026-09-03); **audience + Q-T7 overridden 2026-09-24**
- [x] ADR-001, ADR-002, **and ADR-003** written as **accepted**
- [x] Scaffold runs: `npm install && npm run dev` serves EN/TR home page + `/api/v1/health`
- [x] New chat per phase (don’t continue a huge planning thread)

**Not required before first invites:** Figma, payments, iOS PRD, marketplace, SMS, full ToS lawyer copy, Apple calendar, mega UI rewrite.

## 6. Next IDE prompt (copy/paste in a **new chat**)

Owner accepted the MVP plan (2026-09-24). Docs promoted. Remaining Phase 0:
light host copy + calendar ADR stub if not done.

**Preferred swan slice after Phase 0 leftovers:**

> Calendar sync foundation (Phase 1) + Google Calendar connect **read-busy only**
> (start of Phase 2). Schema + busy ∩ OPEN slots; settings connect UI; separate
> calendar OAuth from Auth.js login. No Microsoft/Apple yet; no write-back yet
> unless it fits cleanly. Never Rotate `AUTH_SECRET`. No payments / iOS / marketplace.

Vercel Web Analytics is on. Speed Insights is not in scope.

## 7. Efficiency reminder (already in rules)

You should **not** need to re-explain token saving. Rules encode: new chat per slice, short prompts, handoff file, no speculative scope. Detail: `docs/process/TOKEN-EFFICIENCY.md`.
