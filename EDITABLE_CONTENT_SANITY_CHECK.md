# Editable Content and Hard-Coding Sanity Check — Build 188

## Result

This audit identifies **40 content/configuration domains**. **35 should be editable** through a database table, an Admin App setting, or a stable fallback file. **5 should remain controlled** by environment secrets, reviewed code, schema migrations, or append-only records.

Build 188 fixes the immediate water-rule deployment problem by making water restrictions DB-first with one stable JSON fallback. Mutable municipal wording is no longer stored in `landing_pages_public.js`.

## Editable status summary

| Status | Count | Meaning |
|---|---:|---|
| `db_with_file_fallback` | 10 | Database/app setting is preferred with a deploy-safe file fallback. |
| `partial_hardcoded` | 16 | Some content is still repeated in HTML or JavaScript and should be migrated. |
| `db_managed` | 7 | A database-managed foundation already exists. |
| `file_managed` | 2 | Editable file exists, but a DB/admin workflow is still recommended. |

## Highest-priority remaining migrations

1. Move the large default landing-page content objects out of JavaScript into a stable JSON fallback plus `app_management_settings.landing_pages`.
2. Move business identity, contact details, service-area summary, structured-data values, and social links into one business-profile setting.
3. Finish editable policy copy for deposits, cancellations, refunds, driveway access, water/power, and customer requirements.
4. Finish editable notification, receipt, refund, quote, proposal, invoice, and social caption templates.
5. Consolidate navigation/footer links, admin dropdown option libraries, analytics event definitions, and intake options.
6. Replace build-specific media requirement files with a stable fallback file plus DB-managed media tasks.

## Domains that should be editable

| # | Domain | Current status | Recommended authority | Priority |
|---:|---|---|---|---|
| 1 | Water restriction rules | `db_with_file_fallback` | `public.water_restriction_rules` | critical |
| 2 | Service area, travel tier, parking, noise, and access rules | `db_with_file_fallback` | `public.service_area_rules` | critical |
| 3 | Pricing packages | `db_with_file_fallback` | `app_management_settings.pricing_catalog` | critical |
| 4 | Add-ons and package dependencies | `db_with_file_fallback` | `app_management_settings.pricing_catalog` | critical |
| 5 | Booking availability rules and slot labels | `db_with_file_fallback` | `booking_rules / app_management_settings` | high |
| 6 | Public booking requirements | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules` | high |
| 7 | Travel pricing and callout controls | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules.travel_pricing` | high |
| 8 | Tax rate, fuel surcharge, material surcharge, and minimum callout | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules.price_controls` | high |
| 9 | Deposit, cancellation, rescheduling, and refund policy copy | `partial_hardcoded` | `site_content_blocks / app_management_settings` | high |
| 10 | Landing page content | `partial_hardcoded` | `app_management_settings.landing_pages` | critical |
| 11 | Town/local SEO page content | `partial_hardcoded` | `app_management_settings.landing_pages / local_seo_task_cards` | critical |
| 12 | Page titles, meta descriptions, canonical and schema content | `partial_hardcoded` | `landing_pages / content blocks / page SEO settings` | high |
| 13 | FAQ entries | `db_with_file_fallback` | `public.public_faq_entries` | high |
| 14 | Help articles and education content | `partial_hardcoded` | `public.site_content_blocks` | high |
| 15 | Homepage cards and calls to action | `db_managed` | `public.site_content_blocks` | medium |
| 16 | Service blurbs | `db_managed` | `public.site_content_blocks` | medium |
| 17 | Specials and promotions | `db_managed` | `public.site_content_blocks / promotions table` | high |
| 18 | Gift card content and settings | `partial_hardcoded` | `public.site_content_blocks / app_management_settings` | medium |
| 19 | Fleet and maintenance plan content | `db_managed` | `public.site_content_blocks` | medium |
| 20 | Trust, review, and testimonial blocks | `db_managed` | `trust_block_items / approved review records` | high |
| 21 | Gallery and local proof media | `db_with_file_fallback` | `before_after_gallery / media records` | high |
| 22 | Media privacy and consent status | `db_managed` | `media consent records / gallery records` | critical |
| 23 | Image and video requirements | `file_managed` | `media_asset_tasks / app management settings` | medium |
| 24 | Notification templates | `partial_hardcoded` | `notification_templates` | high |
| 25 | Receipt and refund email templates | `partial_hardcoded` | `notification_templates` | high |
| 26 | Social caption templates | `partial_hardcoded` | `social_caption_templates` | medium |
| 27 | Business identity, contact details, service area summary, and social links | `partial_hardcoded` | `app_management_settings.business_profile` | critical |
| 28 | Business hours, holiday closures, and seasonal availability | `partial_hardcoded` | `app_management_settings.business_hours` | high |
| 29 | Navigation and footer labels/links | `partial_hardcoded` | `app_management_settings.site_navigation` | medium |
| 30 | Admin dropdown option libraries | `partial_hardcoded` | `app_management_settings.option_libraries` | medium |
| 31 | Accounting mappings and HST/GST review settings | `db_managed` | `accounting mapping tables / app settings` | high |
| 32 | Customer quote, proposal, invoice, and receipt templates | `partial_hardcoded` | `notification_templates / document_templates` | high |
| 33 | Lead intake topics, condition options, and recommendation copy | `partial_hardcoded` | `app_management_settings.intake_options` | medium |
| 34 | Analytics event definitions and conversion labels | `partial_hardcoded` | `app_management_settings.analytics_event_definitions` | medium |
| 35 | Vendor directory and service/product reference links | `file_managed` | `vendor_directory / product catalog` | low |

## Domains that should not be normal content edits

| Domain | Required authority | Reason |
|---|---|---|
| API keys, payment secrets, session secrets, and R2 credentials | `Cloudflare environment variables / secrets` | Secrets must never be stored in public JSON or editable content tables. |
| Authentication and authorization enforcement | `code plus staff capability records` | Role labels may be editable, but permission enforcement must remain code/schema controlled. |
| Database schema and migrations | `version-controlled SQL migrations` | Schema changes require review and deployment, not content editing. |
| Webhook signature verification and payment settlement logic | `code plus environment secrets` | Security-critical payment logic must not be content editable. |
| Append-only audit history and financial event records | `append-only database records` | Corrections should be new events, not edits that erase history. |

## Build 188 water-rule authority

Water restrictions now use this authority order:

1. `public.water_restriction_rules`
2. `app_management_settings.water_restriction_rules`
3. `data/water_restriction_rules.json`

Service-area rows store only `water_rule_key`; runtime APIs derive the current water-rule wording. The fallback JSON remains necessary so public pages and booking guidance still work before SQL is applied or during a database outage.

## Editing rules

- Use the database/Admin App for routine edits after the Build 188 SQL is applied.
- Keep the stable JSON fallback synchronized after a verified rule change so deployments remain safe during outages.
- Do not place mutable municipal rule text back into JavaScript, HTML, or pricing-catalog inline objects.
- Keep secrets and security-critical logic out of editable content stores.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

