# Build 263 Modularization Implementation Plan

**Purpose:** begin separating the existing Rosie Dazzlers application into four loadable interfaces without destabilizing Build 262 CPU work.

## Build 263 scope

Build 263 is a foundation release. It should introduce structure and contracts first, then move one operational surface at a time.

### Deliverables in the architecture foundation

- `docs/modular-app/01_MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/modular-app/02_BUILD263_IMPLEMENTATION_PLAN.md`
- `data/build263_app_modules.json`
- `data/build263_route_migration_matrix.csv`
- `data/build263_api_namespace_inventory.csv`
- empty source ownership directories for all four shells;
- README contracts in each shell directory;
- living-document synchronization.

No existing public/admin/detailer route should be removed by the foundation pass.

## First runtime implementation after the foundation

### Step 1 — app-core runtime

Create a small, framework-free shared core compatible with the existing application:

```text
assets/app-core/session.js
assets/app-core/module-loader.js
assets/app-core/runtime-policy.js
assets/app-core/api-client.js
assets/app-core/module-diagnostics.js
```

The first version should not know how to render every screen. Its responsibility is only identity, module access, runtime state, safe API behavior, and lazy loading.

### Step 2 — staff module resolver

Extend the existing staff `auth_me`/actor response or add one bounded staff context endpoint that can return:

- allowed module keys;
- role/capability summary;
- business-day state;
- active-job count;
- current/assigned job identifiers where allowed;
- feature wake/sleep flags.

Do not query every subsystem to build this response. It must be intentionally small.

### Step 3 — customer context

Keep customer auth separate from staff auth. Customer module access is implicit for an authenticated customer/guest flow; do not mix internal role information into customer responses.

### Step 4 — module launcher

Add `/app/` as a lightweight entry/chooser for staff who have more than one module.

Behavior:

- one available staff module → redirect directly;
- multiple modules → show four-card chooser containing only authorized modules;
- remember last selected module locally for convenience, but always reauthorize server-side;
- customer login stays customer-facing and does not expose staff module names.

### Step 5 — Detailer Mobile shell

Move `detailer-jobs` into the new shell first.

Required runtime behavior:

- load assigned/today jobs once;
- if none are active, enter explicit Idle mode;
- no live-job interval while idle;
- starting a job wakes only job-required capabilities;
- capture/upload is event-driven;
- pause timed reads when hidden;
- broadcast job state to other same-browser tabs;
- stop job runtime when completed/cancelled.

### Step 6 — Operations shell

Move operational pages by workflow rather than filename:

1. Today / Workflow;
2. Booking / Schedule / Blocks / Assignment;
3. Live / Progress / Incidents;
4. Leads / Quotes / Conversions;
5. Customers / operational payments.

Operations should not load accounting, media administration, SEO, DAIP, analytics, payroll, or system-readiness bundles unless the user switches to Business Administration.

### Step 7 — Business Administration shell

Group back-office pages into lazy modules:

```text
System & security
Finance
Inventory
Media & content
Growth & SEO
DAIP
Diagnostics
```

Each group fetches on first open and can be unloaded/released when the user leaves it.

### Step 8 — Customer App

Keep SEO pages static. Move interactive customer workflows into a coherent shell with route-specific chunks/components.

## Operational state contract

Runtime state should be an explicit object, not scattered page-by-page guesses.

Minimum staff state:

```json
{
  "business_day": "blocked|closed|open_idle|scheduled|active|wrap_up",
  "active_job_count": 0,
  "active_job_id": null,
  "has_today_jobs": false,
  "live_job_monitoring": false,
  "photo_capture": false,
  "inventory_capture": false,
  "customer_live_status": false
}
```

### Example blocked day

If today is blocked and no active override/job exists:

```text
live job monitoring = OFF
progress polling = OFF
photo sync = OFF
inventory job capture = OFF
customer live-status polling = OFF
```

The application may still allow manual schedule review or an authorized override.

### Example active job

When a job transitions to active:

```text
live job monitoring = ON
photo capture/upload = ON
inventory capture = ON
customer progress = ON only if progress is enabled
```

The transition itself should update client state; it should not require rapid polling to discover a change the client just made.

## CPU-oriented client runtime rules

### Single-tab refresh leader

Use `BroadcastChannel` where supported, with a localStorage fallback, so several tabs do not all poll the same operational endpoints.

Only the visible elected leader may run an allowed recurring read.

### Visibility

On `visibilitychange`:

- hidden → stop recurring reads;
- visible → if cached data is stale, do one bounded refresh;
- do not immediately restart every subsystem.

### State changes

After a successful mutation:

- patch local state;
- broadcast the known change;
- re-fetch only the affected entity if authoritative confirmation is needed.

### Errors

- never auto-retry mutations after ambiguous 5xx/timeouts;
- safe reads may use bounded exponential backoff;
- 429/5xx should trip a short client circuit breaker;
- Runtime & CPU Diagnostics should include the active module key.

## Security rules

1. Module loader controls downloads/UI, not authorization.
2. All APIs remain server-authorized.
3. Staff registration remains controlled/internal.
4. Customer auth and staff auth remain separate security domains.
5. Detailers remain booking-scoped.
6. Business Administration requires explicit privileged capability.
7. No service-role/payment/private-media secret enters a client bundle.
8. Browser-derived price/inventory calculations are previews; authoritative mutations are server validated.

## Migration safety

For each migrated page:

1. identify current APIs and capabilities;
2. extract client logic into the target shell;
3. preserve current route as a compatibility entry;
4. run role/capability tests;
5. verify no new timer or hidden-tab traffic;
6. compare Runtime Diagnostics call count before/after;
7. only then migrate the next page.

## Proposed first implementation order

1. Build 262 deploy/CPU measurement.
2. Build 263 architecture/scaffolding.
3. Shared module resolver and module chooser.
4. Detailer shell/Idle-active state engine.
5. Operations shell Today + Schedule + Live.
6. Administration shell system/diagnostics first.
7. Remaining administration groups.
8. Customer interactive shell.
9. Compatibility cleanup.

## Definition of done for the modular program

The program is complete when:

- each identity downloads only authorized/needed application bundles;
- four shells can be installed/launched independently;
- public SEO pages remain static-first;
- blocked/no-job days produce effectively zero live-job monitoring calls;
- active-job features wake and stop deterministically;
- same-browser tabs do not multiply timers;
- Operations does not load back-office modules by default;
- Admin does not poll unopened modules;
- old routes have documented compatibility behavior;
- module/capability server checks are covered by release tests;
- Cloudflare CPU/resource failures remain at zero during representative test usage.

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
