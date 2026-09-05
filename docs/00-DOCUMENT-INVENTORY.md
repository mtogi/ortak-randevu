# Document Inventory — Dietitian Booking Platform

> **Purpose:** Canonical list of documents needed before and during build.  
> **Scope (v1):** Dietitians / nutrition experts in Turkey.  
> **Out of scope (v1):** Health/clinical patient data storage; non-dietitian professions; native iOS (planned later).  
> **Competitor reference:** Calendly (scheduling UX), differentiated for professional practice booking.  
> **i18n:** English primary; Turkish selectable in user settings.  
> **Current (2026-09-05):** M0–M1.5 exist in git. Next build slice is **M2a
> (ADR-004 + Auth.js)**, not a full booking flow. Living docs:
> `CURSOR-BRIEF.md`, `DECISIONS.md`, `OPEN-QUESTIONS.md`,
> `process/SESSION-HANDOFF.md`.

---

## How to use this inventory

| Status | Meaning |
| --- | --- |
| **P0** | Required before first code commit |
| **P1** | Required before first vertical slice (auth + book + confirm) |
| **P2** | Required before public beta / launch |
| **Living** | Keep updated every sprint |

Create each file as a real `.md` (or linked design asset). Prefer short, decisive docs over long essays.

---

## 1. Product & discovery

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| Product Requirements Document (PRD) | `docs/product/PRD.md` | **P0** | Problem, goals, non-goals, personas, success metrics, MVP scope |
| Vision & Positioning | `docs/product/VISION.md` | **P0** | One-pager: who we are vs Calendly; Turkey dietitian wedge; future expansion |
| Personas & Jobs-to-be-Done | `docs/product/PERSONAS.md` | **P0** | Dietitian (provider) + client (booker); jobs, pains, constraints |
| Competitive Landscape | `docs/product/COMPETITORS.md` | **P1** | Calendly + local TR alternatives; what we copy vs refuse |
| Feature Backlog / Roadmap | `docs/product/ROADMAP.md` | **P0** / Living | Now / Next / Later; iOS & multi-profession as Later |
| User Stories (MVP) | `docs/product/USER-STORIES.md` | **P1** | INVEST-style stories mapped to acceptance criteria |
| Glossary | `docs/product/GLOSSARY.md` | **P1** | Booking, slot, service, provider, client, session — shared language |
| Open Questions Log | `docs/product/OPEN-QUESTIONS.md` | **P0** / Living | Foundational decisions pending (see §7) |

---

## 2. UX / design (pre-build)

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| Information Architecture | `docs/design/IA.md` | **P0** | Site map: public marketing, provider dashboard, client booking |
| User Flows (MVP) | `docs/design/FLOWS.md` | **P1** | Sign up → availability → public booking page → confirm → reminders |
| Wireframes / Lo-fi | `docs/design/wireframes/` or Figma link | **P1** | Screens before UI polish |
| Design System Notes | `docs/design/DESIGN-SYSTEM.md` | **P2** | Tokens, components; can start after first UI spike |
| Content & Tone Guide | `docs/design/CONTENT.md` | **P1** | EN default copy rules; TR tone; no medical advice language |
| Accessibility Checklist | `docs/design/A11Y.md` | **P2** | WCAG target for booking forms |

_Deeper flow detail can wait for later prompts — keep `FLOWS.md` as stubs with links until then._

---

