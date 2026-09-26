# ADR-009: Calendar sync (Google + Microsoft)

- Status: accepted (foundation + Google read-busy implemented; write-back + Microsoft deferred)
- Date: 2026-09-26
- Deciders: Toygar (product owner), Cursor agent
- Relates: Q-T7 (DECISIONS 2026-09-24), ADR-003 (`booking_slot_active_unique`), ADR-004 (Auth.js login ≠ calendar OAuth)

## Context

Owner accepted that **calendar sync is an MVP gate** before inviting real
users: hosts must connect an external calendar so busy time hides OPEN slots
and Ortak bookings write back out. Scope for the **web MVP** is **Google
Calendar** and **Microsoft** (Outlook / Graph) only. **Apple / iCloud** ships
**after the iOS app** (EventKit preferred); it is not a web-MVP gate.

Constraints carried in:

- Keep the ADR-003 schema fence and the partial unique index
  `booking_slot_active_unique` on `Booking(slotId) WHERE status = 'CONFIRMED'`
- Auth.js already supports optional Google **sign-in** (Q-T15); calendar
  connect must not overload those login scopes or that OAuth client
- No PHI; outbound event content stays scheduling-minimal
- No marketplace, payments, or Apple CalDAV in this ADR’s MVP path

## Decision

### Providers in scope

| Provider | Web MVP | Notes |
| --- | --- | --- |
| Google Calendar | **Yes** | First implementation slice (read-busy, then write) |
| Microsoft Graph / Outlook | **Yes** | Same busy + write contract as Google |
| Apple / iCloud | **After iOS** | Prefer EventKit on native; not CalDAV-on-web as a gate |

### Sync direction (MVP)

- **Read busy:** external busy/free intervals intersect our OPEN `Slot` rows;
  overlapping OPEN slots are not offered for booking
- **Write bookings:** create / update / delete calendar events when an Ortak
  booking is confirmed, cancelled, or rescheduled
- **Not in MVP:** two-way edit of arbitrary external events; importing foreign
  events as Ortak bookings

### Integrity

1. Busy filtering happens **before** booking create (slot must still be OPEN
   and not busy-overlapped at decision time)
2. `booking_slot_active_unique` remains the DB backstop for concurrent
   CONFIRMED claims — calendar sync must not remove or weaken that index
3. Disconnect / revoke clears stored tokens and derived busy blocks so ghost
   busy cannot permanently hide slots

### OAuth separation

Calendar OAuth clients, redirect URIs, and scopes are **separate** from
Auth.js magic-link / Google **login**. Sign-in does not imply calendar
grants; calendar connect is an explicit host action (settings / calendars UI
in a later slice). Exact scopes are documented when ENV secrets are added
(prefer minimal calendar read/write; never piggyback login scopes).

### Sequencing (implementation — out of this ADR’s code)

1. Shared foundation (connections, encrypted tokens, busy model, slot ∩ busy) — **done**
2. Google read-busy — **done** (this slice); Google write-back — next
3. Microsoft (same adapters)
4. Hardening + invite readiness
5. Apple only after iOS

### Implementation notes (Google read-busy)

- Models: `CalendarConnection`, `CalendarBusyBlock`; enum `CalendarKind.GOOGLE`
- ENV: `GOOGLE_CALENDAR_CLIENT_ID` / `_SECRET`, optional `CALENDAR_TOKEN_ENCRYPTION_KEY`
- Scope: `https://www.googleapis.com/auth/calendar.freebusy` (+ `openid`)
- Settings connect/disconnect/sync; public `listOpenSlots` + book/reschedule refuse busy overlaps
- `booking_slot_active_unique` unchanged
- RUNBOOK §8 for Cloud Console steps

## Consequences

- Phase 1+ engineering can implement against this contract without reopening
  audience or Apple timing
- PRIVACY-NOTES / ENV will need refresh tokens, busy intervals, and external
  event ids when code lands (not in this stub)
- Hosts without Google or Microsoft remain bookable on Ortak-only hours until
  they connect; invites still wait on sync working for the cohort that needs it

## Out of scope (this ADR)

- Schema migrations, OAuth UI, webhook/job code
- Apple CalDAV or EventKit implementation
- Payments, marketplace, SMS
