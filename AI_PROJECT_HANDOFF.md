# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 271  
**Updated:** 2026-08-29  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current platform boundary

Rosie Dazzlers remains one secured platform with a static-first public website and eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent runtime rule:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; operational state decides whether an authorized module actually wakes.**

`/app/` is the **Staff App Launcher**. `/app/admin/` is Administration. Protected staff navigation includes Public Site / All Staff Apps / Module Home / Account. `main` / live Production is not part of ordinary Development work and remains untouched unless promotion is explicitly requested.

## Current Development data authority

Supabase Development project: RosieDazzlers (`cwxhhvwpilmrfwxirixx`).

Important historical schema drift that current runtime must support:

- `staff_users.permissions_profile` is `text` in the long-lived Development database;
- `app_management_settings.value` is `jsonb`;
- Build 267 schema-tolerant role/module migration is applied;
- Admin has all seven internal module grants.

Do not blindly convert `permissions_profile` to JSONB. Build 269/271 parsing accepts TEXT or object JSON and preserves the observed representation when staff profiles are saved.

## Role / module / action authority

Role ceilings:

| Role | Maximum modules |
|---|---|
| `detailer` | Detailer |
| `senior_detailer` | Detailer + Operations |
| `operations_manager` | Detailer + Operations |
| `accountant` | Finance |
| `it_specialist` | I.T. |
| `promoter` | Socials & Promotion |
| `daip_manager` | DAIP |
| `admin` | all seven internal modules |

Authorities:

- module grants: `staff_users.permissions_profile.module_access`;
- per-user action overrides: `staff_users.permissions_profile.action_access`;
- action vocabulary/defaults: `data/action_permissions.json`;
- global module availability: `app_management_settings.module_runtime_flags`.

Module/role ceilings are evaluated before action access. Admin remains all-modules/all-actions by design.

Build 271 additionally makes the transition `x-staff-user-id` / `x-staff-email` bridge path parse `permissions_profile` through the same helpers as real staff sessions. Supported auth paths therefore no longer interpret the historical TEXT profile differently.

## Build 270 retained — event-driven Web Push

Build 270 is infrastructure-complete in Development:

- `notification_push_subscriptions` is server-only with RLS enabled;
- browser roles have no direct table grants;
- staff/customer subscription ownership is separate;
- customer remote push requires the existing Rosie notification opt-in;
- VAPID key material is stored in Supabase Vault, not Git/browser source;
- service-role-only public/private VAPID RPCs exist;
- Supabase Edge Function `rosie-web-push` is deployed with JWT verification and pinned `web-push@3.6.7`;
- stale 404/410 subscriptions are revoked by the sender;
- the existing `notification_events` queue remains the only retry/backoff authority;
- I.T. has a bounded remote-push test path;
- no push polling service exists.

Do not re-create the push table, VAPID keys, second queue, or sender on new-chat startup unless read-only verification proves drift.

## Build 271 — active communication boundary

Existing unread/viewed timestamps from Build 210 remain authoritative. No replacement message/read table was added.

Shared live communication states:

- active: `accepted`, `dispatched`, `arrived`, `detailing`, `paused`, `in_progress`, `active`;
- completed/closed/non-live states do not accept new live-message writes.

Completed progress history remains readable, but these write paths now fail closed after the job is no longer active:

- public-token customer progress comments;
- signed-in customer progress comments;
- Detailer live job notes/messages;
- associated live alert creation.

Push deep links now target context instead of only a module home:

- customer: `/progress.html?token=<token>#commentForm`;
- assigned staff: `/app/detailer/?job=<booking-id>#liveJobHost`.

The Detailer shell resolves a requested job only inside its existing bounded workspace, selects it once, and wakes the live-job bundle only if the normal runtime policy allows it. Missing links do not start a search/poll loop.

## Build 271 — explicit high-value Operations / Finance actions

Operations writes converted:

- assignment/crew changes → `operations.assignment.manage`;
- date, slot and range block/unblock writes → `operations.schedule.manage`.

Finance converted:

- payment application write → `finance.post`;
- bank reconciliation read → `finance.view`;
- bank reconciliation write → `finance.reconcile`;
- period-close read → `finance.view`;
- period-close write → `finance.period.close`.

`finance.period.close` is now an Accountant default. Converted high-risk writes do not enable the legacy admin-password fallback.

The action registry retains its Build 269 origin and is marked `extended_through_build: 271`.

## Wake/sleep and CPU rules

- no open Detailer job → no live job bundle/feed/media/message monitor;
- Detailer workspace is bounded and has no recurring poll;
- Operations datasets load only when selected;
- Customer progress uses active-state one-shot refresh and sleeps while hidden/inactive;
- completed jobs stop accepting live-message writes;
- push/deep-link behavior is event-driven and one-shot;
- module/runtime flags are cached and timer-free;
- no automatic replay of ambiguous non-idempotent writes;
- Functions remain under `/api/*`.

## Current validation authority

Cumulative guard: `scripts/release_check.py`  
Focused Build 271 guard: `scripts/build271_release_check.py`

Current source validation:

- Build 271 focused guard: **PASS**;
- cumulative Build 270 guard: **PASS** after aligning the local reconstruction with canonical GitHub copies;
- Cloudflare Pages Functions static check: **598 JS files**;
- 63 critical syntax checks;
- customer-profile quality: PASS;
- route-copy synchronization: PASS;
- global one-H1 SEO check: PASS;
- no new polling loop in Build 271 paths.

Canonical Build 271 detail: `BUILD271_SUMMARY.md`.

## Still requires deployed / external evidence

Do not mark these complete from source work alone:

- current Build 271 `dev` revision deployed to Development Pages;
- Admin + focused-role launcher/direct-URL/API matrix;
- real-session active-job customer ↔ Detailer deep-link/message acceptance;
- closed-job messaging UX acceptance;
- representative Cloudflare CPU/script/memory evidence;
- staff/customer remote Web Push delivery evidence where not already captured;
- Stripe deposit/final-balance/refund/webhook acceptance;
- PayPal sandbox decision/acceptance if retained;
- inventory posting/reversal/idempotency acceptance;
- Supabase restore + Cloudflare rollback rehearsal;
- DAIP private processing/retry/dead-letter acceptance;
- real-device PWA/mobile/accessibility acceptance.

## Immediate engineering direction

1. Finish deployed Build 271 role/action/message acceptance.
2. Continue Operations explicit actions for quote/customer mutations.
3. Continue Finance explicit actions for refund/settlement/high-risk posting paths.
4. Add quiet-hours/preference UI only where existing stored authority supports it; do not invent another preferences system.
5. Continue lazy module extraction for the highest-use Operations and Finance workflows.
6. Keep Stripe/PayPal/inventory/restore/DAIP blockers bridged to the current release rather than stale historical build numbers.
7. After the web/PWA event model is proven on real devices, proceed toward Capacitor mobile packaging; keep Tauri tray packaging optional/later.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Update them in place. Git history is the archive.
