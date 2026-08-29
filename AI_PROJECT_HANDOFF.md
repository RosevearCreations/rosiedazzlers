# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 268  
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

Per-user grants continue to live in `staff_users.permissions_profile.module_access`; global availability continues to use `app_management_settings.module_runtime_flags`. Server-side action/scope/privacy/DAIP checks remain authoritative even when a module is visible.

### Build 267 database acceptance

Development evidence supplied on 2026-08-29 confirms:

- the expanded `staff_users_role_code_check` contains all eight roles;
- `staff_role_module_defaults` is stored in `app_management_settings`;
- the verified Administrator module profile contains `detailer`, `operations`, `admin`, `it`, `finance`, `daip`, and `socials` all `true`.

Development also exposed historical schema drift: `staff_users.permissions_profile` had existed as `text` even though later aggregate schema documentation described it as `jsonb`. The schema-tolerant Build 267 migration was used successfully. Do not blindly change that column type until every consumer and actual environment are audited.

## Private navigation

`/app/` is the role-aware staff launcher. Each allowed module has a module home with categorized static cards. Protected legacy pages render their owning module hierarchy instead of the historical flat Admin menu.

Canonical authorities are now stable names rather than build-number copies:

- `data/app_modules.json`
- `data/internal_navigation.json`
- `data/route_module_ownership.json`
- `docs/modular-app/README.md`
- `assets/app-core/module-resolver.js`
- `assets/app-core/module-navigation.js`
- `functions/api/admin/_lib/staff-auth.js`
- `sql/2026-08-29_build267_role_module_hierarchy.sql`

## Wake/sleep and CPU rules

- Detailer performs a bounded assigned-work load; no eligible open job means no live-job bundle/feed/media/message monitor.
- The live Detailer bundle wakes only for Arrived/Detailing/Paused work and uses manual/event-driven updates rather than polling.
- Operations loads no operational dataset until Today/Schedule/Blocks/Assignments/Live is explicitly selected.
- Finance, Administration, I.T., DAIP and Socials shells load no subsystem datasets merely because they are open.
- Customer live progress uses active-job-only bounded refresh and stops when hidden/inactive.
- Module/runtime-flag resolution is cached and timer-free.
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

Current source provides an installable PWA/service-worker foundation and event-driven push notification handlers. Remote push delivery is **not yet complete**.

Planned packaging remains one shared codebase:

- Web/PWA now;
- Capacitor later for Android/iOS native push, camera/network/deep-link benefits;
- Tauri later only where true Windows/macOS system-tray/background-native behavior is useful.

## Build 268 repository hygiene

Build 268 deliberately removes source-tree history/bloat without changing the database:

- one canonical migration copy under `sql/` instead of duplicate root SQL files;
- root API/function shims removed; Cloudflare Functions live under `functions/api/`;
- retired/historical Markdown removed from the working tree; Git history is the archive;
- old build-numbered module registries replaced by stable canonical registry names;
- comment-only/no-DDL “migration” marker files removed;
- generated report/import-review artifacts removed;
- oversized committed fallback images optimized in place without changing their public paths/dimensions;
- `.gitignore` added to prevent ZIPs, local caches, logs and root migrations from accumulating again;
- release checking is being modernized around current capabilities instead of forcing obsolete historical marker files to remain forever.

This reduces deploy/checkout weight and, more importantly, removes multiple competing copies of the same authority.

## What still requires deployed/external evidence

Do not call these complete from source alone:

- deploy the Build 268 cleaned source to the Development Pages project and confirm cache/script parity;
- authenticated runtime acceptance for each focused role and direct-URL/API denial outside its module ceiling;
- representative Cloudflare evidence with `Exceeded CPU Time Limits = 0`, script exceptions = 0 and memory exceeded = 0;
- Stripe test payment/refund/webhook acceptance;
- PayPal sandbox decision/acceptance if retained;
- real notification-provider delivery and failure evidence;
- inventory posting/reversal/idempotency acceptance;
- backup/restore and Cloudflare rollback rehearsal;
- real-device mobile/PWA/accessibility acceptance;
- Search Console/Google Business Profile evidence;
- DAIP private processing/derivative/retry/dead-letter acceptance before any public handoff.

## Immediate engineering direction

After Build 268 Development acceptance, proceed to the event-driven permission/notification program in `MASTER_VALUE_ROADMAP.md`. The objective is not simply slower polling: **dormant modules should generate no periodic server traffic and real business events should wake only the people/modules that need them.**

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Update them in place. Git history replaces historical working-tree copies.
