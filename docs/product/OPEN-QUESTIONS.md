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
| Q-T9 | Locale routing shape? | Keep cookie-based locale (no `/en`/`/tr` prefix). Revisit only if SEO/marketing needs localized URLs. | open (cookie; not closed in M2a) |  |
| Q-T10 | Where does the provider's public page live? | `/book/[providerSlug]` | decided | Toygar |

## Data model — decided 2026-09-05 (→ ADR-003)

These are the questions that make a schema expensive to change later. Full
rationale for each is in [ADR-003](../architecture/ADR/003-data-model.md);
this table is a pointer, not a duplicate.

| ID | Question | Decision | Status | Owner |
| --- | --- | --- | --- | --- |
| Q-D1 | Is a provider a person, or a person inside a practice/clinic? | Person. Added `Organization` + nullable `Provider.organizationId` as a schema-only hedge — no org logic/UI yet. | decided | Toygar |
| Q-D2 | Materialized slots or computed from availability rules? | Materialized `Slot` rows, unique on `(providerId, startAt)`. Documented gap: doesn't block partial overlaps between differently-sized slots (M2 slot-generation job's job, not the DB's, for now). | decided | Toygar |
| Q-D3 | How is recurring availability expressed? | Weekly hours (`WeeklyHours`) + dated exceptions (`AvailabilityException`). No RRULE. | decided | Toygar |
| Q-D4 | Is a guest booker an entity, or fields on the booking row? | Entity: `Client`, keyed by unique email. | decided | Toygar |
| Q-D5 | Booking lifecycle states, and is history append-only? | `BookingStatus` enum (CONFIRMED/CANCELLED/COMPLETED/NO_SHOW) + append-only `BookingEvent` table. | decided | Toygar |
| Q-D6 | Hard delete or soft delete — what does a KVKK deletion remove? | Soft delete only (`deletedAt` on `Provider`/`Client`); KVKK deletion = scrub PII fields + set `deletedAt`, never hard-delete. Booking/BookingEvent FKs keep resolving. Scrub job itself still deferred (Q-L3/Q-L4). | decided | Toygar |
| Q-D7 | How is the optional service price stored? | `priceAmount Int?` (minor units) + `priceCurrency String?`. | decided | Toygar |
| Q-D8 | Do IDs leak information? | `String @id @default(cuid())` everywhere — non-sequential, no extra dependency. | decided | Toygar |
| Q-D9 | What is the API's pagination and filtering contract? | Cursor-based: `?cursor=<opaque>&limit=<n>`, ordered by `(createdAt, id)` desc, forward-only for v1. Not implemented yet — no list route exists until M2; this is the contract it must follow. | decided | Toygar |
