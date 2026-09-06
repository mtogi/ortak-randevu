# Runbook — first deploy (Neon + Vercel + Resend)

Hosting targets were fixed in [ADR-002](../architecture/ADR/002-tech-stack.md):
**Vercel `fra1`** + **Neon Postgres (EU / Frankfurt)** + **Resend**, for EU
residency (Q-T4). Variable meanings live in
[ENV.md](../architecture/ENV.md) — this file is the ordered "do this" list.

**Goal of this pass:** a real dietitian account on a real URL takes a real
guest booking and both parties get a real email. That is the Q-X1 private-beta
bar.

## 0. Before you start

You need three accounts (all have free tiers that fit this stage) and one
domain you control DNS for:

| Account | Used for | Free tier note |
| --- | --- | --- |
| [Neon](https://neon.tech) | Postgres, EU Frankfurt | Free project is enough; it sleeps when idle |
| [Vercel](https://vercel.com) | Hosting the Next.js app | Hobby is fine until you have paying users |
| [Resend](https://resend.com) | Booking mail + magic links | 100 mails/day free, needs a verified domain |

**Secrets rule:** every value below goes into the Neon/Vercel/Resend
dashboards. Do **not** paste keys or connection strings into chat, a commit,
or `.env.example` — see `.cursor/rules/security.mdc`. When you're done, just
tell me *which* variables are set and I'll wire the rest.

---

## 1. Neon — create the database

1. Create a new project. **Region: AWS `eu-central-1` (Frankfurt).** This is
   the Q-T4 residency choice; it cannot be changed later without a data move.
2. Name the database something like `ortak_randevu`.
3. From the connection widget, copy **both** strings — they are different and
   you need both:
   - **Pooled** (host contains `-pooler`) → this becomes `DATABASE_URL` in
     Vercel. Serverless functions open many short-lived connections, so
     runtime must go through the pooler.
   - **Direct / unpooled** (no `-pooler`) → used only to run migrations.
     `prisma migrate deploy` takes an advisory lock, which pooled connections
     can drop.
4. Make sure both end with `?sslmode=require`.

### Apply the schema

Run this **from your laptop**, once, with the *direct* string:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
DATABASE_URL="<direct-neon-url>" npm run db:migrate:deploy
```

Expect it to apply `20260905220605_init` and `20260905223800_authjs`. Verify
the double-booking guard survived the trip:

```bash
DATABASE_URL="<direct-neon-url>" npx prisma db execute \
  --stdin <<< "select indexdef from pg_indexes where indexname = 'booking_slot_active_unique';"
```

That partial unique index is the thing standing between you and two clients
in the same appointment ([ADR-003](../architecture/ADR/003-data-model.md)).
If it is missing, stop and tell me — do not take bookings.

> Migrations are **not** run by CI or by the Vercel build. They are a
> deliberate manual step for now, because `prisma migrate deploy` against a
> live database is not something a push should trigger silently.

---

## 2. Resend — verify a sending domain

1. Add your domain (e.g. `ortakrandevu.com`) under **Domains**. Pick the **EU
   region** for sending if offered.
2. Resend shows DKIM/SPF records. Add them at your DNS provider. Verification
   is usually minutes but can take a few hours.
3. Wait for the domain to show **Verified**. Mail from an unverified domain
   is rejected, and the app treats a rejection as a failed send.
4. Create an **API key** (send-only is enough) → this becomes
   `RESEND_API_KEY`.
5. Decide the from-address, e.g. `Ortak Randevu <no-reply@ortakrandevu.com>`
   → this becomes `EMAIL_FROM`. The domain part **must** be the verified
   domain.

Until the domain verifies you can still deploy: with no `RESEND_API_KEY` set,
production refuses to send rather than pretending
([ADR-005](../architecture/ADR/005-public-booking.md)), so bookings will work
but nobody gets email.

---

## 3. Vercel — import and configure

1. **Add New → Project → Import** `mtogi/ortak-randevu`. Framework
   auto-detects as Next.js; leave build/install commands at their defaults
   (`postinstall` already runs `prisma generate`).
2. **Settings → Functions → Region: `fra1` (Frankfurt).** Same residency
   reason as Neon, and it keeps the app next to its database.
3. **Settings → Environment Variables.** Set these for **Production** (and
   Preview, if you want previews to work):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the **pooled** Neon string from step 1 |
| `AUTH_SECRET` | output of `npx auth secret` — generate once, then leave it alone |
| `APP_URL` | your production origin, e.g. `https://ortakrandevu.com` (no trailing slash) |
| `RESEND_API_KEY` | from step 2 |
| `EMAIL_FROM` | from step 2 |

   Do **not** set `AUTH_EMAIL_SERVER` — it is the SMTP fallback and would
   take precedence away from Resend only if Resend's key is missing.

4. Deploy. Then add your custom domain under **Settings → Domains** and make
   `APP_URL` match it exactly.

### Why `AUTH_SECRET` is load-bearing

It signs sessions **and** the HMAC in every guest booking-management link
(ADR-005). Rotating it silently breaks every `?t=` link already sitting in a
client's inbox. Generate it once, store it in your password manager, and treat
rotation as an incident with a plan, not routine hygiene.

---

## 4. Smoke test the deployment

Do this in a real browser, in this order. You need two email addresses: one
"dietitian", one "client".

1. `GET /api/v1/health` returns ok.
2. `/login` → enter the dietitian address → the magic link **arrives by
   email** (not just in logs). Click it; you land on `/me`.
3. `/me/availability` → add a service (e.g. 30 min) and weekly hours → the
   upcoming-slots list fills in.
4. Copy the public booking path from `/me` and open it in a **private
   window** (you must not be signed in).
5. Book a slot as the client address. You should land on the management page
   *and* both mailboxes should receive mail — client confirmation, provider
   notification.
6. From the emailed link, **reschedule**, then **cancel**. Check that the
   cancelled time reappears on the public page.
7. Switch the language to Turkish and re-check the booking page and one
   email.

If any step fails, capture the Vercel function log for that request before
retrying — the mail path logs failures without the recipient address, so the
log is safe to share.

---

## 5. Rollback and recovery

| Situation | Action |
| --- | --- |
| Bad deploy (code) | Vercel → Deployments → previous good one → **Promote to Production**. Instant, no rebuild. |
| Bad migration | There is **no down migration**. Restore from Neon's point-in-time branch, then fix forward. Take a Neon branch before any future migration that drops or rewrites a column. |
| Mail broken | Bookings keep working by design (mail is best-effort). Check Resend's dashboard for bounces/domain status before touching code. |
| Suspected leaked `AUTH_SECRET` | Rotate it, accept that outstanding booking links die, and tell affected clients to rebook. Sessions all sign out. |
| Suspected leaked DB URL | Reset the Neon role password, update `DATABASE_URL` in Vercel, redeploy. |

Neon's free tier keeps a limited history window — check what yours actually
retains before you rely on point-in-time restore.

---

## 6. Known gaps at this stage

These are accepted-for-now, not oversights:

- **No automated migration step.** Deploys do not migrate; you do (step 1).
- **No `directUrl` in `schema.prisma`.** That is why migrations run from your
  laptop with the direct string instead of from CI. Adding `directUrl` is a
  schema change and needs a DECISIONS entry first.
- **`?t=` management links are capabilities in a URL**, so they land in
  browser history and access logs. Logging hygiene is an M4 item.
- **No KVKK delete/export flow yet** (Q-L3/Q-L4) — required before *public*
  beta, not before a friendly-user test.
- **No uptime monitoring or error tracking.** Fine for a private beta with a
  handful of bookings; not fine at launch.
