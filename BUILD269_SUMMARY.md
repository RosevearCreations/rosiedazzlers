# Build 269 — Navigation, profile compatibility, action permissions and event-driven notification foundation

**Date:** 2026-08-29

Build 269 follows the Build 268 repository hygiene pass.

Primary goals:

- make `/app/` unambiguously the **Staff App Launcher**, not the Administration module;
- provide a persistent **Public Site** return path from the launcher and protected staff pages;
- normalize historical TEXT and canonical JSONB `staff_users.permissions_profile` values at runtime;
- introduce explicit action-level permission names while retaining legacy capability compatibility during migration;
- move notification administration onto explicit I.T. notification actions without adding idle polling;
- preserve the rule that a module being authorized does not mean it is awake or loading data.

Canonical application homes:

- `/app/` — Staff App Launcher
- `/app/detailer/` — Detailer
- `/app/operations/` — Operations / Supervisor
- `/app/admin/` — Business Administration
- `/app/it/` — I.T. & Reliability
- `/app/finance/` — Finance
- `/app/daip/` — DAIP
- `/app/socials/` — Socials / Marketing / Integrations

No new database table is introduced by this source release. Action grants use the existing `permissions_profile` authority and role-safe defaults. Admin remains fail-open to all internal actions by design; focused roles remain bounded by module ceiling first.