## 3. Architecture & engineering foundations

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| Architecture Decision Records index | `docs/architecture/ADR/README.md` | **P0** | Track stack, hosting, auth, payments choices |
| ADR-001: System Architecture Overview | `docs/architecture/ADR/001-system-overview.md` | **P0** | Web-first, API for future iOS, high-level boxes |
| ADR-002: Tech Stack | `docs/architecture/ADR/002-tech-stack.md` | **P0** | Frontend, backend, DB, hosting, email/SMS |
| ADR-003: Data Model (no PHI) | `docs/architecture/ADR/003-data-model.md` | **accepted** 2026-09-05 | Entities **excluding** health data; schema + migration exist |
| ADR-004: Auth & Roles | `docs/architecture/ADR/004-auth-roles.md` | **P1** | Provider vs client vs admin; session strategy |
| ADR-005: i18n Strategy | `docs/architecture/ADR/005-i18n.md` | **P1** | EN default, TR via settings; string catalog approach |
| ADR-006: Notifications | `docs/architecture/ADR/006-notifications.md` | **P1** | Email/SMS/WhatsApp for booking confirmations in TR market |
| ADR-007: Payments (if in MVP) | `docs/architecture/ADR/007-payments.md` | **P1** | Deposit vs free booking; TR payment providers |
| API Surface Draft | `docs/architecture/API-DRAFT.md` | **P1** | REST/GraphQL sketch shared with future iOS |
| Environment & Secrets | `docs/architecture/ENV.md` | **P1** | What lives in `.env`; never commit secrets |
| Threat Model (lightweight) | `docs/architecture/SECURITY.md` | **P1** | Booking abuse, scraping availability, PII |

---

## 4. Compliance, privacy, legal (Turkey + “no health data”)

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| Privacy & Data Classification | `docs/legal/DATA-CLASSIFICATION.md` | **P0** | What PII we store vs explicitly refuse (diagnoses, labs, meal plans as clinical records, etc.) |
| KVKK / GDPR Notes | `docs/legal/PRIVACY-NOTES.md` | **P1** | Turkey KVKK obligations for account/booking PII; consent UX |
| Terms of Service outline | `docs/legal/TOS-OUTLINE.md` | **P2** | Lawyer-ready outline, not final legal copy |
| Cookie / Tracking Policy outline | `docs/legal/COOKIES.md` | **P2** | Analytics choices |
| Professional disclaimer | `docs/legal/DISCLAIMER.md` | **P1** | Platform is scheduling only; not medical advice |

> Engineering rule of thumb: if a field could be used for clinical care, **do not** put it in the schema. Capture that in ADR-003 + DATA-CLASSIFICATION.

---

## 5. Delivery, ops, quality

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| Definition of Done | `docs/process/DEFINITION-OF-DONE.md` | **P0** | When a story is “done” in Cursor sessions |
| Definition of Ready | `docs/process/DEFINITION-OF-READY.md` | **P1** | When a story may be implemented |
| Testing Strategy | `docs/process/TESTING.md` | **P1** | Unit / integration / e2e for booking-critical paths |
| CI/CD Outline | `docs/process/CICD.md` | **P1** | Branch → PR → preview → prod |
| Runbook / Ops | `docs/process/RUNBOOK.md` | **P2** | Deploy, rollback, incident basics |
| Analytics Events Spec | `docs/process/ANALYTICS.md` | **P2** | Funnel: view page → select slot → book → attend |
| Release Checklist | `docs/process/RELEASE-CHECKLIST.md` | **P2** | Pre-launch gates |

---

## 6. Cursor / multi-session development (critical for this project)

These keep the agent and humans aligned across many prompts.

| Document | Path (suggested) | Priority | Why it exists |
| --- | --- | --- | --- |
| War plan (build gate) | `docs/WAR-PLAN.md` | **P0** | MVP defaults + ready-to-build checklist |
| Project Brief (always-on context) | `docs/CURSOR-BRIEF.md` | **P0** | 1–2 pages the agent should re-read: scope, non-goals, stack, links |
| AGENTS.md / contributor guide for AI | `AGENTS.md` | **P0** | How the agent must work in this repo |
| Cursor Rules (project) | `.cursor/rules/*.mdc` or `.cursorrules` | **P0** | Coding standards, folder layout, “no PHI fields”, i18n, testing |
| Product Rule | `.cursor/rules/product.mdc` | **P0** | Scope lock: dietitians TR only; no health data |
| Architecture Rule | `.cursor/rules/architecture.mdc` | **P0** | Stack conventions once chosen |
| Token efficiency Rule | `.cursor/rules/token-efficiency.mdc` | **P0** | Context vs plan usage; no repeat reminders |
| Token efficiency (detail) | `docs/process/TOKEN-EFFICIENCY.md` | **P0** | Longer guide; @ only when needed |
| Backend Rule | `.cursor/rules/backend.mdc` | **P1** | API, DB, validation patterns |
| Frontend Rule | `.cursor/rules/frontend.mdc` | **P1** | UI patterns, i18n keys, form UX |
| Security Rule | `.cursor/rules/security.mdc` | **P0** | Secrets, auth, PII handling |
| Session Handoff Template | `docs/process/SESSION-HANDOFF.md` | **P0** / Living | End-of-session: what changed, what’s next, blockers |
| Decision Log | `docs/DECISIONS.md` | **P0** / Living | Dated decisions (lighter than full ADRs for small calls) |
| Progress / Changelog | `CHANGELOG.md` | Living | Human-readable progress |
| README | `README.md` | **P0** | Clone → run → links to docs |

