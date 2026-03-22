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

## New in this pass
- Admin settings now load/save through `app_management_settings`
- Notification queue can be reviewed in `/admin-notifications`
- Menu/dashboard updated for notifications
- Docs snapshot refreshed again
