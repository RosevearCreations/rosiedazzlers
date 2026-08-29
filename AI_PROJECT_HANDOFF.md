# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 269  
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

The permanent runtime rule is:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; operational state decides whether an authorized module actually wakes.**

Opening a launcher/module home must not load unrelated business datasets.

## Role/module authority

Current staff role ceilings:

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

Per-user module grants continue to live in `staff_users.permissions_profile.module_access`; explicit Build 269 action overrides use `staff_users.permissions_profile.action_access`; global availability continues to use `app_management_settings.module_runtime_flags`. A role/module ceiling is always checked before an action grant, so a per-user action cannot escape the role's module ceiling. Admin remains all-modules/all-actions by design.

### Build 267 database acceptance

Development evidence supplied on 2026-08-29 confirms:

- the expanded `staff_users_role_code_check` contains all eight roles;
- `staff_role_module_defaults` is stored in `app_management_settings`;
- the verified Administrator module profile contains `detailer`, `operations`, `admin`, `it`, `finance`, `daip`, and `socials` all `true`.

Development also exposed historical schema drift: `staff_users.permissions_profile` had existed as `text` even though later aggregate schema documentation described it as `jsonb`. The schema-tolerant Build 267 migration was used successfully. Build 269 now normalizes TEXT or JSONB at runtime and writes back using the observed database representation. Do not blindly change the column type until every consumer and actual environment are audited.

## Private navigation

`/app/` is the **Staff App Launcher**, not the Business Administration module. `/app/admin/` is the Business Administration home. Build 269 adds an explicit **Public Site** return control to the launcher and the shared protected-page return bar. Each allowed module has a module home with categorized static cards. Protected legacy pages render their owning module hierarchy instead of the historical flat Admin menu.

Canonical authorities:

- `data/app_modules.json`
- `data/internal_navigation.json`
- `data/route_module_ownership.json`
- `data/action_permissions.json`
- `docs/modular-app/README.md`
- `assets/app-core/module-resolver.js`
- `assets/app-core/module-navigation.js`
- `functions/api/_lib/staff-auth.js`
- `functions/api/_lib/permissions-profile.js`
- `functions/api/_lib/action-permissions.js`
- `sql/2026-08-29_build267_role_module_hierarchy.sql`

## Build 269 action-permission convergence

Build 269 introduces explicit action names without discarding the legacy capability bridge in one unsafe step. Initial action families include Detailer job/message actions, Operations schedule/assignment/customer actions, Administration staff/settings actions, I.T. runtime/notification/module actions, Finance view/post/reconcile, DAIP view/manage and Socials view/manage/publish.

The existing notification queue is retained. Its authorization is now separated from unrelated broad capabilities:

- notification list/read requires `it.notifications.view`;
- manual notification processing/retry requires `it.notifications.process`.

Focused roles receive role-safe defaults from `data/action_permissions.json`; an explicit `action_access` value may narrow/allow an action only inside the user's module ceiling. No recurring notification polling was added.

## Wake/sleep and CPU rules

- Detailer performs a bounded assigned-work load; no eligible open job means no live-job bundle/feed/media/message monitor.
- The live Detailer bundle wakes only for Arrived/Detailing/Paused work and uses manual/event-driven updates rather than polling.
- Operations loads no operational dataset until Today/Schedule/Blocks/Assignments/Live is explicitly selected.
- Finance, Administration, I.T., DAIP and Socials shells load no subsystem datasets merely because they are open.
- Customer live progress uses active-job-only bounded refresh and stops when hidden/inactive.
- Module/runtime-flag resolution is cached and timer-free.
- Permission to access a notification/action does not create a timer; real events/manual actions invoke work.
- Ambiguous non-idempotent writes are not automatically replayed after 5xx/timeouts.
- Static Pages traffic stays outside Functions; `_routes.json` limits Functions to `/api/*`.

## Public/service state retained

