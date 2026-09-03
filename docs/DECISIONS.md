# Decision Log

Dated product/tech decisions that are too small for a full ADR, or pointers to ADRs.

| Date | Decision | Rationale | Links |
| --- | --- | --- | --- |
| 2026-09-02 | v1 vertical = dietitians in Turkey only | Focus; expand professions later | PRD / VISION |
| 2026-09-02 | EN default UI; TR via user settings | Main language English; TR optional anytime | ADR-005 (TBD) |
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

<!-- Add rows as decisions close. Prefer YYYY-MM-DD. -->
