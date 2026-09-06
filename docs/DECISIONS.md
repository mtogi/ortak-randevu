# Decision Log

Dated product/tech decisions that are too small for a full ADR, or pointers to ADRs.

| Date | Decision | Rationale | Links |
| --- | --- | --- | --- |
| 2026-09-02 | v1 vertical = dietitians in Turkey only | Focus; expand professions later | PRD / VISION |
| 2026-09-02 | EN default UI; TR via user settings | Main language English; TR optional anytime | Q-T9, ADR-004 |
| 2026-09-02 | No storage of patient health/clinical data | Platform is scheduling, not EHR; reduces risk | DATA-CLASSIFICATION |
| 2026-09-02 | Web first; iOS later; design API for mobile | Delivery order | ADR-001 (TBD) |
| 2026-09-02 | Calendly as UX reference for booking comfort | Familiar, low-friction scheduling | COMPETITORS |
| 2026-09-03 | Encode token/context efficiency in Cursor rules | Avoid repeating usage guidance every prompt; separate chat context % vs plan % | `.cursor/rules/token-efficiency.mdc`, `docs/process/TOKEN-EFFICIENCY.md` |
| 2026-09-03 | MVP defaults proposed in WAR-PLAN §3 | Unblock build after one accept/override in IDE | `docs/WAR-PLAN.md` |
| 2026-09-03 | **WAR-PLAN §3 defaults accepted as-is — no overrides.** Q-P1…Q-P8, Q-T1…Q-T8, Q-L1/L2, Q-X1/X2 all move to `decided` | Defaults are a coherent Calendly-like MVP; overriding any of them would have cost scope without changing the first slice | `docs/WAR-PLAN.md` §3, OPEN-QUESTIONS |
| 2026-09-03 | Modular monolith with versioned `/api/v1` HTTP API as the only server contract | Web ships first but iOS must reuse the contract; domain logic stays out of route handlers | ADR-001 |
| 2026-09-03 | Stack: Next.js (App Router) + TypeScript + Tailwind + Postgres/Prisma + Auth.js magic link + next-intl + Resend, on Vercel `fra1` / Neon EU | Q-T2 confirmed; boring, EU-resident, well-supported in Cursor | ADR-002 |
| 2026-09-03 | Scaffold (M1) ships without Prisma/Auth.js/Resend wired | Keeps `npm run dev` working with no database or API keys; those land with the M2 vertical slice | ADR-002 §Scaffold scope |
| 2026-09-03 | Locale via cookie, not URL prefix, for now | Keeps public booking links short; revisit under Q-T9 if SEO needs it | OPEN-QUESTIONS Q-T9 |
| 2026-09-03 | Split **M1.5 (data model + schema)** out of the M2 vertical slice; schema lands before any booking UI | The schema is the least reversible artifact we own — a wrong slot/availability representation costs a migration on live bookings, while a wrong form costs an afternoon | WAR-PLAN §4, ADR-003, OPEN-QUESTIONS Q-D1…Q-D9 |
| 2026-09-05 | **Q-D1…Q-D9 decided** (provider=person + unused Organization hedge; materialized Slot rows; weekly hours + exceptions, no RRULE; Client entity for guests; enum lifecycle + append-only BookingEvent; soft delete + PII-scrub only, no hard delete; integer minor-unit price + currency; cuid string IDs; cursor pagination for `/api/v1` lists) | Answers needed before any migration existed; full rationale per question is in ADR-003, not duplicated here | ADR-003, OPEN-QUESTIONS Q-D1…Q-D9 |
| 2026-09-05 | **ADR-003 accepted.** Prisma schema + first migration (`prisma/migrations/20260905220605_init`) added; double-booking prevented by a hand-added partial unique index (`booking_slot_active_unique`, CONFIRMED-only) since Prisma's DSL can't express partial indexes | Q-T5's "DB unique constraint" needed a concrete implementation; partial (not plain) unique index is required so a cancelled booking frees the slot for rebooking | ADR-003, `prisma/schema.prisma` |
| 2026-09-05 | Local/CI Postgres for migrations and tests uses `embedded-postgres` (npm-distributed real Postgres binary, no Docker/Homebrew) rather than a hosted or containerized DB | Docker and Homebrew were unavailable in the dev environment; `embedded-postgres` resolves a platform binary via npm's optionalDependencies, works the same way in GitHub Actions' `ubuntu-latest` | `src/lib/db/test/local-postgres.ts`, ADR-003 consequences (CI not yet verified — see SESSION-HANDOFF) |
| 2026-09-05 | Prisma pinned to **6.19.3** (not the newer 7.x line) | Prisma 7 removed schema-file `datasource.url` in favor of `prisma.config.ts` + driver adapters; 6.x keeps the classic, boring, widely-documented config ADR-002 expects | ADR-002, ADR-003, `package.json` |
| 2026-09-05 | Split original M2 into **M2a (auth + identity)** then M2b (availability/slots) then M2c (public book + email) | One chat cannot honestly ship Auth.js + slot generation + public booking + Resend; token-efficiency prefers one vertical concern per session | WAR-PLAN §4, ADR-004 |
| 2026-09-05 | **ADR-004 accepted.** Auth.js v5 (`next-auth@5.0.0-beta.32`) email magic link; Prisma adapter tables additive; first verified login creates/links `Provider` by email; JWT sessions; `GET /api/v1/me` | Q-T3 implementation; domain logic in `src/lib/identity/`; no Resend in this slice | ADR-004 |
| 2026-09-05 | Public booking URL is `/book/[providerSlug]` | Avoids slug collisions with reserved app routes (`api`, `login`, `me`, `settings`) | Q-T10, ADR-004 |
| 2026-09-05 | Locale stays cookie-based (no `/en`/`/tr` prefix); Q-T9 closed | Short booking links; revisit only if SEO needs localized URLs | Q-T9 |
| 2026-09-05 | Materialize slots **56 days** ahead; regenerate on weekly hours / exception change | Bounds M2b job size; enough horizon for dietitian booking | Q-T11, Q-D2 |
| 2026-09-05 | Slot grid is **15 minutes**; service duration must be a multiple of 15 | Matches weekly-hours UI; typical 30/45/60 consults | Q-T12 |
| 2026-09-05 | No inter-booking buffers in M2b (slot = service duration) | Keeps generator simple; buffers are a later product add | Q-T13 |
| 2026-09-05 | Q-P6 numbers: guest cancel/reschedule until 24h before start; provider anytime | Fills “simple platform defaults”; no per-provider policy UI in M2 | Q-P6 |
| 2026-09-05 | Do not wait on Resend for M2b; wire Resend once in M2c for booking email **and** magic links | One mail vendor; M2b can ship without production email | Q-T14, Q-T6 |
| 2026-09-05 | Google OAuth is an optional second sign-in, not a replacement for magic link; implement after availability when Google credentials exist | Keeps Q-T3; Auth.js already has Account table for extra providers | Q-T15, ADR-004 |
| 2026-09-05 | **ADR-005 accepted.** Public `/book/[providerSlug]` + guest name/email/phone, cancel/reschedule at `/bookings/[bookingId]`, mirrored by `/api/v1/public/*` | M2c: gives the M2b slot rows a consumer without touching the ADR-003 schema or the `booking_slot_active_unique` index | ADR-005, Q-P7, Q-T10 |
| 2026-09-05 | Guest access to their own booking is a **stateless HMAC capability token** (`AUTH_SECRET` over the booking id) in the link, not a token column and not a login | Q-P7 forbids requiring an account, and this slice must not migrate the schema; rotating `AUTH_SECRET` invalidating old links is the accepted cost | ADR-005, `src/lib/booking/token.ts` |
| 2026-09-05 | Guest booking management sits at `/bookings/[bookingId]`, not `/book/manage/...` | A static segment under `/book/` would permanently shadow a dietitian whose slug is `manage` | ADR-005 |
| 2026-09-05 | Q-P6 implemented as a platform constant (24h, inclusive deadline), enforced server-side; booking or rescheduling *into* a <24h slot stays allowed | No per-provider policy engine in M2; blocking last-minute bookings would cost real bookings to protect a change-only rule | Q-P6, ADR-005 |
| 2026-09-05 | Cancel returns the slot to `OPEN`; reschedule moves `Booking.slotId` in place and stays `CONFIRMED` with a `CONFIRMED → CONFIRMED` `BookingEvent` | Keeps the audit thread between the old and new time instead of a cancel/rebook pair | Q-D5, ADR-005 |
| 2026-09-05 | **Q-T14 implemented:** Resend called over its REST API (no SDK dependency), SMTP kept as fallback, magic links routed through the same sender; booking mail is best-effort and never rolls back a booking | One vendor and one verified domain; a lost email is recoverable, a lost booking is not | Q-T14, ADR-005, `src/lib/mail/**` |
| 2026-09-05 | `src/i18n/request.ts` honors an explicitly requested locale, so each email renders in its own recipient's language (guest cookie locale, provider `Provider.locale`) | Notification copy must not inherit the locale of whoever triggered the request | ADR-005 |

<!-- Add rows as decisions close. Prefer YYYY-MM-DD. -->
