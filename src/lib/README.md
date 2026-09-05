# Domain modules

Per [ADR-001](../../docs/architecture/ADR/001-system-overview.md), domain behaviour
lives here as plain TypeScript — not in route handlers, server actions, or React
components. Route handlers under `src/app/api/v1/` are thin adapters over these
modules so a future iOS client gets the same behaviour as the web UI.

| Module | Responsibility |
| --- | --- |
| `db/` | Prisma client singleton + test-only local Postgres helper (M1.5) |
| `identity/` | Provider accounts on magic-link login, public booking path (M2a / ADR-004) |

Planned:

| Module | Responsibility |
| --- | --- |
| `availability/` | Working hours, exceptions, generated slots |
| `booking/` | Slot reservation, conflict prevention, cancel/reschedule |
| `provider/` | Public profile, services catalog |
| `notification/` | Confirmation and reminder emails |

Nothing in here may store or accept health/clinical data — see
[DATA-CLASSIFICATION](../../docs/legal/DATA-CLASSIFICATION.md).
