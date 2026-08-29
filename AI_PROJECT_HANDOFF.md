# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 270  
**Updated:** 2026-08-29  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current platform

Rosie Dazzlers remains **one secured platform**, not separate codebases. The public website stays static-first for SEO while protected work is divided into eight independently loadable modules:

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

Opening a launcher/module home must not load unrelated business datasets.

## Current Development database authority

Supabase project: RosieDazzlers (`cwxhhvwpilmrfwxirixx`).

Verified Development drift that must remain supported:

- `staff_users.permissions_profile` is `text` in the long-lived Development database;
- `app_management_settings.value` is `jsonb`;
- Build 267 schema-tolerant role/module migration was applied successfully;
- current Admin module access was verified with all seven internal module flags true.

Do not blindly change `permissions_profile` to JSONB until all consumers and environments are audited. Build 269 runtime code accepts TEXT or JSONB and preserves the observed representation when saving staff.

## Role / module / action authority

Staff role ceilings:

| Role | Maximum modules |
|---|---|
| `detailer` | Detailer |
| `senior_detailer` | Detailer + Operations |
| `operations_manager` | Detailer + Operations |
| `accountant` | Finance |
| `it_specialist` | I.T. |
| `promoter` | Socials & Promotion |
| `daip_manager` | DAIP |
| `admin` | all seven internal staff modules |

Authorities:

- per-user module access: `staff_users.permissions_profile.module_access`;
- per-user action overrides: `staff_users.permissions_profile.action_access`;
- global module availability: `app_management_settings.module_runtime_flags`;
- action vocabulary/defaults: `data/action_permissions.json`.

A role/module ceiling is checked before action access, so an action grant cannot escape the role's module ceiling. Admin remains all-modules/all-actions by design.

## Private navigation

`/app/` is the **Staff App Launcher**, not Business Administration. `/app/admin/` is the Administration module home.

Build 269/270 navigation provides:

- explicit **Public Site** return on `/app/`;
- protected-page return bar: Public Site / All Staff Apps / Module Home / Account;
- module-local card hierarchy instead of the historical flat Admin menu.

Canonical authorities:

- `data/app_modules.json`
- `data/internal_navigation.json`
- `data/route_module_ownership.json`
- `data/action_permissions.json`
- `assets/app-core/module-resolver.js`
- `assets/app-core/module-navigation.js`
- `functions/api/_lib/staff-auth.js`
- `functions/api/_lib/permissions-profile.js`
- `functions/api/_lib/action-permissions.js`
- `sql/2026-08-29_build267_role_module_hierarchy.sql`

## Build 270 — event-driven Web Push foundation

Build 270 extends the existing notification queue; it does not add a second polling service.

### Database — applied to Development

Applied Supabase migration: `build270_push_subscription_authority`.

Canonical source:

- `sql/2026-08-29_build270_push_subscription_authority.sql`

Changes:

- added `notification_events.recipient_staff_user_id`;
- added server-only `notification_push_subscriptions`;
- owner is exactly one of staff/customer;
- endpoint is unique;
- active staff/customer indexes added;
- RLS enabled;
- direct `public`, `anon`, `authenticated` grants revoked;
- CRUD granted to `service_role` only.

Existing customer notification preferences are reused; no duplicate customer-preference table was introduced.

### Staff/customer subscription APIs

Staff:

- `/api/push_config`
- `/api/push_subscribe`
- `/api/push_unsubscribe`

Customer:

- `/api/customer_push_config`
- `/api/customer_push_subscribe`
- `/api/customer_push_unsubscribe`

Staff and customer ownership use different authenticated session cookies/routes. Customer remote push requires the existing customer `notification_opt_in=true`; browser permission alone never overrides Rosie consent.

### Client behavior

`assets/app-core/install-client.js`:

- never creates a PushSubscription automatically;
- subscription begins only after the user clicks **Enable device notifications**;
- chooses staff or customer API routes from the current app module;
- exposes only the VAPID public key to the browser;
- local test notifications continue to work if remote delivery is not configured;
- contains no polling timer.

`service-worker.js` remains thin/event-driven and contains push + notification-click handlers. Heavy Detailer/Operations/Admin/Finance modules are not eagerly precached.

Build/cache identity is synchronized at 270 across:

- `/app/`
- `/app/customer/`
- `module-resolver.js`
- `service-worker.js`
- `cache-health-controls.js`.

### Notification queue / live-event integration

