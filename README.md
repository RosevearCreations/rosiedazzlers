# Rosie Dazzlers

Current dev snapshot includes:
- public booking flow with package/add-on loading fixed
- customer login/account/garage foundation
- staff/admin login and dashboard foundation
- screen-by-screen Customer, Detailer, and Admin passes
- picture-first observation workflow foundation
- threaded progress conversation foundation
- admin app-management settings persistence
- admin notifications queue screen
- admin analytics + recovery views
- catalog management for systems and consumables
- stronger SEO/structured-data foundation

## Recommended next run order
1. Run any new SQL migrations in `sql/`
2. Deploy
3. Test:
   - `/book`
   - `/login`
   - `/my-account`
   - `/admin-login`
   - `/admin-jobsite`
   - `/progress`
   - `/admin-app`
   - `/admin-notifications`
   - `/admin-analytics`
   - `/admin-catalog`

## New in this pass
- Admin can review session journeys and abandoned orders.
- Recovery emails can be queued from the analytics screen.
- Catalog items can be maintained and reordered from the admin interface.
- Notification processing can dispatch to provider webhooks with retry/backoff.
- SEO helpers now add keywords, canonical tags, and structured data.


## March 24, 2026 additions
- Public gear and consumables pages can now read from the live `catalog_items` table through `/api/catalog_public` with JSON fallbacks.
- Catalog items now support equipment ratings, brand/model, storage location, and acquisition date.
- Admin App Management now stores abandoned-order recovery templates and rules.
- Notification recovery/dispatch foundations continue to use queue rules and retry fields.

## March 24, 2026 repairs in this pass
- Added provider-specific recovery-message rules, preview generation, and test-send support from App Management.
- Added deeper thread moderation foundations with comment thread status, moderation metadata, and a staff moderation endpoint.
- Added per-item reorder actions, low-stock alert tracking, and reorder timestamps/notes in Admin Catalog.
- Fixed malformed H1 markers on core public pages and tightened several public page titles/meta descriptions.
- Added a new migration: `sql/2026-03-24_recovery_threads_catalog_alerts.sql`.
