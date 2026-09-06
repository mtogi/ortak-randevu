# Architecture Decision Records

| ADR | Title | Status |
| --- | --- | --- |
| [001](./001-system-overview.md) | System overview (web + future iOS) | **accepted** 2026-09-03 |
| [002](./002-tech-stack.md) | Tech stack | **accepted** 2026-09-03 |
| [003](./003-data-model.md) | Data model (no PHI) | **accepted** 2026-09-05 |
| 004 | [Auth & roles](./004-auth-roles.md) | **accepted** 2026-09-05 |
| [005](./005-public-booking.md) | Public guest booking + transactional email | **accepted** 2026-09-05 |
| 006 | i18n (EN default, TR settings) | proposed / not written (cookie locale already in the scaffold; Q-T9 closed in ADR-004) |
| 007 | Notifications beyond email (SMS / WhatsApp) | proposed / not written (transactional email decided in ADR-005) |
| 008 | Payments | proposed / not written |

Write each ADR as `00N-short-title.md` in this folder using:

```md
# ADR-00N: Title

- Status: proposed | accepted | superseded
- Date:
- Deciders:

## Context

## Decision

## Consequences
```
