# Build 241 — Startup Command Center Initialization Hotfix

**Date:** 2026-08-05  
**Database change:** None

## User-visible repair

The unified Startup Command Center previously stopped during refresh with:

```text
ReferenceError: Cannot access 'evidenceRows' before initialization
```

The cause was a temporal-dead-zone collision in `updateSummary()` where a local constant and a function had the same name. The function is now named `getEvidenceRows()` and the local result is named `rows`.

## Reliability improvements

- `refreshAll()` now uses `Promise.allSettled()`.
- One panel failure no longer aborts the complete Startup interface.
- Failures are shown in a visible warning while safe fallbacks remain available.
- The Startup script query token and service-worker cache were advanced to Build 241.
- A dedicated regression guard rejects the exact faulty pattern.

## Deployment check

Deploy, open `/admin-startup-guide.html` in an incognito browser, verify the Build 241 script in Network, select **Refresh all**, and confirm no uncaught promise error appears.

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

Build 210 documentation sync

Build 211 documentation sync

Build 212 documentation sync

Build 213 documentation sync

Build 214 documentation sync

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