### Recommended Cursor rule topics (checklist)

- [ ] Never add health/clinical schema fields without explicit product approval
- [ ] All user-facing strings via i18n (EN + TR)
- [ ] Prefer small PRs / vertical slices
- [ ] Update SESSION-HANDOFF at end of meaningful work
- [ ] Do not invent payment/legal copy; link to outline docs
- [ ] API designed for future mobile client (no web-only auth hacks)
- [ ] Timezones: Turkey (`Europe/Istanbul`) as default provider TZ

---

## 7. Foundational questions to decide in planning (before code)

Track answers in `docs/product/OPEN-QUESTIONS.md` → promote to ADR / DECISIONS when closed.

### Product

1. Who books first — client finds dietitian, or dietitian shares a Calendly-like link?
2. Marketplace discovery (search/list) in MVP, or invite-only booking pages only?
3. Free scheduling only, or deposits / paid sessions in MVP?
4. Online (video link field) vs in-person vs both?
5. Provider verification (diploma / association) — required or later?
6. Cancellation / reschedule policies — platform default or provider-defined?

### Technical

7. Monolith vs separate API + web app from day one?
8. Auth provider (email magic link, OAuth, phone)?
9. Database & hosting region (TR/EU data residency preference)?
10. Real-time availability: optimistic locking strategy for double-booking?
11. Notification channel priority for Turkey (email / SMS / WhatsApp)?
12. Mobile: when does API freeze for iOS — after web MVP or earlier?

### Legal / trust

13. Exact list of **forbidden** data fields (confirm with counsel if needed)?
14. Account deletion / KVKK subject-request process?
15. Are we a marketplace (two-sided) or a SaaS tool sold to dietitians?

---

## 8. Suggested creation order (real steps this week)

```text
Done
  ☑ CURSOR-BRIEF, PRD stub, VISION, OPEN-QUESTIONS, DATA-CLASSIFICATION
  ☑ AGENTS.md + .cursor/rules, DECISIONS, SESSION-HANDOFF, README
  ☑ ADR-001 / ADR-002 accepted; Next.js scaffold (M1)
  ☑ ADR-003 accepted; Prisma schema + double-booking test (M1.5)

Next (M2a — new Cursor chat)
  □ ADR-004 (auth & roles) accepted
  □ Auth.js magic link + Provider row on first login
  □ Close Q-T10 (public booking URL)

Then
  □ M2b slot generation from weekly hours
  □ M2c public book + confirmation email
  □ USER-STORIES.md / FLOWS.md once the happy path exists
```

---

## 9. Explicitly _not_ needed yet

- Full iOS app PRD (keep a short “Future: iOS” section in ROADMAP only)
- Multi-profession marketplace design
- EHR / meal-plan / lab integrations
- Pixel-perfect design system before first usable flow
- Final lawyer-signed ToS (outline is enough for build)

---

## 10. Repo layout target (docs + Cursor)

```text
/
├── README.md
├── AGENTS.md
├── CHANGELOG.md
├── .cursor/
│   └── rules/
│       ├── product.mdc
│       ├── architecture.mdc
│       ├── security.mdc
│       ├── frontend.mdc
│       └── backend.mdc
└── docs/
    ├── 00-DOCUMENT-INVENTORY.md   ← this file
    ├── CURSOR-BRIEF.md
    ├── DECISIONS.md
    ├── product/
    ├── design/
    ├── architecture/
    │   └── ADR/
    ├── legal/
    └── process/
```

---

_Next prompt:_ paste WAR-PLAN §6 in a **new** chat (M2a auth). Do not continue a giant thread.
