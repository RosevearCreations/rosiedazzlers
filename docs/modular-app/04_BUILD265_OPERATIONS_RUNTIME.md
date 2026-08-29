# Build 265 — Operations / Supervisor Runtime

Build 265 promotes `/app/operations/` from a protected bridge to an active modular runtime.

## Runtime contract

- Opening the shell authenticates the actor but loads no operational dataset.
- Today, Schedule, Blocked Days, Assignments and Live Snapshot are dynamically imported only after explicit owner selection.
- Each module performs a bounded/manual read and exposes a manual refresh button.
- No Operations runtime file may create `setInterval` or a background polling loop.
- Live Snapshot is a snapshot, not a monitor.
- Legacy full screens remain compatibility targets for deeper mutations until those writes are migrated with server-authoritative responses.

This advances the Build 263/264 modular plan while preserving the Build 262 CPU-stability rule: permission to use a feature does not mean the feature should be awake continuously.

<!-- Build 238 synchronization (2026-07-30) -->
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: historical compatibility -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: historical compatibility -->
<!-- BUILD247_SYNC: historical compatibility -->
<!-- BUILD248_SYNC: historical compatibility -->
<!-- BUILD250_SYNC historical compatibility -->
<!-- BUILD251_SYNC historical compatibility -->
<!-- BUILD252_SYNC historical compatibility -->
<!-- BUILD253_SYNC historical compatibility -->
<!-- BUILD254_SYNC historical compatibility -->
<!-- BUILD255_SYNC historical compatibility -->
<!-- BUILD256_SYNC historical compatibility -->
<!-- BUILD257_SYNC: historical compatibility -->
<!-- BUILD258_SYNC: historical compatibility -->
<!-- BUILD259_SYNC: historical compatibility -->
<!-- BUILD260_SYNC: historical compatibility; DOCUMENT STATUS — Build 260 -->
