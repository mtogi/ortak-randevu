# Privacy notes (KVKK) — outline, not lawyer copy

> This is an engineering/product outline so private-beta delete/export can
> ship honestly. It is **not** a privacy policy, ToS, or legal advice. Final
> public copy needs a lawyer before a public launch.

Related: [DATA-CLASSIFICATION.md](./DATA-CLASSIFICATION.md) (what we may store),
ADR-003 Q-D6 (soft delete), ADR-005 (guest links), [DECISIONS.md](../DECISIONS.md)
(Q-L3 / Q-L4).

## What we store

Only the **Allowed** table in DATA-CLASSIFICATION: account/profile, availability,
services, booking who/when/service/status, optional meeting URL/address.
No diagnoses, labs, measurements, medications, allergies, clinical notes, or
gray-zone “reason for visit” / goals fields.

Guests book with **name + email + phone** only (Q-P7). They have **no account**.
They can remove those contact fields through the existing manage-booking
capability link (same Q-D6 `Client` scrub as provider delete).

## Roles (working assumption)

The platform operator is the controller of account and booking PII needed to
run scheduling. Dietitians use the product to receive bookings; they can
export the contact details of people who booked with them.

## Subject rights in this product (M4)

| Right | Who | How |
| --- | --- | --- |
| Access / export | Signed-in **provider** | Settings → download JSON, or `GET /api/v1/me/export`. Own profile + booking operational data (who/when/service/status/events). Not clinical — we do not have it. |
| Erasure | Signed-in **provider** | Settings → delete account, or `DELETE /api/v1/me`. **No hard delete** of `Provider`/`Client`/`Booking` rows (Q-D6). PII fields are set to null; `deletedAt` is set. Bookings stay so the other party’s link still resolves. |
| Erasure | **Guest** | No guest account (Q-P7). Manage-booking link (`/bookings/[id]?t=`) → remove name/email/phone. Same Q-D6 `scrubClientRecord` as tests/provider-side Client scrub. Booking rows stay so the dietitian still sees the appointment. Not gated by the 24h cancel window. |
| Login after delete | Former provider | The scrubbed row is not revived. The same email may create a **new** `Provider` later (new slug). |

## Retention (Q-L4, private beta)

- **PII:** removed immediately on provider delete (email, name, bio → null).
  Guest contact fields are removed when the guest uses manage-link erasure
  (or if that `Client` is otherwise scrubbed).
- **Operational booking rows** (`Booking`, `BookingEvent`, slot times, service
  title, status): kept so FKs resolve. **No calendar purge job in M4.**
- **Candidate for public launch (not implemented):** drop or further-anonymize
  operational booking rows **24 months after the appointment end**. Revisit
  with counsel; do not build a policy engine now.

Auth.js `User` / session / verification-token rows for the deleted email are
removed as part of provider delete (credential storage, not booking history).

## Logging

**We control (application logs):**

- Do not log full request URLs that carry `?t=` (guest manage HMAC) or Auth.js
  magic-link `token` query params.
- Do not log email/phone/name when a booking id or subject line is enough.
- `next.config.ts` `logging.incomingRequests.ignore` skips `/api/auth`,
  `/bookings`, and `/api/v1/public/bookings` in **Next.js process stdout**.
- `src/lib/log/redact.ts` redacts those query keys if we must print a URL.
- Mail helper logs subject + transport, never the recipient address.
- Local dev **without** mail still prints the magic-link URL so sign-in works;
  production with Resend never does.

**We do not control (Vercel / CDN / browser):**

- Vercel request/access logs typically include **path + query string**. There
  is no supported way in this stack to strip `?t=` or `token=` from those
  platform logs. Same for browser history, Referer headers, and email clients
  that store the manage link.
- Neon backups/PITR retain database pages until the provider’s window expires
  — a scrubbed row is gone from the primary, but a restore could resurrect it
  for that window. Not a product toggle.

Treat guest `?t=` and magic-link tokens as **secrets**. Rotating `AUTH_SECRET`
invalidates both sessions and outstanding manage links — **Edit** env values;
never **Rotate** `AUTH_SECRET` casually.

## Consent UX (booking)

The public form states we only ask for name, email, and phone so the dietitian
can reach the guest, and not to send health information. That is the MVP
notice; it is not a full KVKK disclosure.

## Explicitly out of this outline

Final privacy policy / ToS wording, cookie banner legal text, DPA, DPIA,
and processor list.