The existing `notification_events` retry/backoff queue now recognizes `channel='push'` and staff/customer UUID recipients.

`provider-dispatch.js` has a fail-closed Web Push provider slot:

- `NOTIFICATIONS_PUSH_WEBHOOK_URL`
- `NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN` (or shared provider token fallback)

Customer event hooks may enqueue one secondary push event only when:

- Rosie customer notifications are opted in;
- the corresponding event preference permits it;
- an active customer push subscription exists.

Assigned-staff live-interaction events may enqueue one push event for `bookings.assigned_staff_user_id` when that staff account has an active subscription. Development schema verification confirmed this booking UUID column exists.

No per-device fan-out or recurring watcher runs inside booking/message requests. Actual device fan-out belongs in the push provider/sender.

## Notification action permissions

The existing notification administration remains scoped to explicit I.T. actions:

- list/read queue → `it.notifications.view`;
- process/retry queue → `it.notifications.process`.

This avoids granting `manage_staff` or other unrelated business powers merely to operate notification infrastructure.

## Wake/sleep and CPU rules

- no open Detailer job → no live job bundle/feed/media/message monitor;
- Detailer live bundle wakes only for eligible active work;
- Operations datasets load only when the operator selects a view;
- Finance/Admin/I.T./DAIP/Socials shells do not preload subsystem datasets;
- Customer progress refresh is bounded/active-state only;
- module/runtime flag resolution is cached and timer-free;
- notification/push permissions do not create timers;
- real events/manual actions invoke queue work;
- ambiguous non-idempotent writes are not auto-replayed;
- `_routes.json` keeps Functions under `/api/*`.

## Build 268 repository hygiene retained

Build 268 removed redundant source/history bloat while preserving Git history:

- migration history lives under `sql/`;
- Cloudflare Functions live under `functions/api/`;
- obsolete root API/shim copies and no-DDL marker migrations removed;
- historical Markdown/report artifacts removed from working tree;
- selected `/api/admin/` duplicates continue being replaced with tiny wrappers to canonical handlers;
- `.gitignore` protects against ZIP/log/cache/root-migration accumulation.

## Current release guard

`scripts/release_check.py` is the capability-based current guard. Build 270 protects:

- repository hygiene;
- module/role/action boundaries;
- no-idle-poll rules;
- schema-tolerant Build 267 authority;
- TEXT/JSONB staff-profile compatibility;
- Build 270 launcher/cache identity;
- server-only push migration/table authority;
- authenticated staff/customer push ownership;
- opt-in-only customer push;
- no VAPID private-key exposure in browser assets/config response fields;
- Functions syntax/static checks;
- route parity;
- service/pricing mirrors;
- customer-profile quality;
- global one-H1 SEO guard.

## Still requires deployed/external evidence

Do **not** call these complete from source/database setup alone:

- confirm current Build 270 `dev` SHA is the Development Pages deployment;
- deployed Staff App Launcher/Public Site navigation acceptance;
- Admin and each focused role menu/direct-URL/API acceptance;
- staff save/edit acceptance against the historical TEXT profile column;
- representative Cloudflare CPU/script/memory evidence;
- real VAPID key pair in a secret store;
- real encrypted Web Push provider/sender configuration and staff/customer delivery evidence;
- stale/410 push subscription revocation behavior;
- Stripe payment/refund/webhook acceptance;
- PayPal sandbox decision/acceptance if retained;
- inventory posting/reversal/idempotency acceptance;
- backup/restore and Cloudflare rollback rehearsal;
- real-device mobile/PWA/accessibility acceptance;
- Search Console/Google Business Profile evidence;
- DAIP private processing/derivative/retry/dead-letter acceptance.

## Immediate engineering direction

1. Complete Build 270 source guard and deployed Development acceptance.
2. Configure a secure VAPID sender/provider and prove one staff + one opted-in customer Web Push delivery.
3. Revoke stale/expired subscriptions based on real provider response evidence.
4. Continue converting broad legacy capabilities to explicit action permissions, beginning with Operations and Finance high-value mutations.
5. Finish customer ↔ Detailer/Operations message unread/deep-link behavior using event-driven wakeups.
6. After PWA/event behavior is proven, move toward Capacitor mobile packaging; Tauri tray packaging remains later/optional.

The target is unchanged: **dormant modules generate no periodic server traffic; real business events wake only the users/modules that need them.**

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Update them in place; Git history is the archive.
