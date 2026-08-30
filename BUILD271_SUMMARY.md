# Build 271 — Active communication boundaries and explicit high-value actions

**Date:** 2026-08-29  
**Branch:** `dev`  
**Database migration:** none

Build 271 converges existing communication/unread authorities and continues the role/module/action-permission extraction. It does not add a new message table, a second notification queue, or any recurring polling loop.

## Communication state

Existing Build 210 viewed/notified timestamps remain authoritative. Build 271 adds one shared active-live-state rule for message creation:

- active: `accepted`, `dispatched`, `arrived`, `detailing`, `paused`, `in_progress`, `active`;
- closed/non-live examples: `completed`, `complete`, `closed`, `cancelled`, `canceled`, `declined`, `no_show`.

Completed/inactive progress records remain readable. New live-message writes fail closed after the job is no longer active.

Applied to:

- public token customer progress comments;
- signed-in customer progress comments;
- Detailer live job notes/messages;
- customer/staff live alert creation.

## Push deep links

Customer live alerts now target the message context:

`/progress.html?token=<progress-token>#commentForm`

Assigned-staff alerts now target the requested Detailer job:

`/app/detailer/?job=<booking-id>#liveJobHost`

The Detailer shell resolves that job only from its existing bounded workspace, selects it once, wakes the live-job module only if the normal runtime policy permits it, then scrolls to the live-job area. Missing linked jobs do not trigger polling or automatic retry.

`app/detailer/index.html` and its asset cache-busters are aligned to Build 271.

## Bridge/session permission parity

Development still intentionally supports the historical `staff_users.permissions_profile` TEXT column.

Build 271 makes transition bridge authentication (`x-staff-user-id` / `x-staff-email`) use the same `parsePermissionsProfile` / `moduleAccessFromProfile` helpers as signed-in staff sessions. Module/action behavior therefore no longer depends on which supported staff-auth path resolved the actor.

The database column type was not changed.

## Explicit Operations actions

High-value Operations mutations no longer depend on broad legacy staff-management authority:

- booking/crew assignment → `operations.assignment.manage`;
- block date → `operations.schedule.manage`;
- unblock date → `operations.schedule.manage`;
- block slot → `operations.schedule.manage`;
- unblock slot → `operations.schedule.manage`;
- range block save → `operations.schedule.manage`;
- compatibility block save → `operations.schedule.manage`.

The converted writes do not enable the legacy admin-password fallback.

## Explicit Finance actions

- payment application save → `finance.post`;
- bank reconciliation read → `finance.view`;
- bank reconciliation save → `finance.reconcile`;
- accounting period-close read → `finance.view`;
- accounting period-close write → `finance.period.close`.

`finance.period.close` was added to the action registry and Accountant defaults. Detailer does not receive any Finance action.

The action registry retains its Build 269 origin and is marked `extended_through_build: 271` so the cumulative authority history remains explicit.

## Runtime / CPU properties

- no new `setInterval` or polling loop;
- completed jobs stop accepting live-message writes;
- push deep-link selection is one-shot and bounded;
- missing deep-linked jobs do not create background searches;
- existing Build 270 event-driven push queue/sender remains unchanged;
- existing service-worker global cache identity remains Build 270; only the Detailer module release/cache-busters advance to 271.

## Validation

Focused Build 271 guard: **PASS**

- bridge/session profile normalization parity;
- active-job message closure;
- customer/staff deep-link targets;
- Operations/Finance explicit actions;
- no new polling;
- JavaScript syntax checks for the changed Build 271 set.

Cumulative Build 270 guard: **PASS** after aligning the local reconstruction with the canonical GitHub copies of the Build 270 cache assertion and `progress/index.html` route mirror.

The cumulative result includes:

- Cloudflare Pages Functions static checks across 598 JS files;
- 63 critical syntax checks;
- customer-profile quality;
- route-copy synchronization;
- global one-H1 SEO check;
- prior module/no-idle-poll, push/Vault, action and schema-tolerance authorities.

## Still requires deployed/live evidence

Source completion is not the same as deployed acceptance. Keep these open until proven on the Development Pages deployment:

- current Build 271 `dev` SHA is the deployed Development revision;
- focused-role direct URL/API matrix (Detailer, Senior Detailer, Operations Manager, Accountant, I.T. Specialist, Promoter, DAIP Manager, Admin);
- active-job customer ↔ Detailer message/deep-link behavior on real sessions/devices;
- closed-job message rejection UX;
- representative Cloudflare CPU/script/memory evidence;
- staff and opted-in customer remote Web Push delivery evidence if not already captured;
- Stripe test acceptance, PayPal sandbox decision, inventory posting/reversal acceptance, restore/rollback rehearsal and DAIP processing evidence.

`main` / live Production remains untouched.
