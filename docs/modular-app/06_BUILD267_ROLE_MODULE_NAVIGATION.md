# Build 267 — Role-aware module navigation and entitlement convergence

**Date:** 2026-08-29  
**Database migration:** `sql/2026-08-29_build267_role_module_hierarchy.sql`

## Purpose

Build 267 makes the non-public information architecture match the runtime architecture. Staff no longer receive one flat Admin menu. They enter `/app/`, see only authorized modules, then use categorized clickable workflow cards inside the selected module.

## Access equation

`role ceiling ∩ per-user module grants ∩ globally enabled modules = modules shown/loaded`

Operational wake state is evaluated after access. A permitted module may remain asleep.

Administrators are the deliberate exception to narrowing: every current/future `admin` receives all seven internal staff modules.

## Database safety order

The migration updates all existing Administrators first, asserts the seven grants, then and only then changes the `role_code` constraint. It reuses `permissions_profile` and `app_management_settings`; no parallel entitlement schema is created.

## Role ceilings

- Detailer: Detailer.
- Senior Detailer: Detailer + Operations.
- Operations Manager: Detailer + Operations.
- Accountant: Finance.
- I.T. Specialist: I.T.
- Promoter: Socials & Promotion.
- DAIP Manager: DAIP.
- Administrator: all internal modules.

## Navigation

`data/build267_internal_navigation.json` is the source-readable catalog. `assets/app-core/module-navigation.js` provides the same static catalog to module homes and the private menu without an API call. The card hierarchy covers the active field, Operations, Administration, I.T., Finance, DAIP and Social/Promotion workflows. Login/account and selected compatibility routes are intentionally special rather than duplicate cards.

## Server compatibility boundary

Many older endpoints use broad capabilities such as `manage_staff` or `manage_bookings`. Build 267 does not grant those booleans to focused roles. The shared staff-auth helper may satisfy the old capability only when the current `/api/admin/*` route belongs to a module inside that actor's role ceiling/grants. Booking scope and endpoint-specific checks remain additional requirements.

This route-scoped compatibility bridge should gradually be replaced by explicit named action capabilities in later builds.

## Runtime/CPU rule

Module menus/homes are static. They do not poll and do not read subsystem datasets. Build 264 Detailer open-job wake logic, Build 265 Operations manual loading and Build 266 global switch/PWA behavior remain unchanged.

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->
<!-- Build 238 synchronization (2026-07-30) -->
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: retained historical documentation synchronization -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: retained historical documentation synchronization -->
<!-- BUILD247_SYNC: retained historical documentation synchronization -->
<!-- BUILD248_SYNC: retained historical documentation synchronization -->
<!-- BUILD250_SYNC retained historical documentation synchronization -->
<!-- BUILD251_SYNC retained historical documentation synchronization -->
<!-- BUILD252_SYNC retained historical documentation synchronization -->
<!-- BUILD253_SYNC retained historical documentation synchronization -->
<!-- BUILD254_SYNC retained historical documentation synchronization -->
<!-- BUILD255_SYNC retained historical documentation synchronization -->
<!-- BUILD256_SYNC retained historical documentation synchronization -->
<!-- BUILD257_SYNC: retained historical documentation synchronization -->
<!-- BUILD258_SYNC: retained historical documentation synchronization -->
<!-- BUILD259_SYNC: retained historical documentation synchronization -->
<!-- BUILD260_SYNC: retained historical documentation synchronization -->
<!-- DOCUMENT STATUS — Build 260: historical/specialist document retained for release compatibility; current living planning authorities are AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md. -->
