# Rosie Dazzlers Modular Application Architecture

**Current architecture:** Build 268 repository-hygiene checkpoint, based on the Build 267 role/module runtime.

Rosie Dazzlers is one secured platform with eight independently loadable modules. Public SEO pages remain static-first; protected application modules load only after authorization and an explicit user/workflow wake condition.

## Modules

| Module | Primary audience | Runtime rule |
|---|---|---|
| Customer | Customer/guest | Interactive booking/account/progress/payment only when opened. |
| Detailer | Detailer, Senior Detailer, Operations Manager, Admin | Bounded workspace; live messaging/media bundle wakes only for an eligible open job. |
| Operations | Senior Detailer, Operations Manager, Admin | Today/Schedule/Blocks/Assignments/Live load only when selected; no idle polling. |
| Administration | Admin | Staff, inventory, catalog and business configuration load on demand. |
| I.T. & Reliability | I.T. Specialist, Admin | Preflight, tests, diagnostics, security and recovery load only when selected. I.T. cannot be globally disabled. |
| Finance | Accountant, Admin | Accounting, payments, payroll, tax and close workflows load on demand. |
| DAIP | DAIP Manager, Admin | Governed private-media/evidence workflows remain behind DAIP gates; no automatic processing/publication. |
| Socials & Promotion | Promoter, Admin | Marketing/content/social/integration workflows load on demand; no external provider call from shell load. |

## Authorization model

Access is the intersection of four decisions: role ceiling, per-user module grant, global availability, and server-side action/scope authorization. Administrator accounts always receive all seven internal staff modules; a Detailer cannot inherit Finance/I.T./DAIP/Socials merely because an old broad capability flag is present.

Canonical authorities are `data/app_modules.json`, `data/internal_navigation.json`, `data/route_module_ownership.json`, `assets/app-core/module-resolver.js`, `assets/app-core/module-navigation.js`, `functions/api/admin/_lib/staff-auth.js`, and `sql/2026-08-29_build267_role_module_hierarchy.sql`.

## Navigation and wake/sleep

`/app/` is the role-aware launcher. Each module home exposes categorized workflow cards. Opening a module home does not load its business datasets. No eligible Detailer job means no live bundle/feed/media/message monitor. Operations loads data only after a workstream is selected. Finance/Admin/I.T./DAIP/Socials are likewise lazy. Customer progress is active-job-only and hidden/inactive safe.

## Packaging direction

The same shared application remains authoritative: installable Web/PWA now, future Capacitor wrapper for native mobile benefits, and optional Tauri wrapper only if true desktop tray/background behavior proves useful.

## Repository policy

Update these canonical files in place. Do not create build-numbered copies of current registries/documentation. Git history is the release archive. Database migrations remain under `sql/`; comment-only/no-DDL marker files are not migrations.