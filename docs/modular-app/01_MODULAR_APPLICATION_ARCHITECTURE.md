# Rosie Dazzlers Modular Application Architecture

**Planning baseline:** Build 263 foundation after Build 262 CPU stabilization  
**Status:** Architecture approved for staged implementation; no production behavior changed by this document  
**Living authorities:** `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`

## 1. Decision

Rosie Dazzlers remains one business platform, one repository, one authoritative data model, and one secured backend, but its user experience will be separated into four independently loadable application shells:

1. **Customer App**
2. **Detailer Mobile App**
3. **Operations / Supervisor App**
4. **Business Administration App**

The public SEO website remains the lightweight front door to the Customer App. It is not a fifth authenticated application module and should remain predominantly static/crawlable.

This is an incremental modularization, not a rewrite and not four unrelated codebases.

## 2. Why this direction

Build 262 established that Rosie must reduce avoidable Worker invocation volume and keep interactive Cloudflare Functions thin. A modular shell architecture supports that goal because each user loads only the code and data needed for the work they are actually doing.

The separation also improves:

- role clarity;
- least-privilege access;
- mobile usability for field staff;
- desktop usability for supervisors and owners;
- lazy loading;
- conditional job logic;
- timer/sync control;
- maintainability;
- future installable PWA behavior.

## 3. Two gates govern what runs

Rosie should use two independent gates.

### Gate A — Identity / registration gate

The signed-in identity determines which application shells the person may enter.

Examples:

- guest/customer identity → Customer App;
- detailer → Detailer Mobile App;
- senior detailer → Detailer Mobile App + allowed Operations views;
- supervisor / booking-management capability → Operations / Supervisor App;
- administrator/owner → Operations + Business Administration, with Detailer access only when operationally useful.

A hidden menu item is not authorization. All server actions continue to enforce session, role/capability, booking scope, and ownership rules.

### Gate B — Runtime capability gate

After a user enters an allowed shell, Rosie determines which features should be awake right now.

Example: a detailer may have permanent access to the Detailer App, but live-job media, customer-progress, inventory-capture, and job timers remain dormant when there is no active job.

This distinction is central to the CPU strategy:

> **Being allowed to use a feature does not mean the feature should be running.**

## 4. Target application shells

### 4.1 Customer App

**Audience**

- guests;
- customers with accounts;
- customers using secure booking/progress/payment links.

**Primary responsibilities**

- booking and availability;
- quotes and quote responses;
- gift certificates/cards;
- customer account and vehicles;
- progress timeline when a job is active;
- recommendations/approvals;
- final payment;
- completed-job summary;
- reviews and repeat-maintenance entry points.

**Performance rule**

Public marketing/SEO content remains static whenever possible. Customer interaction should use browser-side calculation and state, with Functions reserved for authoritative reads/writes.

**Background behavior**

- no generic heartbeat;
- no background progress refresh unless a progress-enabled job is actually active;
- hidden tabs pause timed refresh;
- completed/cancelled jobs stop progress refresh;
- mutations are never automatically replayed after ambiguous 5xx responses.

### 4.2 Detailer Mobile App

**Audience**

- detailer;
- senior detailer;
- explicitly authorized supervisor/admin when acting in the field.

**Primary responsibilities**

- assigned jobs;
- start/arrival/intake workflow;
- before/during/final media;
- notes and customer-safe updates;
- incidents/private evidence;
- task/checklist completion;
- material usage capture;
- recommendation capture;
- final sign-off/closeout handoff.

**Idle-mode rule**

If there is no current eligible job, the job engine is dormant.

The idle Detailer App may show today's assignments and a manual refresh button, but it should not run:

- progress polling;
- media polling;
- inventory-use polling;
- checklist polling;
- customer-message polling;
- live-job calculations;
- DAIP activity.

**Live-media rule**

Photo/video synchronization is triggered by user action and job state, not by a server timer asking whether media exists.

Preferred flow:

`capture locally → preprocess locally → queue locally → upload → persist metadata`

Client-side image resizing, dimensions, preview generation, and safe compression should occur before upload where practical.

### 4.3 Operations / Supervisor App

**Audience**

- senior detailer/field lead where authorized;
- supervisor;
- booking manager;
- owner/admin in operational mode.

