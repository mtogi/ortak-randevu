# Product Requirements Document (PRD) — MVP

> **Status:** Stub — expand when the first real booking flow exists. Foundational product questions (Q-P1–P8) are **decided**.  
> **Related:** [VISION](./VISION.md) · [OPEN-QUESTIONS](./OPEN-QUESTIONS.md) · [DATA-CLASSIFICATION](../legal/DATA-CLASSIFICATION.md)

## 1. Problem

Dietitians in Turkey need a simple, trustworthy way for clients to book appointments without messy back-and-forth messaging. Generic tools (e.g. Calendly) work but are not tailored to professional practice needs we will grow into carefully — without becoming a health-records product.

## 2. Goals

- Comfortable, low-friction booking for dietitians and their clients
- Web MVP that can later power an iOS app via the same API
- EN default + TR language option in settings
- Explicitly **no** storage of patient health/clinical data

## 3. Non-goals (MVP)

- Multi-profession marketplace
- Clinical charts, meal-plan records, lab storage
- Native iOS app
- Public directory / discovery (Q-P1: shareable link only)

## 4. Personas (summary)

| Persona | Need |
| --- | --- |
| Dietitian (provider) | Publish availability, share booking link, reduce no-shows |
| Client (booker) | Book in minutes on mobile web, get clear confirmation |

## 5. MVP capabilities (draft — refine after open questions)

1. Provider signup / login (magic link — Q-T3)
2. Set weekly availability + exceptions
3. Define at least one bookable service (duration + optional price display)
4. Public booking page (shareable link — Q-P1)
5. Client selects slot → confirms with name/email/phone only (Q-P7; no PHI)
6. Confirmation notification to both parties (email first — Q-T6)
7. Provider can cancel/reschedule within simple platform defaults (Q-P6)
8. Language preference EN/TR on account

## 6. Success metrics (draft)

- Time-to-first-booking for a new provider
- Booking completion rate (slot selected → confirmed)
- No double-bookings in production
- % of providers enabling TR locale

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| Accidental PHI collection | DATA-CLASSIFICATION + Cursor rules + schema review |
| Double booking | DB constraints + tests |
| Scope creep to EHR | Hard non-goals; product rule always on |
| TR notification deliverability | Decide channels early (Q-T6) |

## 8. Open dependencies

Still open: [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md) **Q-T9** (cookie locale;
revisit only for SEO). **Q-T10** is decided (`/book/[providerSlug]`).
Q-P/Q-T/Q-D foundational rows are decided; Q-L3/L4 remain deferred until
pre-beta.

## 9. Milestones

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 Planning | Docs + WAR-PLAN §3 defaults | done 2026-09-03 |
| M1 Scaffold | Next.js app, i18n, `/api/v1/health` | done 2026-09-03 |
| M1.5 Data model | ADR-003, Prisma schema, double-book test | done 2026-09-05 |
| M2a Auth | ADR-004 + magic link + Provider identity | done 2026-09-05 |
| M2b Availability | Weekly hours → generated `Slot` rows | **next** |
| M2c Book + email | Public page, guest book, Resend confirm | planned |
| M3 Private beta | Friendly dietitians complete real bookings | later |
| Later | iOS on frozen `v1`; other professions | later |