Build 265 service convergence remains current:

- 24 add-ons have canonical detailed service pages;
- condition-sensitive work uses starting-price/condition-assessed wording rather than misleading flat final prices;
- Headlight Restoration, carpet/extraction, pet hair, odour, engine work, coatings and similar variable work remain quote-safe;
- duplicate service intents redirect to canonical URLs;
- public pages remain static-first, responsive and one-H1 compliant;
- approved R2 image hydration and visual placeholders remain supported.

## Installable application direction

Current source provides an installable PWA/service-worker foundation and event-driven push notification handlers. Build 269 synchronizes launcher/module/cache identity at 269. Remote push delivery is **not yet complete** because browser subscriptions and server-side Web Push delivery still need a stored subscription authority/provider integration.

Planned packaging remains one shared codebase:

- Web/PWA now;
- Capacitor later for Android/iOS native push, camera/network/deep-link benefits;
- Tauri later only where true Windows/macOS system-tray/background-native behavior is useful.

## Build 268 repository hygiene

Build 268 removed source-tree history/bloat without changing the database:

- one canonical migration copy under `sql/` instead of duplicate root SQL files;
- root API/function shims removed; Cloudflare Functions live under `functions/api/`;
- retired/historical Markdown removed from the working tree; Git history is the archive;
- stable canonical module registry names introduced;
- comment-only/no-DDL “migration” marker files removed;
- generated report/import-review artifacts removed;
- `.gitignore` added to prevent ZIPs, local caches, logs and root migrations from accumulating again;
- release checking modernized around current capabilities instead of obsolete historical marker files.

Build 269 continues that convergence by replacing selected duplicate `/api/admin/` staff/auth/notification implementations with tiny compatibility wrappers to canonical root handlers.

## Current release guard

`scripts/release_check.py` is the current capability-based guard. Build 269 source acceptance currently covers:

- canonical repository shape;
- role/module ceilings and no-idle-poll rules;
- schema-tolerant Build 267 migration;
- TEXT/JSONB permissions-profile runtime compatibility;
- Build 269 launcher/cache identity;
- explicit action registry and I.T. notification authorization;
- Cloudflare Functions static/syntax checks;
- route-copy parity;
- service/pricing content mirrors;
- customer-profile quality;
- global one-H1 SEO guard.

## What still requires deployed/external evidence

Do not call these complete from source alone:

- confirm the current Build 269 `dev` head is the Development Pages deployment and verify cache/script parity;
- authenticated runtime acceptance for Admin and each focused role, including direct-URL/API denial outside its module/action ceiling;
- verify Staff App Launcher → Public Site and protected page → Public Site navigation in the deployed browser;
- representative Cloudflare evidence with `Exceeded CPU Time Limits = 0`, script exceptions = 0 and memory exceeded = 0;
- Stripe test payment/refund/webhook acceptance;
- PayPal sandbox decision/acceptance if retained;
- real Web Push subscription/provider delivery and failure evidence;
- inventory posting/reversal/idempotency acceptance;
- backup/restore and Cloudflare rollback rehearsal;
- real-device mobile/PWA/accessibility acceptance;
- Search Console/Google Business Profile evidence;
- DAIP private processing/derivative/retry/dead-letter acceptance before any public handoff.

## Immediate engineering direction

1. Complete deployed Build 269 role/module/action acceptance.
2. Add stored Web Push subscriptions/preferences and server-side event delivery using the existing notification queue; do not add polling.
3. Continue replacing broad legacy capabilities with explicit action permissions module by module.
4. Move Customer ↔ Detailer/Operations messaging toward push/unread-event wakeups.
5. After web/PWA behavior is proven, proceed toward Capacitor mobile packaging and later Tauri tray packaging where justified.

The objective is not simply slower polling: **dormant modules should generate no periodic server traffic and real business events should wake only the people/modules that need them.**

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Update them in place. Git history replaces historical working-tree copies.
