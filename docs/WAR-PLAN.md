# War Plan — Dietitian Booking (Web → iOS later)

**Last updated:** 2026-09-03  
**Status:** Planning bootstrap complete → **one decision gate** → then build in IDE/Agent mode.

---

## 1. Mission

Ship a Calendly-comfortable **web booking** product for **dietitians in Turkey**, EN default + TR in settings, **no health/clinical data**, API-shaped for a later **iOS** app.

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

Copy this tree into your **local git repo** before coding (this cloud workspace is not your machine’s project).

## 3. Recommended MVP defaults (accept or edit once)

Accepting these closes the P0 gate. Alternatives are fine — just write them into `DECISIONS.md`.

| ID | Recommendation | Rationale |
| --- | --- | --- |
| Q-P1 | **Shareable booking link only** (no marketplace) | True Calendly wedge; fastest MVP |
| Q-P2 | **SaaS for dietitians** (they are the customer) | Clear billing & roadmap later |
| Q-P3 | **Free booking** (no payments in MVP) | Defer TR payment complexity |
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
| Q-T7 | Calendar sync **Later** |  |
| Q-T8 | Evolve API with web; **freeze before iOS** |  |
| Q-L1/L2 | Forbidden list in DATA-CLASSIFICATION; **no intake/goals fields** | Already drafted |
| Q-L3/L4 | Defer formal retention; implement **delete account** before public beta |  |
| Q-X1 | Private beta = **end-to-end booking works** for friendly dietitians |  |
| Q-X2 | **Docs + simple wireframes** first; Figma optional |  |

Stack (Q-T2) is the only item you should consciously confirm before scaffold — everything else above is a safe Calendly-like MVP.

## 4. Build phases (after gate)

```text
M0  Copy docs → local repo → git init                                    ✅ done 2026-09-03
M1  Scaffold (per ADR-002) + env + CI stub                               ✅ done 2026-09-03
M1.5 Data model + schema (ADR-003) — Postgres, Prisma, migrations        ← next session
M2  Vertical slice: provider auth → availability → public page → book → email confirm
M3  Provider dashboard basics + cancel/reschedule defaults + EN/TR settings
M4  Private beta hardening (KVKK delete, logging hygiene, double-book tests)
Later  Payments, SMS, calendar sync, iOS, other professions
```

**Why M1.5 was split out of M2:** the schema is the least reversible artifact in
the product. Getting auth and a booking form wrong costs an afternoon; getting
the availability/slot representation wrong costs a data migration on live
bookings. The questions that decide it are `Q-D1`…`Q-D9` in
[OPEN-QUESTIONS](./product/OPEN-QUESTIONS.md); they close into **ADR-003**.

M1.5 is done when: ADR-003 is accepted, the Prisma schema exists, the first
migration runs against a local Postgres, the double-booking constraint is proven
by a test that tries to insert a conflict and fails, and **no UI has been built**.

## 5. Ready-to-build checklist

Gate cleared on 2026-09-03:

- [x] This docs tree exists in your **local** project (git repo initialised)
- [x] §3 defaults **accepted as-is, no overrides**
- [x] ADR-001 and ADR-002 written as **accepted**
- [x] Scaffold runs: `npm install && npm run dev` serves EN/TR home page + `/api/v1/health`
- [x] New chat per phase (don’t continue a huge planning thread)

**Not required before first code:** Figma, payments, iOS PRD, marketplace, SMS, full ToS lawyer copy, multi-profession design.

## 6. Next IDE prompt (copy/paste in a **new chat**)

The M0/M1 prompt is done. This is the M1.5 prompt:

```text
Read docs/process/SESSION-HANDOFF.md (top entry) and OPEN-QUESTIONS Q-D1..Q-D9.
Recommend answers for Q-D1..Q-D9, then write ADR-003 (data model) as accepted.
Add the Prisma schema + first migration and prove double-booking is impossible
with a failing-insert test. No UI, no auth screens, no booking flow yet.
Follow .cursor/rules. Update DECISIONS + OPEN-QUESTIONS + SESSION-HANDOFF when done.
```

Chat after that: M2, the vertical slice, and nothing else.

## 7. Efficiency reminder (already in rules)

You should **not** need to re-explain token saving. Rules encode: new chat per slice, short prompts, handoff file, no speculative scope. Detail: `docs/process/TOKEN-EFFICIENCY.md`.
