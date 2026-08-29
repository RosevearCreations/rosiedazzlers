# Build 267 — Role/Module Navigation Convergence

**Date:** 2026-08-29

Build 267 reorganizes the non-public Rosie Dazzlers application around the module architecture. It adds categorized module-home cards, a module-local hierarchical menu, focused roles, admin-all-modules protection, a fail-closed role migration, and route-scoped server entitlement compatibility while preserving lazy/no-poll runtime behavior.

Key source authorities: `data/build267_app_modules.json`, `data/build267_internal_navigation.json`, `data/build267_route_module_ownership.json`, `docs/modular-app/06_BUILD267_ROLE_MODULE_NAVIGATION.md`, and `sql/2026-08-29_build267_role_module_hierarchy.sql`.

Deployment/database acceptance is still required; source completion does not claim the migration has already been applied to Development.

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 214 documentation sync -->
<!-- BUILD239_SYNC: retained historical documentation synchronization -->
<!-- BUILD240_SYNC: retained historical documentation synchronization -->
<!-- BUILD241_SYNC: retained historical documentation synchronization -->
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
<!-- BUILD257_SYNC retained historical documentation synchronization -->
<!-- BUILD258_SYNC retained historical documentation synchronization -->
<!-- BUILD259_SYNC retained historical documentation synchronization -->
<!-- BUILD260_SYNC retained historical documentation synchronization -->

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
