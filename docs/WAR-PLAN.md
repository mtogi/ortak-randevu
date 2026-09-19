# War Plan — Dietitian Booking (Web → iOS later)

**Last updated:** 2026-09-18  
**Status:** M0–M4 done. Canonical site `https://www.ortakrandevu.com`. Hygiene ROADMAP Now: items 1–3 done; **item 4 brand in progress** — compact + favicons + full header mark + Geist lockup shipped; 3B palette, icon pack, Q7 clouds still open. **Next chat: continue brand** (WAR-PLAN §6). Vercel env: Edit only, never Rotate `AUTH_SECRET`.

---

## 1. Mission

Ship a Calendly-comfortable **web booking** product for **dietitians in Turkey**, TR default + EN in the header, **no health/clinical data**, API-shaped for a later **iOS** app.

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
| Q-L3/L4 | Provider JSON export + account scrub (no hard delete); private-beta retention = immediate PII removal, no timed purge | M4 |
| Q-X1 | Private beta = **end-to-end booking works** for friendly dietitians |  |
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
Later  payments, SMS, calendar sync, iOS, other professions
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
- [x] §3 defaults **accepted as-is, no overrides**
- [x] ADR-001, ADR-002, **and ADR-003** written as **accepted**
- [x] Scaffold runs: `npm install && npm run dev` serves EN/TR home page + `/api/v1/health`
- [x] New chat per phase (don’t continue a huge planning thread)

**Not required before first code:** Figma, payments, iOS PRD, marketplace, SMS, full ToS lawyer copy, multi-profession design.

## 6. Next IDE prompt (copy/paste in a **new chat**)

M0–M4 are done. Canonical origin is `https://www.ortakrandevu.com`. Never
**Rotate** `AUTH_SECRET`. Hygiene queue: ROADMAP Now item 4 (brand) is
**in progress**, not a greenfield Q&A. Compact mark + favicons shipped.

This next chat **continues brand**. Product/design lead. Do not restart the
decision inventory. Implement only when the owner names a slice. Do not mix
layout or SEO.

```text
You are the product/design lead for Ortak Randevu this chat — continuation of the brand working session, not a greenfield Q&A.

Read first (do not dump them back): docs/process/SESSION-HANDOFF.md (top), docs/design/BRAND.md (especially Working-session calls 2026-09-18), docs/DECISIONS.md row 2026-09-18, docs/product/ROADMAP.md item 4, docs/CURSOR-BRIEF.md. Skim `docs/design/assets/logo/mark-compact.svg`, `docs/design/assets/logo/mark-full.svg`, `docs/design/assets/logo/lockup.svg`, `src/app/icon.svg`, `src/app/apple-icon.tsx`, live header `src/components/wordmark.tsx`, tokens in `src/app/globals.css`. Site: https://www.ortakrandevu.com.

Standing: M0–M4 done. TR default + Q-T16 geo first-visit. LICENSE PolyForm Noncommercial 1.0.0. Vercel env: Edit only, never Rotate AUTH_SECRET.

Brand (partial, 2026-09-18):
- Decided: two-master bullseye (not a letter); cyan is signature at 16px; accent 3B-harmonize (keep trust-blue CTA, nudge toward #5EDFD7 — not applied in CSS yet); lockup = mark + one-line Geist “Ortak Randevu”; ~16 custom icons as files under docs/design/assets/; tools = in-repo SVG + Figma Free. Quiver abandoned (composer would not send). No Claude Pro.
- Shipped: compact mark + tab/Apple icons; 16px www tab confirmed (cyan reads); full header mark (`mark-full.svg` + `wordmark.tsx`); one-line Geist lockup (`lockup.svg`, outlined wght 650).
- Open: Q7 cloudy atmosphere where (recommend marketing-only); 3B CSS; icon pack.
- Do not copy Calendly’s C/wordmark/illustrations. No leaf, caduceus, BMI, “patient”.

This chat continues brand only. Not layout, not SEO, not features.

How to work:
- First reply: 8–12 line standing (done vs not), recommended next slice, then STOP. Do not re-ask closed questions. Do not dump an asset pack or rewrite CSS on turn one.
- Implement a slice only when I say to. One visual concern at a time.
- Record closed calls in docs/design/BRAND.md and DECISIONS.md. Update SESSION-HANDOFF when a slice lands or the chat ends.
- User-facing copy EN+TR via catalogs. Do not change booking logic, Prisma/schema, LICENSE, locale, mobile layout, or SEO.

Suggested slice order unless I override: (1) confirm compact at 16px / www tab, (2) full header mark aligned to compact, (3) Geist lockup SVG, (4) 3B-harmonize tokens, (5) Q7 then clouds, (6) ~16 icon files then wire landing steps.

Out of scope unless I pull it in: payments, SMS, marketplace, EHR, calendar sync, rotating AUTH_SECRET, Claude Pro, Quiver.

Follow .cursor/rules. One agent, this topic only.
```

## 7. Efficiency reminder (already in rules)

You should **not** need to re-explain token saving. Rules encode: new chat per slice, short prompts, handoff file, no speculative scope. Detail: `docs/process/TOKEN-EFFICIENCY.md`.