**Primary responsibilities**

- Today Needs Attention;
- schedule and blocked days;
- booking review/assignment;
- active job oversight;
- live customer interaction/review queue;
- quotes/leads/conversions;
- customer operational support;
- job incidents;
- completion/payment attention;
- operational exception handling.

**Refresh rule**

Operations loads an initial bounded snapshot. Most panels refresh only on:

- explicit user action;
- a known state-changing mutation;
- return to a previously hidden tab after a reasonable stale interval;
- an active-job-only timer when there is at least one active job and the page is visible.

A blocked business day or zero active jobs should suppress live-job monitoring entirely.

### 4.4 Business Administration App

**Audience**

- owner/administrator;
- specifically granted back-office roles as the capability model grows.

**Primary responsibilities**

- accounting, tax, payroll, close;
- inventory administration and posting/reversal;
- staff/security;
- application settings;
- Photo Studio and Media Health;
- content/marketing/SEO;
- analytics/reporting;
- startup/readiness/testing;
- integrations;
- DAIP governance and private media administration;
- runtime diagnostics.

**Runtime rule**

This app behaves like desktop business software:

`open module → load bounded data → work locally → save deliberately`

No back-office module should poll simply because the Administration shell is open.

## 5. Public website relationship

The existing public site remains important for SEO and should not be converted into a giant client-side SPA.

Recommended split:

- `/`, `/services`, `/pricing`, town/service pages, `/gallery`, `/faq`, etc. stay static-first;
- interactive booking/account/progress flows enter the Customer App;
- common visual design can still be shared;
- public pages may consume static JSON snapshots or bounded public APIs when necessary.

This preserves crawlability, one-H1 discipline, local-search content, and low Worker usage.

## 6. Proposed route structure

New canonical shell routes:

```text
/app/customer/
/app/detailer/
/app/operations/
/app/admin/
```

Platform/shared routes:

```text
/app/                 module launcher / resolver
/staff-login           staff authentication entry
/login                 customer authentication entry
```

Existing routes remain compatibility routes during migration. They must not all be moved in one release.

Examples:

```text
/detailer-jobs.html   → /app/detailer/
/admin-today.html     → /app/operations/today
/admin-live.html      → /app/operations/live
/admin-accounting     → /app/admin/accounting
/my-account.html      → /app/customer/account
/progress.html        → /app/customer/progress
```

Compatibility wrappers/redirects should remain until route-parity tests and bookmarks are verified.

## 7. Shared platform core

All four shells share a small platform core rather than copying code.

Proposed source structure:

```text
/apps/
  customer/
  detailer/
  operations/
  admin/

/assets/app-core/
  session.js
  module-loader.js
  capability-state.js
  runtime-policy.js
  api-client.js
  diagnostics.js
  formatters.js
  validation.js

/assets/apps/
  customer/
  detailer/
  operations/
  admin/
```

The shared core should stay deliberately small. A customer must not download Admin Analytics, DAIP, accounting, or Photo Studio code just because those modules exist in the repository.

## 8. Module loader contract

The loader should follow this sequence:

1. determine shell route;
2. load current authenticated identity;
3. resolve allowed modules;
4. reject/redirect unauthorized module access;
5. obtain one bounded runtime-state snapshot;
6. dynamically load only the selected shell bundle;
7. activate only features currently permitted by runtime state.

A future staff context response can look conceptually like:

```json
{
  "authenticated": true,
  "actor": {
    "role_code": "senior_detailer"
  },
  "modules": {
    "detailer": true,
    "operations": true,
    "admin": false
  },
  "runtime": {
    "business_day": "open",
    "has_today_jobs": true,
    "active_job_count": 0,
    "active_job_id": null,
    "live_job_monitoring": false,
    "photo_capture": false,
    "inventory_capture": false
  }
}
```

Do not expose secrets or private customer data in this context response.

## 9. Registration and module access

### Customer registration

The existing client/customer authentication flow remains the customer identity system.

A customer account receives only Customer App access.

### Staff registration

Internal staff access remains provisioned by authorized staff/admin workflows. There is no public self-registration for:

- Detailer;
- Operations/Supervisor;
- Business Administration.

