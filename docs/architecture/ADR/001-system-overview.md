# ADR-001: System overview (web now, iOS later)

- Status: accepted
- Date: 2026-09-03
- Deciders: Toygar (product owner), Cursor agent
- Supersedes: —

## Context

We are building a Calendly-comfortable booking product for dietitians in Turkey.
The web client ships first, but an iOS client is a planned follow-up, so the
server boundary must not be a web-only implementation detail. We also carry a
hard constraint from `docs/legal/DATA-CLASSIFICATION.md`: no health or clinical
patient data anywhere in the system.

`docs/WAR-PLAN.md` §3 recommended Q-T1 (modular monolith with a versioned HTTP
API) and Q-T8 (evolve the API alongside the web app, freeze it before iOS).
Those recommendations were accepted on 2026-09-03.

## Decision

**One deployable modular monolith that exposes a versioned HTTP API.**

```text
apps/web (Next.js)
├── UI routes            server components + client components
└── /api/v1/*            versioned HTTP API — the only server contract

src/lib/<module>/        domain modules: availability, booking, provider,
                         notification, identity
```

Rules that follow from this:

1. **All domain behaviour lives in domain modules**, not in route handlers or
   React components. Route handlers and server actions are thin adapters.
2. **`/api/v1/*` is the contract a future iOS app consumes.** Anything the web
   UI can do, the API can do. No functionality is reachable only through a
   server action.
3. **Versioned from day one.** Breaking changes go to `/api/v2`; `v1` is frozen
   when the iOS client ships (Q-T8).
4. **Auth is token/session based at the API boundary**, so a native client can
   authenticate with the same endpoints (see ADR-004).
5. **No PHI at any layer** — schema, request bodies, logs, analytics. New fields
   are checked against `docs/legal/DATA-CLASSIFICATION.md` before they are added.
6. **Booking integrity is enforced in the database**, not in application code
   alone: unique constraint on the bookable slot plus a transaction (Q-T5).
7. **Timezone**: providers default to `Europe/Istanbul`; all instants are stored
   in UTC and rendered in the viewer's timezone.

## Consequences

**Good**

- One deploy, one repo, one migration path — appropriate for a pre-beta product.
- The iOS app is a client of an API that has already been exercised in production
  by the web app, rather than a greenfield contract.
- Domain modules give us seams to extract services later if we ever need to.

**Costs / risks**

- Discipline required: it is always faster to put logic in a route handler. Code
  review has to push back on that.
- Server actions are convenient but can bypass the API contract. We allow them
  only for UI-local concerns (form state, revalidation), never as the sole path
  to a domain operation.
- Versioning has a maintenance cost we accept in exchange for a stable mobile
  contract.

## Related

- ADR-002 (tech stack), ADR-003 (data model), ADR-004 (auth & roles)
- `docs/WAR-PLAN.md` §3, `docs/DECISIONS.md`
