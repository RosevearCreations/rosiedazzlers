# Build 264 — First Modular Runtime: Detailer Mobile

**Date:** 2026-08-25  
**SQL:** none

Build 264 activates the four-app architecture established in Build 263 without creating four codebases. It adds all four canonical app entry shells and migrates the first real runtime: Detailer Mobile.

## Delivered

- `/app/` authorized staff module launcher.
- `/app/customer/` customer compatibility bridge.
- `/app/detailer/` real mobile-first modular runtime.
- `/app/operations/` protected Operations bridge shell.
- `/app/admin/` protected Business Administration bridge shell.
- shared framework-free app core under `/assets/app-core/`.
- lazy live-job bundle under `/apps/detailer/live-job-module.js`.
- bounded Detailer workspace API mode.
- Detailer namespace facades for live feed, progress enablement and signed media workflow.
- current service-worker cache identity advanced to Build 264 while the heavy live-job bundle is intentionally excluded from precache.
- PWA shortcuts for Rosie Apps and Detailer Mobile.

## CPU/runtime behavior

Base Detailer start = authentication + one bounded current-work query. There is no Detailer polling interval. No live-job bundle or live-feed request occurs until an Arrived/Detailing/Paused job is selected. Job mutations update local state from their server response instead of immediately refetching the jobs workspace.

## Compatibility

`/detailer-jobs.html` remains available and links to the new app. Existing secured API handlers remain authoritative; new `/api/detailer/*` facade routes reuse those handlers rather than duplicating business logic.

## Next release

Build 265: first real Operations/Supervisor runtime with blocked-day / no-active-job sleep rules and lazy operational workflow groups.

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