### Initial role-to-module migration policy

This is a compatibility policy, not the final authorization model.

| Existing identity | Customer | Detailer | Operations | Business Admin |
|---|---:|---:|---:|---:|
| Guest/customer session | Yes | No | No | No |
| Detailer | No | Yes | No* | No |
| Senior detailer | No | Yes | Yes, scoped | No |
| Admin/owner | No | Optional | Yes | Yes |

`*` A detailer may receive individual operational capabilities later without receiving the whole supervisor shell.

Long-term, module access and action capabilities should be distinct. Module access says what shell can load; action capabilities say what operations can be performed inside it.

## 10. Operational state model

The application should formalize business-day and job states so feature activation is deterministic.

### Business-day state

Suggested states:

```text
blocked
closed
open_idle
scheduled
active
wrap_up
```

### Job state

Suggested states:

```text
scheduled
en_route
arrived
intake
active
paused
awaiting_customer
finalizing
completed
cancelled
```

These values should be mapped to existing booking/workflow columns before any schema change. Do not create duplicate state columns unless the current schema genuinely cannot represent the lifecycle.

## 11. Runtime activation examples

| Capability | Blocked/closed | Open, no job | Scheduled | Active | Finalizing | Complete |
|---|---:|---:|---:|---:|---:|---:|
| Live job monitoring | Off | Off | Off | On | On | Off |
| Detailer photo capture | Off | Off | Optional prep | On | On | Off |
| Media upload queue | Off | Off | Only explicit prep | On | On | Drain only |
| Material usage capture | Off | Off | Off | On | On | Read-only |
| Customer progress refresh | Off | Off | Waiting only | On | On | Off/static |
| Customer reply checks | Off | Off | Off | On if enabled | On | Off |
| Job checklist engine | Off | Off | Prep only | On | On | Off |
| DAIP processing checks | Off | Off | Off | Off unless project exists | Off unless project exists | Off |

The table is a runtime policy. Server authorization remains separate.

## 12. Timer and synchronization policy

Build 263 and later should enforce these rules centrally.

### Rule 1 — no timer by default

A feature must justify a recurring timer. Static/admin configuration modules get none.

### Rule 2 — state-gated timers

A timer may start only when the associated business/job state makes it useful.

### Rule 3 — visibility gate

When `document.hidden === true`, recurring operational refresh stops unless there is an explicitly approved safety reason.

### Rule 4 — one refresh leader per browser

If several tabs of the same module are open, use `BroadcastChannel` or a local lease so only one foreground tab owns any permitted timed refresh. Other tabs consume shared client state or refresh on interaction.

### Rule 5 — minimum interval

Interactive monitoring should normally be 60–120 seconds or slower. Faster intervals require measured justification.

### Rule 6 — mutation retries are deliberate

POST/PUT/PATCH/DELETE operations are not automatically replayed after ambiguous 5xx/timeout results. First re-read authoritative state.

### Rule 7 — exponential backoff for safe reads

Read-only refresh may back off after 429/5xx failures and should stop after a small bounded count.

### Rule 8 — known state changes beat polling

If the current client itself starts a job, uploads a photo, completes a task, or changes a booking state, update local state immediately and revalidate only the affected server record instead of polling the whole system.

## 13. Data/computation placement

### Browser/client

Good candidates:

- sorting/filtering/searching bounded datasets;
- table pagination after a bounded fetch;
- draft forms;
- price previews;
- validation hints;
- image dimensions/resizing/compression/previews;
- local upload queue state;
- diagnostics;
- CSV parsing/export preparation;
- static content rendering;
- charts from already-fetched aggregates.

### Database/PostgreSQL

Good candidates:

- aggregates;
- grouped reporting;
- transactional inventory movement;
- reconciliation queries;
- server-side filtering of large datasets;
- authoritative availability/booking conflict checks;
- integrity constraints.

### Cloudflare Functions

Keep thin:

- session/authentication;
- authorization;
- validation of authoritative mutations;
- transaction orchestration;
- signed private-media access;
- payment/provider calls;
- small bounded read APIs;
- database RPC invocation.

## 14. API namespace direction

Existing namespaces already provide a useful start:

