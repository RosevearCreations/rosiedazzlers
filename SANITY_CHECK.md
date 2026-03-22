
# Sanity Check

## Core pages to test
- `/`
- `/book`
- `/login`
- `/my-account`
- `/progress`
- `/admin-login`
- `/admin`
- `/admin-jobsite`
- `/admin-staff`
- `/admin-customers`
- `/admin-app`
- `/admin-notifications`

## New checks in this pass
- Booking add-ons render with left/top aligned checkboxes
- Admin app-management screen loads and saves settings
- Notifications queue loads for Admin/manager roles
- Dashboard/menu link to notifications appears correctly

## SQL to run
- `sql/2026-03-22_admin_notifications_and_settings_persistence.sql`


## Sanity check additions

After this pass test:
- `/admin-jobsite` image upload + annotation creation
- `/progress?token=...` annotation visibility and reply flow
- `/admin-notifications` retry visible queued items
- feature flag changes in `/admin-app` affecting customer chat / annotation availability
