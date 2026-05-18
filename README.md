# Rosie Dazzlers — Build 150

**Updated:** 2026-05-17  
**Active branch target:** `dev`

This build focuses on Admin Catalog inventory image repair: saved DB rows no longer hide matching bundled consumables/tools images, and the inventory editor now has a preview plus existing-image picker.

## Highlights

- Admin Catalog inventory merge now hydrates blank saved `image_url` fields from matching bundled fallback rows.
- Inventory editor now has image preview, **Use matching bundled image**, **Pick existing image**, thumbnail search, and **Clear image** controls.
- Inventory image URL suggestions now include bundled consumables/tools image URLs.
- Release checks now include `scripts/inventory_image_picker_check.py`.
- `SUPABASE_SCHEMA.sql` and `sql/2026-05-17_build150_inventory_image_picker_and_fallback.sql` document the latest inventory/image fields.
- Local SEO habits remain active: one H1 per public page, clear title/meta wording, local Oxford/Norfolk language, and crawlable routes.

## Read next

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `SANITY_CHECK.md`
- `IMAGES.md`
- `DATABASE_STRUCTURE_CURRENT.md`
- `SUPABASE_SCHEMA.sql`
- `HANDOFF_NEXT_CHAT.md`

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