```text
/api/client/*      Customer App
/api/detailer/*    Detailer Mobile App
/api/admin/*       currently mixed internal responsibilities
```

Build 263+ should gradually introduce:

```text
/api/operations/*  Supervisor/day-to-day operational actions
/api/admin/*       Back-office/business administration only
```

Do not duplicate business logic. Existing `/api/admin/*` compatibility routes can call shared handlers while clients migrate.

Shared business functions belong in `functions/_lib/` rather than copied into each namespace.

## 15. PWA/installable-app direction

The four shells can eventually expose separate manifests/start URLs while remaining one deployment:

```text
manifest-customer.webmanifest
manifest-detailer.webmanifest
manifest-operations.webmanifest
manifest-admin.webmanifest
```

The Detailer shell should be optimized for install/use on a phone. Operations/Admin should support desktop installation. Do not create four native codebases at this stage.

The service-worker strategy must not pre-cache every module for every user. Cache only shared core plus the active shell's static assets.

## 16. Migration sequence

### Phase 0 — Build 262 verification

Before increasing runtime complexity:

- deploy Build 262;
- apply the corrected analytics rollup SQL;
- verify Cloudflare CPU trend;
- use Runtime & CPU Diagnostics during normal test use.

### Phase 1 — Build 263 architecture foundation

Documentation/scaffolding only:

- module registry;
- route ownership matrix;
- role/module policy;
- operational state policy;
- timer/sync contract;
- four source directories;
- no forced route migration yet.

### Phase 2 — shared module resolver

Implement:

- small app launcher;
- staff/customer module-resolution logic;
- shared client-side runtime/capability service;
- lazy bundle loading;
- diagnostics labels include active module.

### Phase 3 — Detailer Mobile shell first

Reason: it is the smallest existing functional surface and has the clearest state-gated CPU benefit.

Migrate:

- `detailer-jobs`;
- mobile upload helper;
- assigned-job APIs;
- local media queue;
- active-job capability state.

Acceptance: no active job means no live-job timer/network activity.

### Phase 4 — Operations / Supervisor shell

Migrate:

- Today Needs Attention;
- booking/assignment;
- blocks/schedule;
- live/progress;
- quotes/leads/conversions;
- incidents/customer operational support.

Acceptance: blocked day/zero active jobs disables live monitoring.

### Phase 5 — Business Administration shell

Migrate back-office modules in groups:

1. system/readiness/security;
2. accounting/payroll/tax;
3. inventory/catalog;
4. media/content/SEO;
5. DAIP governance/media.

No module starts background polling merely because the Admin shell is open.

### Phase 6 — Customer App shell

Keep public SEO pages static. Consolidate interactive customer flows into a coherent Customer App:

- booking;
- account/garage;
- progress;
- quote/payment;
- completed summary/review/maintenance.

### Phase 7 — compatibility cleanup

Only after production/staging evidence:

- convert old routes to permanent compatibility redirects where safe;
- remove duplicated route copies;
- remove unused bundles;
- tighten API namespaces/capability checks.

## 17. Build 263 acceptance criteria

The first modularization build should be considered successful when:

1. four shells exist as explicit source entities;
2. a single registry describes each shell;
3. every current top-level interface is assigned a target owner or platform-core status;
4. customer/staff registration-to-module rules are documented;
5. runtime state/timer rules are centralized in documentation;
6. no production route is broken;
7. no privilege is broadened;
8. Build 262 CPU protections remain intact;
9. SEO public pages remain static/crawlable;
10. historical release checks still pass.

## 18. Architectural non-goals

Build 263 should **not**:

- rewrite Rosie in React/Vue/another framework merely to modularize;
- split into four repositories;
- split into four Cloudflare deployments;
- create four databases;
- duplicate authentication systems;
- allow staff self-registration;
- move authoritative payments/inventory/accounting into the browser;
- wake inactive modules in the background;
- resume broad feature expansion before CPU stability is demonstrated.

## 19. Core principle going forward

Every new feature must answer four questions before implementation:

1. **Which application shell owns it?**
2. **Which registered identities may access it?**
3. **Under what operational state should it be awake?**
4. **Why does any recurring server call need to exist?**

If those answers are unclear, the feature is not ready to be added.

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
