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
| Q-T10 | Where does the provider's public page live? | `/[providerSlug]` vs `/book/[providerSlug]`. Affects reserved-word handling and slug uniqueness. | open |  |

## Data model — decide next session (→ ADR-003)

These are the questions that make a schema expensive to change later. Answer them
before writing migrations, not after.

| ID | Question | Why it is load-bearing | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-D1 | Is a provider a person, or a person inside a practice/clinic? | Adding a tenant/org layer later is a painful migration; adding it now is one nullable FK. Multi-dietitian clinics are a plausible year-one customer. | open |  |
| Q-D2 | Are bookable slots **materialized rows** or **computed** from availability rules? | Q-T5 requires a unique constraint, and that constraint needs something concrete to sit on. Materialized slots make it trivial; computed slots need a Postgres exclusion constraint over a time range. | open |  |
| Q-D3 | How is recurring availability expressed? | Weekly hours + dated exceptions, vs full RRULE. Drives slot generation and DST correctness around `Europe/Istanbul`. | open |  |
| Q-D4 | Is a guest booker an entity, or fields on the booking row? | Q-P7 promises guest booking with an optional account later. Guests as rows keyed by email make that upgrade easy; inline fields make it a backfill. | open |  |
| Q-D5 | Booking lifecycle states, and is history append-only? | Cancel/reschedule (Q-P6) means state transitions. A small event/audit table costs little now and answers "what happened" later. | open |  |
| Q-D6 | Hard delete or soft delete — and what does a KVKK deletion actually remove? | Q-L3 defers the feature, but the schema decides whether it is even possible. Bookings referencing a deleted person must degrade gracefully. | open |  |
| Q-D7 | How is the optional service price stored? | Integer minor units + currency code, even with no payments in MVP (Q-P3). Cheap now, migration later. | open |  |
| Q-D8 | Do IDs leak information? | Sequential integers expose booking volume in public URLs and in the future iOS API. UUID/ULID vs bigint is a permanent early call. | open |  |
| Q-D9 | What is the API's pagination and filtering contract? | ADR-001 freezes `v1` before iOS. Cursor vs offset pagination is hard to change after a native client ships. | open |  |
