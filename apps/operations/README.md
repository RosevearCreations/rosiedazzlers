# Operations / Supervisor App — Build 265 runtime

Canonical route: `/app/operations/`.

Build 265 converts the protected bridge into a real modular Operations runtime. Opening the shell authenticates the actor but loads **no operational dataset**. Today, Schedule, Blocked Days, Assignments and Live Snapshot are explicit lazy-loaded modules. Each module performs a bounded/manual read only after the owner selects it. There is no `setInterval`, background polling, or automatic live-job monitor.

Legacy full screens remain available as compatibility targets while their deeper mutations migrate gradually.

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
