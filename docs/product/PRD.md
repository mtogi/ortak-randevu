# Product Requirements Document (PRD) — MVP

> **Status:** Core booking path exists (guest + provider). **M4** smoked on www.
> Hygiene done. Owner-accepted MVP plan **2026-09-24**: audience = general hosts;
> calendar sync (Google + Microsoft) is the invite gate; Apple after iOS;
> payments parked.  
> **Related:** [VISION](./VISION.md) · [OPEN-QUESTIONS](./OPEN-QUESTIONS.md) · [DATA-CLASSIFICATION](../legal/DATA-CLASSIFICATION.md)

## 1. Problem

People in Turkey who accept appointments need a simple, trustworthy way for guests to book without messy back-and-forth messaging. Generic tools (e.g. Calendly) work but leave TR UX, KVKK-honest scheduling-only positioning, and calendar integrity as gaps we can own — without becoming a health-records product.

## 2. Goals

- Comfortable, low-friction booking for hosts and their guests
- Web MVP that can later power an iOS app via the same API
- TR default + EN language option in the header and settings
- Google + Microsoft calendar sync before collecting real users
- Explicitly **no** storage of patient health/clinical data

## 3. Non-goals (MVP)

- Marketplace / public directory / discovery (Q-P1: shareable link only)
- Clinical charts, meal-plan records, lab storage
- Payments / deposits (owner gate after web MVP + ~10–20 users + iOS parity)
- Native iOS app (until web is satisfactory)
- Apple / iCloud calendar sync (after iOS; EventKit preferred)

## 4. Personas (summary)

| Persona | Need |
| --- | --- |
| Host (provider) | Publish availability, sync calendar, share booking link, reduce no-shows |
| Guest (booker) | Book in minutes on mobile web, get clear confirmation |

## 5. MVP capabilities

1. Provider signup / login (magic link — Q-T3; optional Google sign-in — Q-T15)
2. Set weekly availability + exceptions
3. Define at least one bookable service (duration + optional price display)
4. Public booking page (shareable link — Q-P1)
5. Client selects slot → confirms with name/email/phone only (Q-P7; no PHI)
6. Confirmation notification to both parties (email first — Q-T6)
7. Provider can cancel/reschedule within simple platform defaults (Q-P6)
8. Language preference EN/TR on account
9. **Google + Microsoft calendar sync** — busy hides OPEN slots; write Ortak bookings (Q-T7)

## 6. Success metrics (draft)

- Time-to-first-booking for a new host
- Booking completion rate (slot selected → confirmed)
- No double-bookings in production (DB unique + external busy)
- % of hosts connecting a calendar before inviting guests

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| Accidental PHI collection | DATA-CLASSIFICATION + Cursor rules + schema review |
| Double booking | DB constraints + tests + external busy gate |
| Scope creep to EHR / marketplace | Hard non-goals; product rule always on |
| TR notification deliverability | Decide channels early (Q-T6) |
| Calendar OAuth / sync reliability | Separate clients from sign-in; reconnect UX |

## 8. Open dependencies

Foundational Q-P/Q-T/Q-D rows decided; Q-T7 promoted to MVP-must 2026-09-24.
Q-L3/L4 closed in M4. Guests can scrub contact fields via the manage-booking
link (2026-09-08). Visual brand follows Calendly (`docs/design/BRAND.md`).
**Next:** finish Phase 0 host copy + calendar ADR stub → foundation + Google
read-busy.

## 9. Milestones

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 Planning | Docs + WAR-PLAN §3 defaults | done 2026-09-03 |
| M1 Scaffold | Next.js app, i18n, `/api/v1/health` | done 2026-09-03 |
| M1.5 Data model | ADR-003, Prisma schema, double-book test | done 2026-09-05 |
| M2a Auth | ADR-004 + magic link + Provider identity | done 2026-09-05 |
| M2b Availability | Weekly hours → generated `Slot` rows | done 2026-09-05 |
| M2c Book + email | Public page, guest book, Resend confirm | done 2026-09-05 |
| M2.9 First deploy | Neon Frankfurt + Vercel `fra1` + Resend | done 2026-09-06 |
| M3 Provider dashboard | Own bookings, cancel/reschedule anytime, settings | done 2026-09-06 |
| M4 Private-beta hardening | KVKK delete/export + logging hygiene | done 2026-09-07 |
| Hygiene | Mobile, license, geo locale, brand, SEO, analytics | done 2026-09-19 |
| Calendar MVP | Foundation → Google → Microsoft → invite | now |
| Later | iOS when web satisfactory; Apple calendar after iOS; payments on owner gate | later |
