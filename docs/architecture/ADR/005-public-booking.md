# ADR-005: Public guest booking and transactional email

- Status: accepted
- Date: 2026-09-05
- Deciders: Toygar (product owner), Cursor agent
- Supersedes: —

## Context

M2a shipped provider identity, M2b materialized `Slot` rows from weekly hours
and exceptions. M2c is the half a dietitian actually shares with a client: a
public page at `/book/[providerSlug]` (Q-T10) where a guest picks one of those
OPEN slots and leaves name + email + phone (Q-P7), plus the 24-hour
cancel/reschedule window (Q-P6) and Resend as the single mail vendor for
booking mail *and* magic links (Q-T14).

Constraints carried in: the ADR-003 schema and the `booking_slot_active_unique`
partial index are not to be redesigned; no marketplace; no Google sign-in
(Q-T15, later).

The question this slice has to answer that no earlier ADR did: **how does an
account-less guest come back to their own booking?**

## Decision

### Guest authorization is a stateless capability token, not a session

Q-P7 promises booking without an account, and Q-P6 promises the guest can
cancel or reschedule. The management link therefore carries a capability:

```
/bookings/<bookingId>?t=base64url(HMAC-SHA256(AUTH_SECRET, "booking-manage:" + bookingId))
```

Rejected alternatives: a random token column on `Booking` (a schema change
this slice was told not to make), and forcing guests to sign in (deletes the
Q-P7 comfort promise). The HMAC needs no column and no lookup table, and
`verifyManageBookingToken` compares in constant time.

The token is minted in `src/lib/booking/token.ts` and verified inside the
domain module (`getGuestBooking`, and again inside cancel/reschedule) rather
than only at the route edge, so no future caller can skip the check. A wrong
or missing token is reported as **404, not 403**, so the endpoint cannot be
used to probe which booking ids exist.

### Management lives at `/bookings/[bookingId]`, outside `/book/`

`/book/manage/...` would have put a static segment inside the slug namespace,
permanently shadowing any dietitian whose slug is `manage`. A sibling
top-level route avoids that entirely; `book` is already in the reserved-slug
set from ADR-004.

### Booking integrity: three layers, none of them the browser

Q-T5 is enforced server-side only:

1. Inside a transaction, the slot is claimed with a compare-and-set —
   `updateMany({ where: { id, status: "OPEN" }, data: { status: "BOOKED" } })`
   — and a count other than 1 means someone else won the race.
2. The slot's `startAt` is re-checked against the server's `now`, so a stale
   page or a manipulated client clock cannot book a past slot.
3. `booking_slot_active_unique` (ADR-003) is the backstop: a lost race
   surfaces as Prisma `P2002`, which is translated to the same
   `SlotUnavailableError` → HTTP 409.

Marking the slot `BOOKED` also protects it from M2b's regeneration job, which
deletes future **OPEN** slots only.

- **Cancel** sets `CANCELLED` + `cancelledAt` and returns the slot to `OPEN`,
  which is exactly the case the partial index was designed for: the slot
  becomes bookable again without a schema change.
- **Reschedule** moves `Booking.slotId` to another OPEN slot of the same
  service and stays `CONFIRMED`, appending a `CONFIRMED → CONFIRMED`
  `BookingEvent` (Q-D5). A cancel/rebook pair would have been simpler but
  would break the thread between the two appointments in the audit trail.

### Q-P6 is a platform constant, not a policy engine

`GUEST_MODIFY_CUTOFF_HOURS = 24`, applied to the booking's start instant.
Providers are not bound by it — their surface arrives in M3. Two deliberate
edges:

- The deadline is inclusive (`now <= start - 24h` passes).
- A guest may still *book* a slot less than 24 hours out, and may reschedule
  *into* one. They simply cannot change it online afterwards. Blocking that
  would remove real last-minute bookings to protect a rule that only governs
  changes.

### Q-T14 — Resend over REST, SMTP kept as a fallback

