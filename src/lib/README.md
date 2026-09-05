# Domain modules

Per [ADR-001](../../docs/architecture/ADR/001-system-overview.md), domain behaviour
lives here as plain TypeScript — not in route handlers, server actions, or React
components. Route handlers under `src/app/api/v1/` are thin adapters over these
modules so a future iOS client gets the same behaviour as the web UI.

Existing modules:

| Module | Responsibility |
| --- | --- |
| `db/` | Prisma client singleton (`client.ts`) + a test-only helper (`test/local-postgres.ts`) that spins up a throwaway local Postgres for integration tests. Added in M1.5 ([ADR-003](../../docs/architecture/ADR/003-data-model.md)); no query/domain logic lives here on purpose. |

Planned modules (created with the M2 vertical slice):

| Module          | Responsibility                                           |
| --------------- | -------------------------------------------------------- |
| `identity/`     | Provider accounts, sessions, roles                       |
| `availability/` | Working hours, exceptions, generated slots               |
| `booking/`      | Slot reservation, conflict prevention, cancel/reschedule |
| `provider/`     | Public profile, services catalog, booking slug           |
| `notification/` | Confirmation and reminder emails                         |

Nothing in here may store or accept health/clinical data — see
[DATA-CLASSIFICATION](../../docs/legal/DATA-CLASSIFICATION.md).
