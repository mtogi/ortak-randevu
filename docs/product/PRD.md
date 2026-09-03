# Product Requirements Document (PRD) — MVP

> **Status:** Stub — expand in next planning session.  
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
- (Pending Q-P1) Full public directory / discovery — TBD

## 4. Personas (summary)

| Persona | Need |
| --- | --- |
| Dietitian (provider) | Publish availability, share booking link, reduce no-shows |
| Client (booker) | Book in minutes on mobile web, get clear confirmation |

## 5. MVP capabilities (draft — refine after open questions)

1. Provider signup / login
2. Set weekly availability + exceptions
3. Define at least one bookable service (duration ± price display TBD)
4. Public booking page (shareable link)
5. Client selects slot → confirms with allowed contact fields only
6. Confirmation notification to both parties
7. Provider can cancel/reschedule within agreed rules (TBD)
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

All `open` items in [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md) especially Q-P1–P3, Q-T1–T2.

## 9. Milestones

| Milestone | Outcome |
| --- | --- |
| M0 Planning | Docs + decisions closed for stack & booking model |
| M1 Vertical slice | One provider can receive a real booking end-to-end |
| M2 Private beta | TR dietitians testing; EN/TR; basic ops |
| M3 Public web MVP | Polish, legal outlines live, analytics |
| Later | iOS; other professions |
