# Open Questions Log

> Status: `open` | `proposed` | `decided` | `deferred`  
> When decided → copy outcome into `docs/DECISIONS.md` and/or an ADR; mark row `decided`.  
> **2026-09-03:** WAR-PLAN §3 defaults were **accepted as-is, no overrides**. Rows below are `decided` unless marked otherwise.

## Product

| ID | Question | Decision | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-P1 | Booking model? | Shareable link only (no marketplace) | decided | Toygar |
| Q-P2 | Primary customer? | SaaS → dietitian | decided | Toygar |
| Q-P3 | Payments in MVP? | Free booking (no payments) | decided | Toygar |
| Q-P4 | Session modes? | Online + in-person flag on service | decided | Toygar |
| Q-P5 | Provider verification? | Self-serve signup, no diploma gate | decided | Toygar |
| Q-P6 | Cancel / reschedule policy? | Simple platform defaults | decided | Toygar |
| Q-P7 | Guest vs account? | Guest book (name/email/phone); optional account later | decided | Toygar |
| Q-P8 | Services model? | Small catalog (name, duration, optional price) | decided | Toygar |

## Technical

| ID | Question | Decision | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-T1 | Web architecture? | Modular monolith + versioned HTTP API → ADR-001 | decided | Toygar |
| Q-T2 | Tech stack? | Next.js + TS + Postgres + magic link → ADR-002 | decided | Toygar |
| Q-T3 | Auth? | Email magic link (Auth.js) | decided | Toygar |
| Q-T4 | Data residency? | EU hosting/DB (Vercel `fra1` + Neon EU) | decided | Toygar |
| Q-T5 | Double-booking? | DB unique constraint + transaction | decided | Toygar |
| Q-T6 | Notifications? | Email first (Resend); SMS/WhatsApp later | decided | Toygar |
| Q-T7 | Calendar sync? | Later | deferred |  |
| Q-T8 | API freeze for iOS? | Evolve with web; freeze `v1` before iOS | decided | Toygar |

## Legal / privacy

| ID | Question | Decision | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-L1 | Forbidden fields? | Per DATA-CLASSIFICATION.md | decided | Toygar |
| Q-L2 | Intake / goals forms? | Excluded from MVP | decided | Toygar |
| Q-L3 | Account deletion / export? | Implement before public beta | deferred |  |
| Q-L4 | Retention period? | Decide pre-beta | deferred |  |

## Process

| ID | Question | Decision | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-X1 | Private beta “done”? | Friendly dietitians can complete real bookings | decided | Toygar |
| Q-X2 | Design tool? | Docs/wireframes first; Figma optional | decided | Toygar |

## Newly opened (2026-09-03, from scaffold session)

| ID | Question | Notes | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-T9 | Locale routing shape? | Scaffold uses cookie-based locale (no `/en`, `/tr` URL prefix) so public booking links stay short. Revisit if SEO/marketing needs localized URLs. | open |  |
| Q-T10 | Where does the provider's public page live? | `/[providerSlug]` vs `/book/[providerSlug]`. Affects reserved-word handling. Decide at start of M2. | open |  |
