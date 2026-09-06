# ADR-003: Data model

- Status: accepted
- Date: 2026-09-05
- Deciders: Toygar (product owner), Cursor agent
- Supersedes: —

## Context

`docs/WAR-PLAN.md` §4 split the schema out of the M2 vertical slice (M1.5)
because a wrong slot/availability representation costs a migration on live
booking data, while a wrong booking form costs an afternoon. Nine questions
in `docs/product/OPEN-QUESTIONS.md` (Q-D1…Q-D9) were left open specifically
to be answered before writing Prisma models or a migration. This ADR answers
them, and is the schema-level enforcement of the no-PHI fence in
`docs/legal/DATA-CLASSIFICATION.md`.

Carried-in decisions this schema must satisfy: Q-T5 (DB unique constraint +
transaction prevents double booking), Q-P7 (guest booking, optional account
later), Q-P8 (small service catalog), Q-P3 (no payments in MVP, but price is
still stored), ADR-001 (timezone default `Europe/Istanbul`, all instants in
UTC).

## Decision

### Q-D1 — Provider is a person; Organization is a cheap, unused hedge

A `Provider` row is one dietitian, not a clinic. We add an `Organization`
model with a nullable `Provider.organizationId` FK now, because the
migration cost framed in the question itself ("one nullable FK now" vs. "a
painful migration later") is real and cheap. **No product behavior, auth, or
UI reads this field yet.** Multi-provider clinics stay out of scope
(`AGENTS.md` scope lock) until a `DECISIONS.md` entry says otherwise.

### Q-D2 — Slots are materialized rows, not computed

A `Slot` is a concrete `(providerId, serviceId, startAt, endAt)` row, unique
on `(providerId, startAt)`. This is deliberately the simple half of the
trade-off the question flagged: it gives Q-T5's "DB unique constraint" a
concrete thing to sit on, with no Postgres range/exclusion constraints or
`btree_gist` needed.

**Documented limitation:** the unique constraint blocks two slots starting
at the *same instant* for a provider. It does **not** stop two
differently-sized slots from partially overlapping (a 60-minute slot at
10:00 and a 30-minute slot at 10:15) — avoiding that is a slot-generation
invariant owned by the M2 availability-generation job, not a DB constraint.
If we ever need the DB to reject partial overlaps too, the upgrade path is a
Postgres exclusion constraint over a `tstzrange`, which is exactly what this
question anticipated. Not needed for M1.5: no slot-generation code ships in
this session.

### Q-D3 — Weekly hours + dated exceptions, no RRULE

`WeeklyHours` (provider-local weekday + start/end minute) plus
`AvailabilityException` (a specific date, closed or overridden hours).
Simpler than RRULE, sufficient for "a dietitian's normal week, with days
off", and side-steps RRULE's DST/recurrence-edge-case complexity around
`Europe/Istanbul`. Both are provider-level (not per-service); the M2
slot-generation job intersects them with each service's duration to produce
`Slot` rows.

### Q-D4 — Guest booker is a `Client` entity, keyed by email

Not inline fields on `Booking`. Q-P7 promises an optional account upgrade
later; a `Client` row keyed by `email` makes that an additive change
(attach an auth field) instead of a backfill out of every historical
`Booking` row.

### Q-D5 — Enum lifecycle + append-only audit table

`BookingStatus`: `CONFIRMED | CANCELLED | COMPLETED | NO_SHOW`. Every
transition is also written to `BookingEvent` (`fromStatus`, `toStatus`,
`actor`, timestamp), append-only — no update/delete path is used against it.
Cheap now, answers "what happened to this booking" later without inferring
it from `updatedAt` timestamps.

### Q-D6 — Soft delete only; KVKK deletion = scrub PII, not remove the row

`Provider` and `Client` get a nullable `deletedAt`. There is **no hard
delete** of either in this schema. A KVKK deletion request scrubs the PII
fields (`email`, `name`, `bio`/`phone`) to `null` and sets `deletedAt`; the
row itself, and every `Booking`/`BookingEvent` FK pointing at it, keeps
resolving. This is why `Booking` denormalizes `providerId`/`serviceId`
directly instead of only reaching them through `Slot` — the other party's
booking history must survive the counterpart's deletion. Actually
implementing the scrub job is still deferred per Q-L3/Q-L4; this ADR only
commits the schema to being *capable* of it without a future migration.

### Q-D7 — Price as integer minor units + currency code

`Service.priceAmount Int?` (minor units, e.g. kuruş) + `Service.priceCurrency
String?`. Both null together (free) or both set together (this invariant is
documented, not yet DB-enforced with a `CHECK` constraint — acceptable for
M1.5 since no payments code exists to violate it). Avoids a float-money
migration later even though Q-P3 has no payments in MVP.

### Q-D8 — IDs are `cuid()` strings, not sequential integers

Every model uses `String @id @default(cuid())`. Non-sequential, doesn't leak
booking/provider volume through public URLs (booking slugs, and later the
iOS API), and needs no extra dependency — it's Prisma's built-in default.

### Q-D9 — Cursor-based pagination contract for `/api/v1` list endpoints

Not a schema change, but decided here because it depends on Q-D8 and ADR-001
freezes `v1` before iOS: list endpoints take `?cursor=<opaque>&limit=<n>`,
ordered by `(createdAt, id)` descending, where the opaque cursor encodes the
last row's `(createdAt, id)` pair. Forward-only for v1 (no `previousCursor`)
— Calendly-style booking lists don't need it. Offset pagination is rejected
because rows are inserted continuously (new bookings), which drifts offsets
mid-scroll; a native client is more affected by that than a web page is.
**Not implemented yet** — no `/api/v1` list route exists until M2; this is
the contract that route must follow when it's written.

## The no-PHI fence, in schema terms

Every field below is checked against the "Allowed" table in
`docs/legal/DATA-CLASSIFICATION.md`. There is no free-text field anywhere in
this schema (no "notes", "reason for visit", or "goals" column) — the
security rule's default-deny on gray-zone fields is satisfied by simply not
adding one, not by a runtime filter.

| Model | Fields | Maps to allowed category |
| --- | --- | --- |
| `Provider` | email, name, slug, bio, timezone, locale | Account, Professional profile |
| `Client` | email, name, phone | Account (guest) |
| `Service` | title, description, durationMinutes, locationType, priceAmount, priceCurrency | Services |
| `WeeklyHours` / `AvailabilityException` | weekday/date, start/end minute, isClosed | Availability |
| `Slot` | providerId, serviceId, startAt, endAt, status | Bookings (the resource being booked) |
| `Booking` | slot/provider/service/client refs, status, meetingUrl, address | Bookings, Meeting logistics |
| `BookingEvent` | bookingId, fromStatus, toStatus, actor, createdAt | Operational audit, no PII of its own |
| `Organization` | name, slug | Account (unused hedge, Q-D1) |

Code review checklist item (already in `.cursor/rules/security.mdc`): no PR
adds a column outside this table without first updating
`DATA-CLASSIFICATION.md`.

## The double-booking constraint, concretely

Q-T5 was already decided as "DB unique constraint + transaction". This ADR
pins the exact mechanism:

- `Booking.slotId` is **not** globally unique — many `Booking` rows (mostly
  `CANCELLED`) can reference the same `Slot` over time, which is what makes
  rebooking after a cancellation possible without a schema change.
- A **partial unique index**, `booking_slot_active_unique`, allows at most
  one row with `status = 'CONFIRMED'` per `slotId`. Prisma's schema DSL
  cannot express a `WHERE` clause on an index, so `schema.prisma` only has a
  plain `@@index([slotId, status])` placeholder; the real constraint is
  hand-added to
  `prisma/migrations/20260905220605_init/migration.sql` (the officially
  documented Prisma pattern for "customizing migrations" —
  https://pris.ly/d/customizing-migrations).
- Proven by `src/lib/db/double-booking.test.ts`: two `CONFIRMED` inserts
  against the same slot — the second fails with Postgres unique-violation
  (Prisma error `P2002`) — plus a second case showing the slot becomes
  bookable again once the first booking is `CANCELLED`.

## Consequences

**Good**

- The one artifact this whole session exists to protect — "can two people
  book the same appointment" — is enforced by Postgres, not application
  code, and is proven by a real test against a real (if throwaway) Postgres.
- Every Q-D1…Q-D9 answer is traceable to a specific model/field/index, not
  just prose.
- No UI, auth, or booking-flow code was added — M1.5 stayed inside its gate.

**Costs / risks**

- The partial unique index lives outside `schema.prisma`'s declarative view.
  Anyone running `prisma migrate dev` after editing `Booking` must not let
  Prisma "fix" the index back to a plain one — check the diff before
  applying. This is called out both in `schema.prisma` and in this ADR.
- Q-D2's documented limitation (no partial-overlap protection for
  differently-sized slots) is a real gap until the M2 slot-generation job
  exists to guarantee grid alignment. Tracked here, not silently assumed.
- Local/CI testing uses `embedded-postgres` (downloads a real Postgres binary
  via npm's per-platform optional dependencies) instead of Docker, because
  neither Docker nor Homebrew were available in this environment.
  **Verified on GitHub Actions `ubuntu-latest` on 2026-09-05** (run
  `34003266541`, the first CI run to reach `npm test` — earlier runs were
  stopped by an unrelated `format:check` failure).
- `Organization` (Q-D1) is schema weight with zero behavior. If multi-tenant
  clinics never happen, it's a small amount of permanent dead weight; if they
  do, it saved a migration. Accepted trade either way.

## Related

- ADR-001 (system overview), ADR-002 (tech stack)
- `docs/product/OPEN-QUESTIONS.md` Q-D1…Q-D9, Q-T5
- `docs/legal/DATA-CLASSIFICATION.md`
- `prisma/schema.prisma`, `prisma/migrations/20260905220605_init/migration.sql`
- `src/lib/db/double-booking.test.ts`
