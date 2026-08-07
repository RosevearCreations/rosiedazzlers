# Build 245 — UI, SEO and Cache Acceptance

## Operator route

`/admin-ui-health.html`

## What the scanner checks

- critical route response status
- exactly one H1 in delivered HTML
- public title and description presence/length
- public canonical links
- administrator `noindex` protection
- local stylesheet, script and image availability
- clean-route title/H1 parity for `.html` admin pages
- deprecated SVG photo-placeholder references
- current service-worker controller, cache keys and Startup script build

## Cache recovery

Use **Check for app update** first. If an older script is still served, use **Clear app cache & reload**. This unregisters the site service worker and removes only cache names beginning with `rosie-app-`. It does not delete database records or local evidence/form storage.

## Important limitation

A browser source scan cannot prove payment providers, email receipt, database rollback, mobile touch behaviour, keyboard accessibility, weak-network upload recovery or real Core Web Vitals. Those remain guided Startup acceptance tasks.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
Build 238 synchronization (2026-07-30)
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->
