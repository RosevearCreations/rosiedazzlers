# Database Structure Current — Build 140

Build 140 adds optional DB-first foundation tables in:

`sql/2026-05-10_build140_value_add_roadmap_foundations.sql`

## New optional foundations

- `app_option_libraries` — reusable dropdown libraries.
- `app_media_library` — reusable media records for services, add-ons, gallery, reviews, inventory, and landing pages.
- `app_content_entries` — reusable content entries for gallery, reviews, landing sections, FAQs, and proof blocks.

## Existing app-settings fallback

Until the migration is applied and editors are finished, the app still uses:

- `app_management_settings.catalog_dropdown_options`
- `app_management_settings.landing_pages`
- `app_management_settings.review_proof`
- `app_management_settings.media_library`
- bundled JSON files in `data/`
