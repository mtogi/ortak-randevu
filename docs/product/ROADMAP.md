# Roadmap

Aligned with [WAR-PLAN](../WAR-PLAN.md) phases. Product capabilities, not git
commits.

## Now (M4 — next chat)

- KVKK delete/export (Q-L3): scrub PII + `deletedAt`, no hard delete (Q-D6)
- Logging hygiene so guest `?t=` management tokens and magic-link URLs are
  not treated as ordinary query params
- Decide retention (Q-L4) if it is required to ship delete/export honestly

## Next (private beta)

- Provider smoke of dashboard + settings on `https://www.ortakrandevu.com`
- Copy/CSS polish; weekly-hours “save whole week at once” bug

## Later (post-beta)

- Calendar sync (Google/Outlook)
- Payments / deposits
- Provider verification
- Google OAuth as a second sign-in (Q-T15)
- Native **iOS** app on the same `/api/v1` (freeze `v1` first — Q-T8)
- Expand to other professions
- Optional light marketplace discovery

## Explicit parking lot

- Clinical intake, meal plans as records, wearable/lab integrations — **not planned**
