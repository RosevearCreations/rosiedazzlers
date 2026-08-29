# Build 264 — Detailer Mobile Runtime and Four-App Entry Shells

**Date:** 2026-08-25  
**Runtime change:** yes  
**Database migration:** none

## Purpose

Build 264 turns the Build 263 architecture foundation into the first real modular runtime. All four canonical app entry routes now exist, while the Detailer Mobile App is the first interface whose runtime has actually been extracted.

## Canonical entries

- `/app/customer/` — customer compatibility bridge; public SEO remains static-first.
- `/app/detailer/` — active modular Detailer Mobile runtime.
- `/app/operations/` — protected bridge shell; no operations datasets load merely by opening it.
- `/app/admin/` — protected Business Administration bridge; no back-office datasets load merely by opening it.
- `/app/` — lightweight staff module launcher.

## Detailer load contract

The Detailer shell loads:

1. staff session/authentication;
2. the small shared app core;
3. one bounded `/api/detailer/jobs?scope=workspace` request;
4. no recurring timer.

If there is no eligible open job, processing stops there.

The separate `live-job-module.js` file is lazy-loaded only when the selected job is in `arrived`, `detailing`, or `paused` state. A scheduled/accepted/dispatched job may be advanced manually, but it does not wake the live feed/media bundle.

## Network behavior

- no `setInterval` exists in the Build 264 Detailer runtime;
- hidden/visible transitions do not trigger automatic server refreshes;
- job workflow mutations use the authoritative mutation response to patch client state instead of issuing an immediate full jobs refresh;
- feed load is once on live-module wake and thereafter manual;
- note/media writes update the local feed from returned records instead of automatically reloading the entire feed;
- photo/video binary data goes directly from browser to signed storage;
- the Cloudflare Function signs the upload and records the completed media metadata;
- mutation 5xx/timeouts are not automatically replayed.

## Bounded Detailer workspace API

`/api/detailer/jobs?scope=workspace` now:

- limits the workspace to 80 rows;
- uses a two-day historical overlap plus future assigned work;
- preserves booking-scope authorization;
- skips crew-summary and unread-feed fan-out queries during the base mobile load;
- defers feed-specific work until an open job is explicitly selected.

The legacy `/detailer-jobs.html` route remains available during migration and now links to the new mobile shell.

## Shared app core

Build 264 implements the first shared, framework-free core:

- `module-resolver.js` — client-side shell selection only; never replaces server authorization;
- `runtime-policy.js` — derives Idle / Ready / Live state without polling;
- `api-client.js` — no automatic retries and explicit ambiguous-mutation errors;
- `module-loader.js` — dynamic/lazy bundle loading;
- `refresh-leader.js` — same-browser lease primitive with no heartbeat timer.

## Acceptance rule

> **No eligible open Detailer job = no recurring live-job network activity and no live-job bundle request.**

Build 265 should migrate the first Operations runtime group (Today / Schedule / Blocks / Assignment / Live state) and introduce explicit blocked-day operational state without waking unrelated Business Administration modules.

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
