# Build 266 — Expanded Module Runtime, Access Ceiling and Installable App Foundation

**Date:** 2026-08-29  
**DDL:** none  
**Current authority:** `AI_PROJECT_HANDOFF.md` + `MASTER_VALUE_ROADMAP.md`

## Why this build exists

Rosie already proved the CPU-saving architecture with Detailer (Build 264) and Operations (Build 265). Build 266 applies the same rule across the business: a module may be authorized without being awake.

## Eight modules

Customer, Detailer, Operations/Supervisor, Business Administration, I.T./Reliability, Finance, DAIP, and Socials/Integrations.

## Access

- hard role ceiling first;
- per-staff `permissions_profile.module_access` second;
- global `app_management_settings.module_runtime_flags` third;
- existing server capabilities/scopes remain authoritative for actions.

A Detailer cannot be elevated past Detailer by a legacy `can_manage_*` checkbox. Senior Detailer cannot be elevated past Detailer + Operations. Admin may be explicitly narrowed.

## Runtime flags

The I.T. shell owns global module availability. The browser caches the one-row snapshot for 15 minutes; there is no interval. I.T. is locked on to preserve recovery. A disabled module should not appear in the launcher or open from normal protected navigation once the current switch snapshot is known.

## Wake rules

- Detailer: one bounded workspace read; live bundle only after an eligible job is open.
- Operations: dataset only after explicit workstream selection.
- Admin/Finance/DAIP/Socials: no dataset from shell load.
- I.T.: no test/preflight/health scan from shell load.
- Social/provider APIs: explicit workflow/test only.

## Messaging

Customer Progress and Detailer Live Feed are the shared two-way job channel. Build 266 removes perpetual customer `setInterval`: active jobs use a visibility-aware one-shot ~120-second refresh; inactive jobs have no timer. Detailer remains manual/event-driven with no recurring feed read.

## PWA / device layer

Build 266 adds proper app icons/shortcuts, install controls, local notification permission/test, and event-driven push handlers. The service worker deliberately precaches only the shared launcher layer; optional modules are fetched/cached after use. APIs are never cached.

Remote push is not complete until subscription/provider credentials and deployed delivery evidence exist. Native system-tray/app-store packaging is the next wrapper layer, not a reason to duplicate Rosie logic.

## Acceptance essence

1. Detailer sees only Detailer.
2. Senior Detailer sees only granted Detailer/Operations.
3. Admin sees only granted + globally enabled modules.
4. Turn Finance off and prove no Finance shell/workflow loads from normal navigation.
5. No idle shell creates recurring API traffic.
6. No open Detailer job = no live messaging/media traffic.
7. Inactive customer job = no progress refresh timer.
8. Install PWA and send local test notification on representative mobile/desktop devices.
9. Keep Cloudflare exceeded CPU terminations at zero.


## Historical release compatibility markers — Build 266

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->
> **Build 237 synchronization (2026-07-28):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
> **Build 238 synchronization (2026-07-30):** Compatibility/history marker retained; current authority remains the living handoff and roadmap.
<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
<!-- BUILD240_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
<!-- Build 246 synchronization: historical compatibility marker retained. -->
<!-- BUILD247_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD248_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD249_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD250_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD251_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD252_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD253_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD254_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD255_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD256_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD257_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD258_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD259_SYNC: retained for cumulative release compatibility. -->
<!-- BUILD260_SYNC: retained for cumulative release compatibility. -->

<!-- DOCUMENT STATUS — Build 260: historical/specialist document retained for release compatibility; current living planning authorities are AI_PROJECT_HANDOFF.md and MASTER_VALUE_ROADMAP.md. -->
