# Rosie Dazzlers — Missing Static Add-on Artwork Reconciliation

**Generated from full GitHub source audit:** Standard Theme Phase 2 CI run 39602138635 (2026-10-21).  
**Status:** 5 repairs staged on the separate add-on reconciliation branch; not deployed until protected merge and exact Cloudflare verification.

## Executive result

The full-checkout scanner processed **2,263** media references and **17** authored SVG files. Of **73 missing-local-image references**, all point to only **17 distinct** missing PNG filenames under \`/assets/addons/\`.

Five of those 17 names already have an authored, service-matching SVG asset checked into this repository. Their **25** local fallback references have been changed to that existing vector artwork, across \`assets/site.js\` and both source/API copies of the landing-page and pricing-catalog data. The five exact corrected filenames are:

| Original broken local fallback | Verified existing vector |
|---|---|
| \`assets/addons/de_badging.png\` | \`assets/addons/de_badging.svg\` |
| \`assets/addons/de_ionizing_treatment.png\` | \`assets/addons/de_ionizing_treatment.svg\` |
| \`assets/addons/external_graphene_fine_finish.png\` | \`assets/addons/external_graphene_fine_finish.svg\` |
| \`assets/addons/external_wax.png\` | \`assets/addons/external_wax.svg\` |
| \`assets/addons/window_tinting.png\` | \`assets/addons/window_tinting.svg\` |

These are real repository assets, not generated customer proof. SVG has authored 1400×900 geometry for these five. Preserving their vector format avoids blurry upscale.

## Remaining 12 **exact PNG upload names**

These are legitimate future static upload slots. **Do not rename, automatically replace with fake customer evidence or assume the file exists.** Source references are maintained so that an approved correctly named image will be used.

**Upload directory:** \`assets/addons/\`  
**Minimum canvas:** 1200×800; **preferred export:** 1600×1067, subject to measuring the actual displayed card. Optimized PNG with meaningful transparency only where necessary.

| Category / illustrative intent | Exact target filename | Source references remaining |
|---|---|---:|
| Bug and tar removal | \`bug_tar_removal.png\` | 4 |
| Carpet shampoo | \`carpet_shampoo.png\` | 4 |
| Ceramic spray wax | \`ceramic_spray_wax.png\` | 4 |
| Fleet vehicle add-on | \`fleet_vehicle_add_on.png\` | 4 |
| Headlight restoration | \`headlight_restoration.png\` | 4 |
| Odor treatment | \`odor_treatment.png\` | 4 |
| Pet hair removal | \`pet_hair_removal.png\` | 4 |
| Salt stain treatment | \`salt_stain_treatment.png\` | 4 |
| Seat shampoo | \`seat_shampoo.png\` | 4 |
| Trim restoration | \`trim_restoration.png\` | 4 |
| Truck box wash | \`truck_box_wash.png\` | 4 |
| Windshield ceramic coating | \`windshield_ceramic_coating.png\` | 4 |

The 48 outstanding references are not necessarily 48 visible broken page elements. Many are alternate copies of catalog data. R2 package photography or a managed Photo Studio override may already cover the real card in production. A runtime image auditor must confirm its actual fallback behavior.

## Source precedence and protection

1. Approved current Photo Studio image or authoritative R2 package artwork.
2. Existing service-specific original public photo/graphics.
3. Local, genuinely authored service SVG/PNG fallback.
4. Safe visual-placeholder empty state if no approved image is loaded.

Never replace real customer before/after, receipts, private staff or DAIP evidence, booked vehicle photos, or reviews with generic theme artwork. An upload should be virus/MIME/size checked, rights-reviewed and assigned only to appropriate public slots. This local directory is different from \`assets/themes/standard/images/\` process imagery.

## Exact source change inventory

- \`assets/site.js\` — local Add-on fallbacks (5 corrections).
- \`data/landing_pages_content.json\` — public landing content (5 corrections).
- \`data/rosie_services_pricing_and_packages.json\` — catalog source (5 corrections).
- \`functions/api/data/landing_pages_content.json\` — Cloudflare Functions data copy (5 corrections).
- \`functions/api/data/rosie_services_pricing_and_packages.json\` — Cloudflare Functions catalog copy (5 corrections).

**All 25 corrections are SVG path substitutions only**. Existing prices, services, business rules, consent, booking/deposit, Admin approval and customer records are unchanged.

## Validation and release policy

Run \`node scripts/audit_standard_theme_media.mjs\`, then \`node scripts/addon_image_reconciliation_test.mjs\`. The scanner should report the remaining 12 unique local PNG names (48 references) and no new missing SVG path among the five corrected names. Inspect customer-facing pages at mobile/desktop sizes and verify actual R2/site-precedence behavior.

Do not claim Cloudflare Production GREEN until exact resulting \`main\` SHA, source checks, business acceptance and live Cloudflare runtime are verified. Staging this repair is not that verification.
