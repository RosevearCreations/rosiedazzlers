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