`src/lib/mail/send.ts` picks Resend when `RESEND_API_KEY` is set, otherwise
SMTP (`AUTH_EMAIL_SERVER`), otherwise it logs in development and throws in
production. Resend is called with `fetch` against its REST API instead of
adding the `resend` SDK — one endpoint, no new dependency, no lock-in.

Magic links now go through the same sender, so there is one domain to verify.
Local dev without any transport still prints the magic link to the server log,
never the address.

**Mail is best-effort.** `notifyBooking` catches and logs; a confirmed booking
is never rolled back, and the guest is never shown an error, because the
redirect hands them the management link directly. A lost email is
recoverable, a lost booking is not.

Copy lives in `messages/{en,tr}.json` under `email.*`. Each recipient is
rendered in their own locale — the guest's cookie locale, the provider's
stored `Provider.locale` — which is why `src/i18n/request.ts` now honors an
explicitly requested locale instead of always reading the cookie.

### The no-PHI fence at the form

The guest form has exactly three inputs: name, email, phone. No notes, no
"reason for visit", no goals — the gray-zone list in
`docs/legal/DATA-CLASSIFICATION.md` is enforced by the field simply not
existing, and the page says so in the privacy note.

Public read DTOs (`getPublicProviderPage`, the `/api/v1/public/*` responses)
omit the provider's email address; only the guest's own contact details come
back, behind their token.

A returning guest whose data was previously scrubbed (Q-D6) reuses their
`Client` row with `deletedAt` cleared: `email` is unique, and a fresh booking
is fresh consent to be contacted about it.

### API surface

Pages are thin; the domain module is the contract, mirrored under
`/api/v1/public/` for the future iOS client (ADR-001):

| Route | Purpose |
| --- | --- |
| `GET /api/v1/public/providers/[providerSlug]` | Profile + active services |
| `GET /api/v1/public/providers/[providerSlug]/slots?serviceId=` | OPEN slots, `(startAt, id)` cursor per Q-D9 |
| `POST /api/v1/public/bookings` | Create; returns the booking, its token, and its manage path |
| `GET/POST /api/v1/public/bookings/[bookingId](/cancel\|/reschedule)` | Read / cancel / move, `?token=` |

## Consequences

**Good**

- A dietitian can share one link and receive real bookings; the M2b slot rows
  finally have a consumer.
- Double booking is provably impossible through the guest path, not just at
  the table level: `src/lib/booking/booking.test.ts` books, races two
  parallel bookings, cancels, rebooks, reschedules, and asserts the 24-hour
  refusal against a real Postgres.
- No migration, and the ADR-003 partial index is untouched.
- One mail vendor for both message types, with copy in both languages.

**Costs / risks**

- Rotating `AUTH_SECRET` invalidates every outstanding management link (and,
  as before, every session). Individual links cannot be revoked, and anyone
  holding the URL holds the capability — acceptable for a booking that
  contains no health data, and the same property Calendly-style links have.
- The management link travels in email and in a redirect URL, so it can land
  in browser history and server access logs. Logging hygiene before public
  beta (M4) should treat `?t=` as a secret.
- The public page renders the first 60 open slots with no "load more" control,
  even though the API is paginated. Fine for a 56-day horizon at typical
  consult lengths; needs UI work if a provider has very short services.
- Provider-side cancel/reschedule, provider notification preferences, and
  `COMPLETED`/`NO_SHOW` transitions are still unbuilt (M3).
- Resend delivery has not been verified against the live API — no key exists
  in this environment yet; only the transport-selection and template paths
  were exercised.

## Related

- ADR-001 (system overview), ADR-003 (data model), ADR-004 (auth & roles)
- `docs/product/OPEN-QUESTIONS.md` Q-P6, Q-P7, Q-T5, Q-T6, Q-T10, Q-T14
- `docs/legal/DATA-CLASSIFICATION.md`
- `src/lib/booking/**`, `src/lib/mail/**`, `src/app/book/[providerSlug]/**`,
  `src/app/bookings/[bookingId]/**`, `src/app/api/v1/public/**`
