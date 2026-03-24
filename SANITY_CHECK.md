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
- `/admin-analytics`
- `/admin-catalog`

## New checks in this pass
- Analytics overview loads top pages, countries, referrers, journeys, and abandoned orders.
- Recovery queueing works from `/admin-analytics`.
- Catalog items load/save in `/admin-catalog`.
- Notification processing can attempt provider dispatch and set retry timing.
- Core public pages still render the correct H1/title/meta content.

## SQL to run
- `sql/2026-03-24_catalog_recovery_and_dispatch.sql`


## Sanity check update
- Added public catalog endpoint and wired gear/consumables pages to prefer DB-backed inventory.
- Added catalog rating fields and recovery template/rule settings migration.
- Updated admin catalog UI and app management UI accordingly.

## Additional checks from this pass
- `/admin-app` can save provider-specific recovery rules and generate/send a recovery preview test.
- `/admin-catalog` shows low-stock items and can create/resolve per-item reorder alerts.
- `/api/admin/progress_comment_moderate` can hide/remove customer thread items without deleting records.
- Core pages `/`, `/services`, and `/pricing` now render proper H1 content again.

## SQL to run now
- `sql/2026-03-24_recovery_threads_catalog_alerts.sql`
