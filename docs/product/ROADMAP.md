# Roadmap

Aligned with [WAR-PLAN](../WAR-PLAN.md) phases. Product capabilities, not git
commits.

## Now (path to first real users)

Brand follows Calendly (2026-09-14, `docs/design/BRAND.md`). Home is the
conversion landing. TR is the default locale (2026-09-14). Hygiene Now **1–5
done** (2026-09-19). Owner-accepted MVP plan **2026-09-24**: general hosts;
calendar sync is the invite gate.

**Calendar path (MVP-must before invites)** — Google + Microsoft only:

0. **Doc + copy lock** — promote decisions (done); light host copy + calendar ADR stub
1. **Calendar foundation** — connections, busy blocks ∩ OPEN slots, disconnect
2. **Google Calendar** — OAuth (≠ sign-in), read-busy then write-back
3. **Microsoft Graph / Outlook** — same busy + write contract
4. **Hardening + invite** — smoke on www; then friendly hosts

Polish = small backlog items only (owner list later); never block Phases 1–2.

Human ops: Neon migrate when needed; never **Rotate** `AUTH_SECRET`.

Google OAuth **sign-in** (Q-T15) smoked on www 2026-09-13. Magic link stays
primary. Calendar OAuth is a separate client/scopes.

## Later (after web MVP / owner gates)

- Payments / deposits — only after web MVP + ~10–20 users + iOS App Store parity
- Native **iOS** app on the same `/api/v1` (when web is satisfactory; freeze `v1` — Q-T8)
- **Apple / iCloud calendar** — after iOS (EventKit preferred); not a web-MVP gate
- SMS / WhatsApp
- Optional light marketplace discovery — only if DECISIONS says so
- Provider verification (if ever needed)

## Explicit parking lot

- Clinical intake, meal plans as records, wearable/lab integrations — **not planned**
- Mega UI rewrite without an owner-provided list — **not planned**
