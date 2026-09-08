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

Expect it to apply `20260905220605_init`, `20260905223800_authjs`, and
(M4) `20260907154700_nullable_identity_email`. Verify the double-booking
guard survived the trip:

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

`beth.t@example.com` is **not** usable on this account (HTTP 403: domain
not verified). You must verify a domain you own.

**This deploy (2026-09-06):**

| Item | Value |
| --- | --- |
| Apex (Namecheap) | `ortakrandevu.com` (privacy + auto-renew only; no SSL/email/hosting add-ons) |
| Resend sending domain | `mail.ortakrandevu.com` (subdomain — not the apex) |
| Resend region | **Ireland** (only EU option; keep it) |
| Tracking subdomain | empty (click tracking would rewrite magic-link URLs) |
| Custom return-path | leave default `send` |
| `EMAIL_FROM` | `Ortak Randevu <no-reply@mail.ortakrandevu.com>` |

The Namecheap parking `@` / `www` records can go away when Resend writes DNS;
the live app is `https://www.ortakrandevu.com` (apex redirects to www).
`https://ortak-randevu.vercel.app` remains as a Vercel fallback.

1. Resend → **Domains** → add **`mail.ortakrandevu.com`**, region Ireland.
2. Add the DNS records Resend shows (Namecheap **Advanced DNS**; Host is the
   left label only, e.g. `mail` not `mail.ortakrandevu.com`).
3. Wait until the domain shows **Verified**.
4. API key (send-only) → `RESEND_API_KEY`.
5. Vercel `EMAIL_FROM` must use the **verified** host exactly (`@mail.ortakrandevu.com`), then **Redeploy**.

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
| `DATABASE_URL` | Neon **pooled** (`-pooler`). Prefer `sslmode=require&pgbouncer=true`; drop `channel_binding=require` if Prisma/Auth fails |
| `AUTH_SECRET` | from local `.env.local` — generate once, then leave it alone |
| `APP_URL` | `https://www.ortakrandevu.com` (no trailing slash). Canonical host is **www**; apex redirects. |
| `RESEND_API_KEY` | from step 2 |
| `EMAIL_FROM` | `Ortak Randevu <no-reply@mail.ortakrandevu.com>` |

   Do **not** set `AUTH_EMAIL_SERVER` — it is the SMTP fallback and would
   take precedence away from Resend only if Resend's key is missing.

4. Deploy. Attach the apex only after mail + booking smoke tests pass (they
   did, 2026-09-06). See **§3b**.

### Vercel env: Edit vs Rotate

| Button | What it does | Use for |
| --- | --- | --- |
| **Edit** | You type the new value. Old value is replaced. | **Always this**, including `APP_URL`, `EMAIL_FROM`, `DATABASE_URL`, `RESEND_API_KEY` |
| **Rotate** | Vercel **generates a new random secret** and discards the old one | **Never** for this project, especially not `AUTH_SECRET` |

Rotating `AUTH_SECRET` signs everyone out and invalidates every guest
`?t=` booking link already in inboxes (ADR-005). After **Edit**, **Redeploy**
so the running deployment picks up the new value.

### Why `AUTH_SECRET` is load-bearing

It signs sessions **and** the HMAC in every guest booking-management link
(ADR-005). Rotating it silently breaks every `?t=` link already sitting in a
client's inbox. Generate it once, store it in your password manager, and treat
rotation as an incident with a plan, not routine hygiene.

---

## 3b. Attach `ortakrandevu.com` — **done 2026-09-06**

Keep **Namecheap BasicDNS**. Do **not** switch nameservers to Vercel.

**Canonical:** `https://www.ortakrandevu.com`. Apex `ortakrandevu.com` **redirects to www**. Both hosts Valid + SSL in Vercel.

DNS (plus untouched Resend `mail.` / DKIM / return-path rows):

| Type | Namecheap Host | Role |
| --- | --- | --- |
| **CNAME** | `www` | value from the **www** Vercel domain card |
| **A** | `@` | value from the **apex** Vercel domain card |

Vercel: add **both** `www.ortakrandevu.com` (primary) and `ortakrandevu.com` (redirect → www). Env **`APP_URL` → Edit** (never Rotate) = `https://www.ortakrandevu.com`, then Redeploy.

`ortak-randevu.vercel.app` can stay as a fallback; email links use `APP_URL`.

---

## 4. Smoke test the deployment

Origin for the first smoke was `https://ortak-randevu.vercel.app`. Canonical
origin is now `https://www.ortakrandevu.com` (apex redirects). Functionality
only (copy, email wording, and CSS are out of scope). Skip step 7 until a
polish pass.

With `mail.ortakrandevu.com` verified, guest mail can go to a **second**
inbox. Same Gmail for both roles is still enough to prove the path.

- [x] 1. `GET /api/v1/health` → ok
- [x] 2. `/login` → magic link from `no-reply@mail.ortakrandevu.com` → `/me`
- [x] 3. `/me/availability` → add a service (e.g. 30 min) + weekly hours → upcoming slots list is non-empty
- [x] 4. Copy public path from `/me` → open `/book/…` in a **private window** (signed out)
- [x] 5. Book a slot (name + email + phone) → land on `/bookings/…?t=…` → confirmation mail sends (Resend dashboard is enough; ignore body/design)
- [x] 6. **Reschedule**, then **cancel** → cancelled time is OPEN on `/book/…` again
- [ ] 7. *(deferred)* Turkish copy + email wording

If a step fails, capture the Vercel function log for that request (mail logs
omit the recipient; do not paste `?t=` tokens).

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
  browser history and **Vercel access logs** (cannot strip query strings
  there). Application logs redact them (M4). See PRIVACY-NOTES §Logging.
- **KVKK delete/export exists** for the signed-in provider (Q-L3). Migration
  `20260907154700_nullable_identity_email` is applied on Neon. **www smoke
  2026-09-08:** export JSON + delete confirmation. Guest self-serve erasure
  is not in M4 (Q-P7). The smoked production provider was scrubbed; re-signup
  is a new `Provider` row.
- **No uptime monitoring or error tracking.** Fine for a private beta with a
  handful of bookings; not fine at launch.
- **Saving a full week of hours at once can error** when some days already
  have hours (seen 2026-09-06 on prod). Deferred — not blocking M2.9. Fix in
  a polish availability pass (not M3 — dashboard shipped without this fix).
