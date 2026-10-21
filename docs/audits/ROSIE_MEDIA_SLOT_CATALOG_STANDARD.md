# Rosie Dazzlers — Master Visual Slot & Upload Filename Catalogue

> **Build 611 ownership separation:** This is the historical **all-target** inventory, including employee/Photo Studio-managed uploads. For the authoritative numbered list of images **employees are not meant to update**, use [ROSIE_APPLICATION_STATIC_IMAGE_CATALOG.md](ROSIE_APPLICATION_STATIC_IMAGE_CATALOG.md) and its machine-readable single source of truth `data/application_static_image_catalog.json`. Town banners are theme-owned static artwork; before/after, galleries, reviews, progress, and customer evidence are not. Do not treat numbered `slot-NNN` suggestions in this historical document as approved, permanent theme assets.

Generated from **repository registries** on 2026-10-20. This document inventories registered slots, not actual uploaded file existence.

## Source-of-truth distinction

- **617** Photo Studio targets in `data/build253_photo_targets.json`, across **62** page paths, with stable `target_key` identifiers. `target_key` is the exact Photo Studio assignment identifier; it MUST NOT be replaced by a guessed filename.
- **24** operational R2 media requirements from `data/media_requirements.json`. Its exact `r2_key` is the required upload path, not the Standard theme proposal.
- **38** visual placeholder classes in `data/visual_placeholder_registry.json`, including protected Admin/private-only diagrams.
- **27** reserved Standard theme filename proposals in `data/standard_theme_image_slots.json`.
- This union may contain duplicates representing the same visual. It is NOT a claim of 706 missing assets or 706 required uploads.
- Existing approved R2/Photo Studio assignments and active site-settings logo/banner take precedence. Never overwrite with placeholder media.
- Recommended canvases below are **design targets proposed for unmeasured slots**, not authoritative dimensions from DOM bounding boxes or actual files. R2 requirement minima are source-backed where listed.

## A. Photo Studio registry breakdown

| Type | Registered targets |
|---|---:|
| `before_after_pair` | 216 |
| `landing_gallery` | 108 |
| `page_background` | 60 |
| `proof_image` | 38 |
| `landing_hero` | 36 |
| `addon_card` | 24 |
| `package_card` | 20 |
| `home_card` | 20 |
| `site_asset` | 19 |
| `gallery_before_after_pair` | 16 |
| `gallery_evidence` | 12 |
| `gallery_technique` | 12 |
| `gallery_efficiency` | 12 |
| `service_hub` | 7 |
| `admin_context` | 4 |
| `faq_card` | 4 |
| `site_brand` | 4 |
| `gift_card` | 3 |
| `proof` | 1 |
| `maintenance_page` | 1 |

## B. All 617 registered Photo Studio image targets

- Suggested filename format: `assets/themes/standard/images/slot-NNN-<stable-slug>.webp`, as a **planning and upload name**.
- This filename does not activate Photo Studio assignment; staff must review and explicitly assign an approved asset to its exact target key.
- For before/after proofs, never substitute invented images that appear to be customer results.
- For site assets, verify the actual geometry before generating any image.

| # | Page | Slot type | Exact Photo Studio target key | Suggested Standard filename | Recommended canvas | Approval |
|---:|---|---|---|---|---|---|
| 1 | `/services` | `package_card` | `package:premium_wash:default` | `slot-001-package-premium-wash-default.webp` | 1600×900 | review required |
| 2 | `/services` | `package_card` | `package:premium_wash:small` | `slot-002-package-premium-wash-small.webp` | 1600×900 | review required |
| 3 | `/services` | `package_card` | `package:premium_wash:mid` | `slot-003-package-premium-wash-mid.webp` | 1600×900 | review required |
| 4 | `/services` | `package_card` | `package:premium_wash:oversize` | `slot-004-package-premium-wash-oversize.webp` | 1600×900 | review required |
| 5 | `/services` | `package_card` | `package:basic_detail:default` | `slot-005-package-basic-detail-default.webp` | 1600×900 | review required |
| 6 | `/services` | `package_card` | `package:basic_detail:small` | `slot-006-package-basic-detail-small.webp` | 1600×900 | review required |
| 7 | `/services` | `package_card` | `package:basic_detail:mid` | `slot-007-package-basic-detail-mid.webp` | 1600×900 | review required |
| 8 | `/services` | `package_card` | `package:basic_detail:oversize` | `slot-008-package-basic-detail-oversize.webp` | 1600×900 | review required |
| 9 | `/services` | `package_card` | `package:complete_detail:default` | `slot-009-package-complete-detail-default.webp` | 1600×900 | review required |
| 10 | `/services` | `package_card` | `package:complete_detail:small` | `slot-010-package-complete-detail-small.webp` | 1600×900 | review required |
| 11 | `/services` | `package_card` | `package:complete_detail:mid` | `slot-011-package-complete-detail-mid.webp` | 1600×900 | review required |
| 12 | `/services` | `package_card` | `package:complete_detail:oversize` | `slot-012-package-complete-detail-oversize.webp` | 1600×900 | review required |
| 13 | `/services` | `package_card` | `package:interior_detail:default` | `slot-013-package-interior-detail-default.webp` | 1600×900 | review required |
| 14 | `/services` | `package_card` | `package:interior_detail:small` | `slot-014-package-interior-detail-small.webp` | 1600×900 | review required |
| 15 | `/services` | `package_card` | `package:interior_detail:mid` | `slot-015-package-interior-detail-mid.webp` | 1600×900 | review required |
| 16 | `/services` | `package_card` | `package:interior_detail:oversize` | `slot-016-package-interior-detail-oversize.webp` | 1600×900 | review required |
| 17 | `/services` | `package_card` | `package:exterior_detail:default` | `slot-017-package-exterior-detail-default.webp` | 1600×900 | review required |
| 18 | `/services` | `package_card` | `package:exterior_detail:small` | `slot-018-package-exterior-detail-small.webp` | 1600×900 | review required |
| 19 | `/services` | `package_card` | `package:exterior_detail:mid` | `slot-019-package-exterior-detail-mid.webp` | 1600×900 | review required |
| 20 | `/services` | `package_card` | `package:exterior_detail:oversize` | `slot-020-package-exterior-detail-oversize.webp` | 1600×900 | review required |
| 21 | `/services` | `addon_card` | `addon:full_clay_treatment` | `slot-021-addon-full-clay-treatment.webp` | 1600×900 | review required |
| 22 | `/services` | `addon_card` | `addon:two_stage_polish` | `slot-022-addon-two-stage-polish.webp` | 1600×900 | review required |
| 23 | `/services` | `addon_card` | `addon:high_grade_paint_sealant` | `slot-023-addon-high-grade-paint-sealant.webp` | 1600×900 | review required |
| 24 | `/services` | `addon_card` | `addon:uv_protectant_applied_on_interior_panels` | `slot-024-addon-uv-protectant-applied-on-interior-panels.webp` | 1600×900 | review required |
| 25 | `/services` | `addon_card` | `addon:de_ionizing_treatment` | `slot-025-addon-de-ionizing-treatment.webp` | 1600×900 | review required |
| 26 | `/services` | `addon_card` | `addon:de_badging` | `slot-026-addon-de-badging.webp` | 1600×900 | review required |
| 27 | `/services` | `addon_card` | `addon:engine_cleaning` | `slot-027-addon-engine-cleaning.webp` | 1600×900 | review required |
| 28 | `/services` | `addon_card` | `addon:external_ceramic_coating` | `slot-028-addon-external-ceramic-coating.webp` | 1600×900 | review required |
| 29 | `/services` | `addon_card` | `addon:external_graphene_fine_finish` | `slot-029-addon-external-graphene-fine-finish.webp` | 1600×900 | review required |
| 30 | `/services` | `addon_card` | `addon:external_wax` | `slot-030-addon-external-wax.webp` | 1600×900 | review required |
| 31 | `/services` | `addon_card` | `addon:vinyl_wrapping` | `slot-031-addon-vinyl-wrapping.webp` | 1600×900 | review required |
| 32 | `/services` | `addon_card` | `addon:window_tinting` | `slot-032-addon-window-tinting.webp` | 1600×900 | review required |
| 33 | `/services` | `addon_card` | `addon:pet_hair_removal` | `slot-033-addon-pet-hair-removal.webp` | 1600×900 | review required |
| 34 | `/services` | `addon_card` | `addon:odor_treatment` | `slot-034-addon-odor-treatment.webp` | 1600×900 | review required |
| 35 | `/services` | `addon_card` | `addon:seat_shampoo` | `slot-035-addon-seat-shampoo.webp` | 1600×900 | review required |
| 36 | `/services` | `addon_card` | `addon:carpet_shampoo` | `slot-036-addon-carpet-shampoo.webp` | 1600×900 | review required |
| 37 | `/services` | `addon_card` | `addon:salt_stain_treatment` | `slot-037-addon-salt-stain-treatment.webp` | 1600×900 | review required |
| 38 | `/services` | `addon_card` | `addon:headlight_restoration_addon` | `slot-038-addon-headlight-restoration-addon.webp` | 1600×900 | review required |
| 39 | `/services` | `addon_card` | `addon:windshield_ceramic_coating` | `slot-039-addon-windshield-ceramic-coating.webp` | 1600×900 | review required |
| 40 | `/services` | `addon_card` | `addon:ceramic_spray_wax` | `slot-040-addon-ceramic-spray-wax.webp` | 1600×900 | review required |
| 41 | `/services` | `addon_card` | `addon:trim_restoration` | `slot-041-addon-trim-restoration.webp` | 1600×900 | review required |
| 42 | `/services` | `addon_card` | `addon:bug_tar_removal` | `slot-042-addon-bug-tar-removal.webp` | 1600×900 | review required |
| 43 | `/services` | `addon_card` | `addon:truck_box_wash` | `slot-043-addon-truck-box-wash.webp` | 1600×900 | review required |
| 44 | `/services` | `addon_card` | `addon:fleet_vehicle_add_on` | `slot-044-addon-fleet-vehicle-add-on.webp` | 1600×900 | review required |
| 45 | `/ceramic-coating` | `landing_hero` | `landing:ceramic-coating:hero` | `slot-045-landing-ceramic-coating-hero.webp` | 1920×1080 | permissioned |
| 46 | `/ceramic-coating` | `landing_gallery` | `landing:ceramic-coating:gallery:1` | `slot-046-landing-ceramic-coating-gallery-1.webp` | 1600×1200 | permissioned |
| 47 | `/ceramic-coating` | `landing_gallery` | `landing:ceramic-coating:gallery:2` | `slot-047-landing-ceramic-coating-gallery-2.webp` | 1600×1200 | permissioned |
| 48 | `/ceramic-coating` | `landing_gallery` | `landing:ceramic-coating:gallery:3` | `slot-048-landing-ceramic-coating-gallery-3.webp` | 1600×1200 | permissioned |
| 49 | `/` | `home_card` | `home:service:ceramic-coating` | `slot-049-home-service-ceramic-coating.webp` | 1600×900 | review required |
| 50 | `/pet-hair-removal` | `landing_hero` | `landing:pet-hair-removal:hero` | `slot-050-landing-pet-hair-removal-hero.webp` | 1920×1080 | permissioned |
| 51 | `/pet-hair-removal` | `landing_gallery` | `landing:pet-hair-removal:gallery:1` | `slot-051-landing-pet-hair-removal-gallery-1.webp` | 1600×1200 | permissioned |
| 52 | `/pet-hair-removal` | `landing_gallery` | `landing:pet-hair-removal:gallery:2` | `slot-052-landing-pet-hair-removal-gallery-2.webp` | 1600×1200 | permissioned |
| 53 | `/pet-hair-removal` | `landing_gallery` | `landing:pet-hair-removal:gallery:3` | `slot-053-landing-pet-hair-removal-gallery-3.webp` | 1600×1200 | permissioned |
| 54 | `/` | `home_card` | `home:service:pet-hair-removal` | `slot-054-home-service-pet-hair-removal.webp` | 1600×900 | review required |
| 55 | `/odor-removal` | `landing_hero` | `landing:odor-removal:hero` | `slot-055-landing-odor-removal-hero.webp` | 1920×1080 | permissioned |
| 56 | `/odor-removal` | `landing_gallery` | `landing:odor-removal:gallery:1` | `slot-056-landing-odor-removal-gallery-1.webp` | 1600×1200 | permissioned |
| 57 | `/odor-removal` | `landing_gallery` | `landing:odor-removal:gallery:2` | `slot-057-landing-odor-removal-gallery-2.webp` | 1600×1200 | permissioned |
| 58 | `/odor-removal` | `landing_gallery` | `landing:odor-removal:gallery:3` | `slot-058-landing-odor-removal-gallery-3.webp` | 1600×1200 | permissioned |
| 59 | `/` | `home_card` | `home:service:odor-removal` | `slot-059-home-service-odor-removal.webp` | 1600×900 | review required |
| 60 | `/headlight-restoration` | `landing_hero` | `landing:headlight-restoration:hero` | `slot-060-landing-headlight-restoration-hero.webp` | 1920×1080 | permissioned |
| 61 | `/headlight-restoration` | `landing_gallery` | `landing:headlight-restoration:gallery:1` | `slot-061-landing-headlight-restoration-gallery-1.webp` | 1600×1200 | permissioned |
| 62 | `/headlight-restoration` | `landing_gallery` | `landing:headlight-restoration:gallery:2` | `slot-062-landing-headlight-restoration-gallery-2.webp` | 1600×1200 | permissioned |
| 63 | `/headlight-restoration` | `landing_gallery` | `landing:headlight-restoration:gallery:3` | `slot-063-landing-headlight-restoration-gallery-3.webp` | 1600×1200 | permissioned |
| 64 | `/` | `home_card` | `home:service:headlight-restoration` | `slot-064-home-service-headlight-restoration.webp` | 1600×900 | review required |
| 65 | `/paint-correction` | `landing_hero` | `landing:paint-correction:hero` | `slot-065-landing-paint-correction-hero.webp` | 1920×1080 | permissioned |
| 66 | `/paint-correction` | `landing_gallery` | `landing:paint-correction:gallery:1` | `slot-066-landing-paint-correction-gallery-1.webp` | 1600×1200 | permissioned |
| 67 | `/paint-correction` | `landing_gallery` | `landing:paint-correction:gallery:2` | `slot-067-landing-paint-correction-gallery-2.webp` | 1600×1200 | permissioned |
| 68 | `/paint-correction` | `landing_gallery` | `landing:paint-correction:gallery:3` | `slot-068-landing-paint-correction-gallery-3.webp` | 1600×1200 | permissioned |
| 69 | `/` | `home_card` | `home:service:paint-correction` | `slot-069-home-service-paint-correction.webp` | 1600×900 | review required |
| 70 | `/tillsonburg-auto-detailing` | `landing_hero` | `landing:tillsonburg-auto-detailing:hero` | `slot-070-landing-tillsonburg-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 71 | `/tillsonburg-auto-detailing` | `landing_gallery` | `landing:tillsonburg-auto-detailing:gallery:1` | `slot-071-landing-tillsonburg-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 72 | `/tillsonburg-auto-detailing` | `landing_gallery` | `landing:tillsonburg-auto-detailing:gallery:2` | `slot-072-landing-tillsonburg-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 73 | `/tillsonburg-auto-detailing` | `landing_gallery` | `landing:tillsonburg-auto-detailing:gallery:3` | `slot-073-landing-tillsonburg-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 74 | `/` | `home_card` | `home:location:tillsonburg-auto-detailing` | `slot-074-home-location-tillsonburg-auto-detailing.webp` | 1600×900 | review required |
| 75 | `/woodstock-ingersoll-auto-detailing` | `landing_hero` | `landing:woodstock-ingersoll-auto-detailing:hero` | `slot-075-landing-woodstock-ingersoll-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 76 | `/woodstock-ingersoll-auto-detailing` | `landing_gallery` | `landing:woodstock-ingersoll-auto-detailing:gallery:1` | `slot-076-landing-woodstock-ingersoll-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 77 | `/woodstock-ingersoll-auto-detailing` | `landing_gallery` | `landing:woodstock-ingersoll-auto-detailing:gallery:2` | `slot-077-landing-woodstock-ingersoll-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 78 | `/woodstock-ingersoll-auto-detailing` | `landing_gallery` | `landing:woodstock-ingersoll-auto-detailing:gallery:3` | `slot-078-landing-woodstock-ingersoll-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 79 | `/` | `home_card` | `home:location:woodstock-ingersoll-auto-detailing` | `slot-079-home-location-woodstock-ingersoll-auto-detailing.webp` | 1600×900 | review required |
| 80 | `/simcoe-delhi-auto-detailing` | `landing_hero` | `landing:simcoe-delhi-auto-detailing:hero` | `slot-080-landing-simcoe-delhi-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 81 | `/simcoe-delhi-auto-detailing` | `landing_gallery` | `landing:simcoe-delhi-auto-detailing:gallery:1` | `slot-081-landing-simcoe-delhi-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 82 | `/simcoe-delhi-auto-detailing` | `landing_gallery` | `landing:simcoe-delhi-auto-detailing:gallery:2` | `slot-082-landing-simcoe-delhi-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 83 | `/simcoe-delhi-auto-detailing` | `landing_gallery` | `landing:simcoe-delhi-auto-detailing:gallery:3` | `slot-083-landing-simcoe-delhi-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 84 | `/` | `home_card` | `home:location:simcoe-delhi-auto-detailing` | `slot-084-home-location-simcoe-delhi-auto-detailing.webp` | 1600×900 | review required |
| 85 | `/port-dover-auto-detailing` | `landing_hero` | `landing:port-dover-auto-detailing:hero` | `slot-085-landing-port-dover-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 86 | `/port-dover-auto-detailing` | `landing_gallery` | `landing:port-dover-auto-detailing:gallery:1` | `slot-086-landing-port-dover-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 87 | `/port-dover-auto-detailing` | `landing_gallery` | `landing:port-dover-auto-detailing:gallery:2` | `slot-087-landing-port-dover-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 88 | `/port-dover-auto-detailing` | `landing_gallery` | `landing:port-dover-auto-detailing:gallery:3` | `slot-088-landing-port-dover-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 89 | `/` | `home_card` | `home:location:port-dover-auto-detailing` | `slot-089-home-location-port-dover-auto-detailing.webp` | 1600×900 | review required |
| 90 | `/norwich-otterville-auto-detailing` | `landing_hero` | `landing:norwich-otterville-auto-detailing:hero` | `slot-090-landing-norwich-otterville-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 91 | `/norwich-otterville-auto-detailing` | `landing_gallery` | `landing:norwich-otterville-auto-detailing:gallery:1` | `slot-091-landing-norwich-otterville-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 92 | `/norwich-otterville-auto-detailing` | `landing_gallery` | `landing:norwich-otterville-auto-detailing:gallery:2` | `slot-092-landing-norwich-otterville-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 93 | `/norwich-otterville-auto-detailing` | `landing_gallery` | `landing:norwich-otterville-auto-detailing:gallery:3` | `slot-093-landing-norwich-otterville-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 94 | `/` | `home_card` | `home:location:norwich-otterville-auto-detailing` | `slot-094-home-location-norwich-otterville-auto-detailing.webp` | 1600×900 | review required |
| 95 | `/zorra-thamesford-embro-auto-detailing` | `landing_hero` | `landing:zorra-thamesford-embro-auto-detailing:hero` | `slot-095-landing-zorra-thamesford-embro-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 96 | `/zorra-thamesford-embro-auto-detailing` | `landing_gallery` | `landing:zorra-thamesford-embro-auto-detailing:gallery:1` | `slot-096-landing-zorra-thamesford-embro-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 97 | `/zorra-thamesford-embro-auto-detailing` | `landing_gallery` | `landing:zorra-thamesford-embro-auto-detailing:gallery:2` | `slot-097-landing-zorra-thamesford-embro-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 98 | `/zorra-thamesford-embro-auto-detailing` | `landing_gallery` | `landing:zorra-thamesford-embro-auto-detailing:gallery:3` | `slot-098-landing-zorra-thamesford-embro-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 99 | `/` | `home_card` | `home:location:zorra-thamesford-embro-auto-detailing` | `slot-099-home-location-zorra-thamesford-embro-auto-detailing.webp` | 1600×900 | review required |
| 100 | `/waterford-vittoria-auto-detailing` | `landing_hero` | `landing:waterford-vittoria-auto-detailing:hero` | `slot-100-landing-waterford-vittoria-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 101 | `/waterford-vittoria-auto-detailing` | `landing_gallery` | `landing:waterford-vittoria-auto-detailing:gallery:1` | `slot-101-landing-waterford-vittoria-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 102 | `/waterford-vittoria-auto-detailing` | `landing_gallery` | `landing:waterford-vittoria-auto-detailing:gallery:2` | `slot-102-landing-waterford-vittoria-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 103 | `/waterford-vittoria-auto-detailing` | `landing_gallery` | `landing:waterford-vittoria-auto-detailing:gallery:3` | `slot-103-landing-waterford-vittoria-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 104 | `/` | `home_card` | `home:location:waterford-vittoria-auto-detailing` | `slot-104-home-location-waterford-vittoria-auto-detailing.webp` | 1600×900 | review required |
| 105 | `/port-rowan-turkey-point-auto-detailing` | `landing_hero` | `landing:port-rowan-turkey-point-auto-detailing:hero` | `slot-105-landing-port-rowan-turkey-point-auto-detailing-hero.webp` | 1920×1080 | permissioned |
| 106 | `/port-rowan-turkey-point-auto-detailing` | `landing_gallery` | `landing:port-rowan-turkey-point-auto-detailing:gallery:1` | `slot-106-landing-port-rowan-turkey-point-auto-detailing-gallery-1.webp` | 1600×1200 | permissioned |
| 107 | `/port-rowan-turkey-point-auto-detailing` | `landing_gallery` | `landing:port-rowan-turkey-point-auto-detailing:gallery:2` | `slot-107-landing-port-rowan-turkey-point-auto-detailing-gallery-2.webp` | 1600×1200 | permissioned |
| 108 | `/port-rowan-turkey-point-auto-detailing` | `landing_gallery` | `landing:port-rowan-turkey-point-auto-detailing:gallery:3` | `slot-108-landing-port-rowan-turkey-point-auto-detailing-gallery-3.webp` | 1600×1200 | permissioned |
| 109 | `/` | `home_card` | `home:location:port-rowan-turkey-point-auto-detailing` | `slot-109-home-location-port-rowan-turkey-point-auto-detailing.webp` | 1600×900 | review required |
| 110 | `/graphene-finish` | `landing_hero` | `landing:graphene-finish:hero` | `slot-110-landing-graphene-finish-hero.webp` | 1920×1080 | permissioned |
| 111 | `/graphene-finish` | `landing_gallery` | `landing:graphene-finish:gallery:1` | `slot-111-landing-graphene-finish-gallery-1.webp` | 1600×1200 | permissioned |
| 112 | `/graphene-finish` | `landing_gallery` | `landing:graphene-finish:gallery:2` | `slot-112-landing-graphene-finish-gallery-2.webp` | 1600×1200 | permissioned |
| 113 | `/graphene-finish` | `landing_gallery` | `landing:graphene-finish:gallery:3` | `slot-113-landing-graphene-finish-gallery-3.webp` | 1600×1200 | permissioned |
| 114 | `/` | `home_card` | `home:service:graphene-finish` | `slot-114-home-service-graphene-finish.webp` | 1600×900 | review required |
| 115 | `/full-clay-treatment` | `landing_hero` | `landing:full-clay-treatment:hero` | `slot-115-landing-full-clay-treatment-hero.webp` | 1920×1080 | permissioned |
| 116 | `/full-clay-treatment` | `landing_gallery` | `landing:full-clay-treatment:gallery:1` | `slot-116-landing-full-clay-treatment-gallery-1.webp` | 1600×1200 | permissioned |
| 117 | `/full-clay-treatment` | `landing_gallery` | `landing:full-clay-treatment:gallery:2` | `slot-117-landing-full-clay-treatment-gallery-2.webp` | 1600×1200 | permissioned |
| 118 | `/full-clay-treatment` | `landing_gallery` | `landing:full-clay-treatment:gallery:3` | `slot-118-landing-full-clay-treatment-gallery-3.webp` | 1600×1200 | permissioned |
| 119 | `/` | `home_card` | `home:service:full-clay-treatment` | `slot-119-home-service-full-clay-treatment.webp` | 1600×900 | review required |
| 120 | `/engine-cleaning` | `landing_hero` | `landing:engine-cleaning:hero` | `slot-120-landing-engine-cleaning-hero.webp` | 1920×1080 | permissioned |
| 121 | `/engine-cleaning` | `landing_gallery` | `landing:engine-cleaning:gallery:1` | `slot-121-landing-engine-cleaning-gallery-1.webp` | 1600×1200 | permissioned |
| 122 | `/engine-cleaning` | `landing_gallery` | `landing:engine-cleaning:gallery:2` | `slot-122-landing-engine-cleaning-gallery-2.webp` | 1600×1200 | permissioned |
| 123 | `/engine-cleaning` | `landing_gallery` | `landing:engine-cleaning:gallery:3` | `slot-123-landing-engine-cleaning-gallery-3.webp` | 1600×1200 | permissioned |
| 124 | `/` | `home_card` | `home:service:engine-cleaning` | `slot-124-home-service-engine-cleaning.webp` | 1600×900 | review required |
| 125 | `/high-grade-paint-sealant` | `landing_hero` | `landing:high-grade-paint-sealant:hero` | `slot-125-landing-high-grade-paint-sealant-hero.webp` | 1920×1080 | permissioned |
| 126 | `/high-grade-paint-sealant` | `landing_gallery` | `landing:high-grade-paint-sealant:gallery:1` | `slot-126-landing-high-grade-paint-sealant-gallery-1.webp` | 1600×1200 | permissioned |
| 127 | `/high-grade-paint-sealant` | `landing_gallery` | `landing:high-grade-paint-sealant:gallery:2` | `slot-127-landing-high-grade-paint-sealant-gallery-2.webp` | 1600×1200 | permissioned |
| 128 | `/high-grade-paint-sealant` | `landing_gallery` | `landing:high-grade-paint-sealant:gallery:3` | `slot-128-landing-high-grade-paint-sealant-gallery-3.webp` | 1600×1200 | permissioned |
| 129 | `/` | `home_card` | `home:service:high-grade-paint-sealant` | `slot-129-home-service-high-grade-paint-sealant.webp` | 1600×900 | review required |
| 130 | `/uv-protectant` | `landing_hero` | `landing:uv-protectant:hero` | `slot-130-landing-uv-protectant-hero.webp` | 1920×1080 | permissioned |
| 131 | `/uv-protectant` | `landing_gallery` | `landing:uv-protectant:gallery:1` | `slot-131-landing-uv-protectant-gallery-1.webp` | 1600×1200 | permissioned |
| 132 | `/uv-protectant` | `landing_gallery` | `landing:uv-protectant:gallery:2` | `slot-132-landing-uv-protectant-gallery-2.webp` | 1600×1200 | permissioned |
| 133 | `/uv-protectant` | `landing_gallery` | `landing:uv-protectant:gallery:3` | `slot-133-landing-uv-protectant-gallery-3.webp` | 1600×1200 | permissioned |
| 134 | `/` | `home_card` | `home:service:uv-protectant` | `slot-134-home-service-uv-protectant.webp` | 1600×900 | review required |
| 135 | `/exterior-wax` | `landing_hero` | `landing:exterior-wax:hero` | `slot-135-landing-exterior-wax-hero.webp` | 1920×1080 | permissioned |
| 136 | `/exterior-wax` | `landing_gallery` | `landing:exterior-wax:gallery:1` | `slot-136-landing-exterior-wax-gallery-1.webp` | 1600×1200 | permissioned |
| 137 | `/exterior-wax` | `landing_gallery` | `landing:exterior-wax:gallery:2` | `slot-137-landing-exterior-wax-gallery-2.webp` | 1600×1200 | permissioned |
| 138 | `/exterior-wax` | `landing_gallery` | `landing:exterior-wax:gallery:3` | `slot-138-landing-exterior-wax-gallery-3.webp` | 1600×1200 | permissioned |
| 139 | `/` | `home_card` | `home:service:exterior-wax` | `slot-139-home-service-exterior-wax.webp` | 1600×900 | review required |
| 140 | `/de-ionizing-treatment` | `landing_hero` | `landing:de-ionizing-treatment:hero` | `slot-140-landing-de-ionizing-treatment-hero.webp` | 1920×1080 | permissioned |
| 141 | `/de-ionizing-treatment` | `landing_gallery` | `landing:de-ionizing-treatment:gallery:1` | `slot-141-landing-de-ionizing-treatment-gallery-1.webp` | 1600×1200 | permissioned |
| 142 | `/de-ionizing-treatment` | `landing_gallery` | `landing:de-ionizing-treatment:gallery:2` | `slot-142-landing-de-ionizing-treatment-gallery-2.webp` | 1600×1200 | permissioned |
| 143 | `/de-ionizing-treatment` | `landing_gallery` | `landing:de-ionizing-treatment:gallery:3` | `slot-143-landing-de-ionizing-treatment-gallery-3.webp` | 1600×1200 | permissioned |
| 144 | `/` | `home_card` | `home:service:de-ionizing-treatment` | `slot-144-home-service-de-ionizing-treatment.webp` | 1600×900 | review required |
| 145 | `/admin-daip-gate-c` | `admin_context` | `admin:gate-c:feature` | `slot-145-admin-gate-c-feature.webp` | 1600×900 | review required |
| 146 | `/admin-daip-gate-c` | `admin_context` | `admin:gate-c:strip:1` | `slot-146-admin-gate-c-strip-1.webp` | 1600×900 | review required |
| 147 | `/admin-daip-gate-c` | `admin_context` | `admin:gate-c:strip:2` | `slot-147-admin-gate-c-strip-2.webp` | 1600×900 | review required |
| 148 | `/admin-daip-gate-c` | `admin_context` | `admin:gate-c:strip:3` | `slot-148-admin-gate-c-strip-3.webp` | 1600×900 | review required |
| 149 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:1:before` | `slot-149-landing-ceramic-coating-before-after-1-before.webp` | 1600×1200 | permissioned |
| 150 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:1:after` | `slot-150-landing-ceramic-coating-before-after-1-after.webp` | 1600×1200 | permissioned |
| 151 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:2:before` | `slot-151-landing-ceramic-coating-before-after-2-before.webp` | 1600×1200 | permissioned |
| 152 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:2:after` | `slot-152-landing-ceramic-coating-before-after-2-after.webp` | 1600×1200 | permissioned |
| 153 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:3:before` | `slot-153-landing-ceramic-coating-before-after-3-before.webp` | 1600×1200 | permissioned |
| 154 | `/ceramic-coating` | `before_after_pair` | `landing:ceramic-coating:before-after:3:after` | `slot-154-landing-ceramic-coating-before-after-3-after.webp` | 1600×1200 | permissioned |
| 155 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:1:before` | `slot-155-landing-pet-hair-removal-before-after-1-before.webp` | 1600×1200 | permissioned |
| 156 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:1:after` | `slot-156-landing-pet-hair-removal-before-after-1-after.webp` | 1600×1200 | permissioned |
| 157 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:2:before` | `slot-157-landing-pet-hair-removal-before-after-2-before.webp` | 1600×1200 | permissioned |
| 158 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:2:after` | `slot-158-landing-pet-hair-removal-before-after-2-after.webp` | 1600×1200 | permissioned |
| 159 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:3:before` | `slot-159-landing-pet-hair-removal-before-after-3-before.webp` | 1600×1200 | permissioned |
| 160 | `/pet-hair-removal` | `before_after_pair` | `landing:pet-hair-removal:before-after:3:after` | `slot-160-landing-pet-hair-removal-before-after-3-after.webp` | 1600×1200 | permissioned |
| 161 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:1:before` | `slot-161-landing-odor-removal-before-after-1-before.webp` | 1600×1200 | permissioned |
| 162 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:1:after` | `slot-162-landing-odor-removal-before-after-1-after.webp` | 1600×1200 | permissioned |
| 163 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:2:before` | `slot-163-landing-odor-removal-before-after-2-before.webp` | 1600×1200 | permissioned |
| 164 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:2:after` | `slot-164-landing-odor-removal-before-after-2-after.webp` | 1600×1200 | permissioned |
| 165 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:3:before` | `slot-165-landing-odor-removal-before-after-3-before.webp` | 1600×1200 | permissioned |
| 166 | `/odor-removal` | `before_after_pair` | `landing:odor-removal:before-after:3:after` | `slot-166-landing-odor-removal-before-after-3-after.webp` | 1600×1200 | permissioned |
| 167 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:1:before` | `slot-167-landing-headlight-restoration-before-after-1-before.webp` | 1600×1200 | permissioned |
| 168 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:1:after` | `slot-168-landing-headlight-restoration-before-after-1-after.webp` | 1600×1200 | permissioned |
| 169 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:2:before` | `slot-169-landing-headlight-restoration-before-after-2-before.webp` | 1600×1200 | permissioned |
| 170 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:2:after` | `slot-170-landing-headlight-restoration-before-after-2-after.webp` | 1600×1200 | permissioned |
| 171 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:3:before` | `slot-171-landing-headlight-restoration-before-after-3-before.webp` | 1600×1200 | permissioned |
| 172 | `/headlight-restoration` | `before_after_pair` | `landing:headlight-restoration:before-after:3:after` | `slot-172-landing-headlight-restoration-before-after-3-after.webp` | 1600×1200 | permissioned |
| 173 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:1:before` | `slot-173-landing-paint-correction-before-after-1-before.webp` | 1600×1200 | permissioned |
| 174 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:1:after` | `slot-174-landing-paint-correction-before-after-1-after.webp` | 1600×1200 | permissioned |
| 175 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:2:before` | `slot-175-landing-paint-correction-before-after-2-before.webp` | 1600×1200 | permissioned |
| 176 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:2:after` | `slot-176-landing-paint-correction-before-after-2-after.webp` | 1600×1200 | permissioned |
| 177 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:3:before` | `slot-177-landing-paint-correction-before-after-3-before.webp` | 1600×1200 | permissioned |
| 178 | `/paint-correction` | `before_after_pair` | `landing:paint-correction:before-after:3:after` | `slot-178-landing-paint-correction-before-after-3-after.webp` | 1600×1200 | permissioned |
| 179 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:1:before` | `slot-179-landing-tillsonburg-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 180 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:1:after` | `slot-180-landing-tillsonburg-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 181 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:2:before` | `slot-181-landing-tillsonburg-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 182 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:2:after` | `slot-182-landing-tillsonburg-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 183 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:3:before` | `slot-183-landing-tillsonburg-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 184 | `/tillsonburg-auto-detailing` | `before_after_pair` | `landing:tillsonburg-auto-detailing:before-after:3:after` | `slot-184-landing-tillsonburg-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 185 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:1:before` | `slot-185-landing-woodstock-ingersoll-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 186 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:1:after` | `slot-186-landing-woodstock-ingersoll-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 187 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:2:before` | `slot-187-landing-woodstock-ingersoll-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 188 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:2:after` | `slot-188-landing-woodstock-ingersoll-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 189 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:3:before` | `slot-189-landing-woodstock-ingersoll-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 190 | `/woodstock-ingersoll-auto-detailing` | `before_after_pair` | `landing:woodstock-ingersoll-auto-detailing:before-after:3:after` | `slot-190-landing-woodstock-ingersoll-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 191 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:1:before` | `slot-191-landing-simcoe-delhi-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 192 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:1:after` | `slot-192-landing-simcoe-delhi-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 193 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:2:before` | `slot-193-landing-simcoe-delhi-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 194 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:2:after` | `slot-194-landing-simcoe-delhi-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 195 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:3:before` | `slot-195-landing-simcoe-delhi-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 196 | `/simcoe-delhi-auto-detailing` | `before_after_pair` | `landing:simcoe-delhi-auto-detailing:before-after:3:after` | `slot-196-landing-simcoe-delhi-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 197 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:1:before` | `slot-197-landing-port-dover-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 198 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:1:after` | `slot-198-landing-port-dover-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 199 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:2:before` | `slot-199-landing-port-dover-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 200 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:2:after` | `slot-200-landing-port-dover-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 201 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:3:before` | `slot-201-landing-port-dover-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 202 | `/port-dover-auto-detailing` | `before_after_pair` | `landing:port-dover-auto-detailing:before-after:3:after` | `slot-202-landing-port-dover-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 203 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:1:before` | `slot-203-landing-norwich-otterville-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 204 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:1:after` | `slot-204-landing-norwich-otterville-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 205 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:2:before` | `slot-205-landing-norwich-otterville-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 206 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:2:after` | `slot-206-landing-norwich-otterville-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 207 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:3:before` | `slot-207-landing-norwich-otterville-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 208 | `/norwich-otterville-auto-detailing` | `before_after_pair` | `landing:norwich-otterville-auto-detailing:before-after:3:after` | `slot-208-landing-norwich-otterville-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 209 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:1:before` | `slot-209-landing-zorra-thamesford-embro-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 210 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:1:after` | `slot-210-landing-zorra-thamesford-embro-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 211 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:2:before` | `slot-211-landing-zorra-thamesford-embro-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 212 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:2:after` | `slot-212-landing-zorra-thamesford-embro-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 213 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:3:before` | `slot-213-landing-zorra-thamesford-embro-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 214 | `/zorra-thamesford-embro-auto-detailing` | `before_after_pair` | `landing:zorra-thamesford-embro-auto-detailing:before-after:3:after` | `slot-214-landing-zorra-thamesford-embro-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 215 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:1:before` | `slot-215-landing-waterford-vittoria-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 216 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:1:after` | `slot-216-landing-waterford-vittoria-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 217 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:2:before` | `slot-217-landing-waterford-vittoria-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 218 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:2:after` | `slot-218-landing-waterford-vittoria-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 219 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:3:before` | `slot-219-landing-waterford-vittoria-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 220 | `/waterford-vittoria-auto-detailing` | `before_after_pair` | `landing:waterford-vittoria-auto-detailing:before-after:3:after` | `slot-220-landing-waterford-vittoria-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 221 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:1:before` | `slot-221-landing-port-rowan-turkey-point-auto-detailing-before-after-1-before.webp` | 1600×1200 | permissioned |
| 222 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:1:after` | `slot-222-landing-port-rowan-turkey-point-auto-detailing-before-after-1-after.webp` | 1600×1200 | permissioned |
| 223 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:2:before` | `slot-223-landing-port-rowan-turkey-point-auto-detailing-before-after-2-before.webp` | 1600×1200 | permissioned |
| 224 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:2:after` | `slot-224-landing-port-rowan-turkey-point-auto-detailing-before-after-2-after.webp` | 1600×1200 | permissioned |
| 225 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:3:before` | `slot-225-landing-port-rowan-turkey-point-auto-detailing-before-after-3-before.webp` | 1600×1200 | permissioned |
| 226 | `/port-rowan-turkey-point-auto-detailing` | `before_after_pair` | `landing:port-rowan-turkey-point-auto-detailing:before-after:3:after` | `slot-226-landing-port-rowan-turkey-point-auto-detailing-before-after-3-after.webp` | 1600×1200 | permissioned |
| 227 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:1:before` | `slot-227-landing-graphene-finish-before-after-1-before.webp` | 1600×1200 | permissioned |
| 228 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:1:after` | `slot-228-landing-graphene-finish-before-after-1-after.webp` | 1600×1200 | permissioned |
| 229 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:2:before` | `slot-229-landing-graphene-finish-before-after-2-before.webp` | 1600×1200 | permissioned |
| 230 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:2:after` | `slot-230-landing-graphene-finish-before-after-2-after.webp` | 1600×1200 | permissioned |
| 231 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:3:before` | `slot-231-landing-graphene-finish-before-after-3-before.webp` | 1600×1200 | permissioned |
| 232 | `/graphene-finish` | `before_after_pair` | `landing:graphene-finish:before-after:3:after` | `slot-232-landing-graphene-finish-before-after-3-after.webp` | 1600×1200 | permissioned |
| 233 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:1:before` | `slot-233-landing-full-clay-treatment-before-after-1-before.webp` | 1600×1200 | permissioned |
| 234 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:1:after` | `slot-234-landing-full-clay-treatment-before-after-1-after.webp` | 1600×1200 | permissioned |
| 235 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:2:before` | `slot-235-landing-full-clay-treatment-before-after-2-before.webp` | 1600×1200 | permissioned |
| 236 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:2:after` | `slot-236-landing-full-clay-treatment-before-after-2-after.webp` | 1600×1200 | permissioned |
| 237 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:3:before` | `slot-237-landing-full-clay-treatment-before-after-3-before.webp` | 1600×1200 | permissioned |
| 238 | `/full-clay-treatment` | `before_after_pair` | `landing:full-clay-treatment:before-after:3:after` | `slot-238-landing-full-clay-treatment-before-after-3-after.webp` | 1600×1200 | permissioned |
| 239 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:1:before` | `slot-239-landing-engine-cleaning-before-after-1-before.webp` | 1600×1200 | permissioned |
| 240 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:1:after` | `slot-240-landing-engine-cleaning-before-after-1-after.webp` | 1600×1200 | permissioned |
| 241 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:2:before` | `slot-241-landing-engine-cleaning-before-after-2-before.webp` | 1600×1200 | permissioned |
| 242 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:2:after` | `slot-242-landing-engine-cleaning-before-after-2-after.webp` | 1600×1200 | permissioned |
| 243 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:3:before` | `slot-243-landing-engine-cleaning-before-after-3-before.webp` | 1600×1200 | permissioned |
| 244 | `/engine-cleaning` | `before_after_pair` | `landing:engine-cleaning:before-after:3:after` | `slot-244-landing-engine-cleaning-before-after-3-after.webp` | 1600×1200 | permissioned |
| 245 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:1:before` | `slot-245-landing-high-grade-paint-sealant-before-after-1-before.webp` | 1600×1200 | permissioned |
| 246 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:1:after` | `slot-246-landing-high-grade-paint-sealant-before-after-1-after.webp` | 1600×1200 | permissioned |
| 247 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:2:before` | `slot-247-landing-high-grade-paint-sealant-before-after-2-before.webp` | 1600×1200 | permissioned |
| 248 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:2:after` | `slot-248-landing-high-grade-paint-sealant-before-after-2-after.webp` | 1600×1200 | permissioned |
| 249 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:3:before` | `slot-249-landing-high-grade-paint-sealant-before-after-3-before.webp` | 1600×1200 | permissioned |
| 250 | `/high-grade-paint-sealant` | `before_after_pair` | `landing:high-grade-paint-sealant:before-after:3:after` | `slot-250-landing-high-grade-paint-sealant-before-after-3-after.webp` | 1600×1200 | permissioned |
| 251 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:1:before` | `slot-251-landing-uv-protectant-before-after-1-before.webp` | 1600×1200 | permissioned |
| 252 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:1:after` | `slot-252-landing-uv-protectant-before-after-1-after.webp` | 1600×1200 | permissioned |
| 253 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:2:before` | `slot-253-landing-uv-protectant-before-after-2-before.webp` | 1600×1200 | permissioned |
| 254 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:2:after` | `slot-254-landing-uv-protectant-before-after-2-after.webp` | 1600×1200 | permissioned |
| 255 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:3:before` | `slot-255-landing-uv-protectant-before-after-3-before.webp` | 1600×1200 | permissioned |
| 256 | `/uv-protectant` | `before_after_pair` | `landing:uv-protectant:before-after:3:after` | `slot-256-landing-uv-protectant-before-after-3-after.webp` | 1600×1200 | permissioned |
| 257 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:1:before` | `slot-257-landing-exterior-wax-before-after-1-before.webp` | 1600×1200 | permissioned |
| 258 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:1:after` | `slot-258-landing-exterior-wax-before-after-1-after.webp` | 1600×1200 | permissioned |
| 259 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:2:before` | `slot-259-landing-exterior-wax-before-after-2-before.webp` | 1600×1200 | permissioned |
| 260 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:2:after` | `slot-260-landing-exterior-wax-before-after-2-after.webp` | 1600×1200 | permissioned |
| 261 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:3:before` | `slot-261-landing-exterior-wax-before-after-3-before.webp` | 1600×1200 | permissioned |
| 262 | `/exterior-wax` | `before_after_pair` | `landing:exterior-wax:before-after:3:after` | `slot-262-landing-exterior-wax-before-after-3-after.webp` | 1600×1200 | permissioned |
| 263 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:1:before` | `slot-263-landing-de-ionizing-treatment-before-after-1-before.webp` | 1600×1200 | permissioned |
| 264 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:1:after` | `slot-264-landing-de-ionizing-treatment-before-after-1-after.webp` | 1600×1200 | permissioned |
| 265 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:2:before` | `slot-265-landing-de-ionizing-treatment-before-after-2-before.webp` | 1600×1200 | permissioned |
| 266 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:2:after` | `slot-266-landing-de-ionizing-treatment-before-after-2-after.webp` | 1600×1200 | permissioned |
| 267 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:3:before` | `slot-267-landing-de-ionizing-treatment-before-after-3-before.webp` | 1600×1200 | permissioned |
| 268 | `/de-ionizing-treatment` | `before_after_pair` | `landing:de-ionizing-treatment:before-after:3:after` | `slot-268-landing-de-ionizing-treatment-before-after-3-after.webp` | 1600×1200 | permissioned |
| 269 | `/services` | `proof_image` | `page:services:review-proof` | `slot-269-page-services-review-proof.webp` | 1600×900 | review required |
| 270 | `/pricing` | `proof_image` | `page:pricing:review-proof` | `slot-270-page-pricing-review-proof.webp` | 1600×900 | review required |
| 271 | `/faq` | `faq_card` | `page:faq:booking-help` | `slot-271-page-faq-booking-help.webp` | 1600×900 | review required |
| 272 | `/faq` | `faq_card` | `page:faq:service-choices` | `slot-272-page-faq-service-choices.webp` | 1600×900 | review required |
| 273 | `/faq` | `faq_card` | `page:faq:help-articles` | `slot-273-page-faq-help-articles.webp` | 1600×900 | review required |
| 274 | `/faq` | `faq_card` | `page:faq:local-proof` | `slot-274-page-faq-local-proof.webp` | 1600×900 | review required |
| 275 | `/gift-cards` | `gift_card` | `gift-card:interior` | `slot-275-gift-card-interior.webp` | 1600×900 | review required |
| 276 | `/gift-cards` | `gift_card` | `gift-card:complete` | `slot-276-gift-card-complete.webp` | 1600×900 | review required |
| 277 | `/gift-cards` | `gift_card` | `gift-card:custom` | `slot-277-gift-card-custom.webp` | 1600×900 | review required |
| 278 | `/services` | `service_hub` | `hub:services:interior` | `slot-278-hub-services-interior.webp` | 1600×900 | review required |
| 279 | `/services` | `service_hub` | `hub:services:exterior` | `slot-279-hub-services-exterior.webp` | 1600×900 | review required |
| 280 | `/services` | `service_hub` | `hub:services:specials` | `slot-280-hub-services-specials.webp` | 1600×900 | review required |
| 281 | `/services` | `service_hub` | `hub:services:gift-cards` | `slot-281-hub-services-gift-cards.webp` | 1600×900 | review required |
| 282 | `/services` | `service_hub` | `hub:services:fleet` | `slot-282-hub-services-fleet.webp` | 1600×900 | review required |
| 283 | `/services` | `service_hub` | `hub:services:maintenance` | `slot-283-hub-services-maintenance.webp` | 1600×900 | review required |
| 284 | `/services` | `service_hub` | `hub:services:guides` | `slot-284-hub-services-guides.webp` | 1600×900 | review required |
| 285 | `/ceramic-coating` | `proof_image` | `landing:ceramic-coating:review-proof` | `slot-285-landing-ceramic-coating-review-proof.webp` | 1600×900 | review required |
| 286 | `/pet-hair-removal` | `proof_image` | `landing:pet-hair-removal:review-proof` | `slot-286-landing-pet-hair-removal-review-proof.webp` | 1600×900 | review required |
| 287 | `/odor-removal` | `proof_image` | `landing:odor-removal:review-proof` | `slot-287-landing-odor-removal-review-proof.webp` | 1600×900 | review required |
| 288 | `/headlight-restoration` | `proof_image` | `landing:headlight-restoration:review-proof` | `slot-288-landing-headlight-restoration-review-proof.webp` | 1600×900 | review required |
| 289 | `/paint-correction` | `proof_image` | `landing:paint-correction:review-proof` | `slot-289-landing-paint-correction-review-proof.webp` | 1600×900 | review required |
| 290 | `/tillsonburg-auto-detailing` | `proof_image` | `landing:tillsonburg-auto-detailing:review-proof` | `slot-290-landing-tillsonburg-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 291 | `/woodstock-ingersoll-auto-detailing` | `proof_image` | `landing:woodstock-ingersoll-auto-detailing:review-proof` | `slot-291-landing-woodstock-ingersoll-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 292 | `/simcoe-delhi-auto-detailing` | `proof_image` | `landing:simcoe-delhi-auto-detailing:review-proof` | `slot-292-landing-simcoe-delhi-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 293 | `/port-dover-auto-detailing` | `proof_image` | `landing:port-dover-auto-detailing:review-proof` | `slot-293-landing-port-dover-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 294 | `/norwich-otterville-auto-detailing` | `proof_image` | `landing:norwich-otterville-auto-detailing:review-proof` | `slot-294-landing-norwich-otterville-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 295 | `/zorra-thamesford-embro-auto-detailing` | `proof_image` | `landing:zorra-thamesford-embro-auto-detailing:review-proof` | `slot-295-landing-zorra-thamesford-embro-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 296 | `/waterford-vittoria-auto-detailing` | `proof_image` | `landing:waterford-vittoria-auto-detailing:review-proof` | `slot-296-landing-waterford-vittoria-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 297 | `/port-rowan-turkey-point-auto-detailing` | `proof_image` | `landing:port-rowan-turkey-point-auto-detailing:review-proof` | `slot-297-landing-port-rowan-turkey-point-auto-detailing-review-proof.webp` | 1600×900 | review required |
| 298 | `/graphene-finish` | `proof_image` | `landing:graphene-finish:review-proof` | `slot-298-landing-graphene-finish-review-proof.webp` | 1600×900 | review required |
| 299 | `/full-clay-treatment` | `proof_image` | `landing:full-clay-treatment:review-proof` | `slot-299-landing-full-clay-treatment-review-proof.webp` | 1600×900 | review required |
| 300 | `/engine-cleaning` | `proof_image` | `landing:engine-cleaning:review-proof` | `slot-300-landing-engine-cleaning-review-proof.webp` | 1600×900 | review required |
| 301 | `/high-grade-paint-sealant` | `proof_image` | `landing:high-grade-paint-sealant:review-proof` | `slot-301-landing-high-grade-paint-sealant-review-proof.webp` | 1600×900 | review required |
| 302 | `/uv-protectant` | `proof_image` | `landing:uv-protectant:review-proof` | `slot-302-landing-uv-protectant-review-proof.webp` | 1600×900 | review required |
| 303 | `/exterior-wax` | `proof_image` | `landing:exterior-wax:review-proof` | `slot-303-landing-exterior-wax-review-proof.webp` | 1600×900 | review required |
| 304 | `/de-ionizing-treatment` | `proof_image` | `landing:de-ionizing-treatment:review-proof` | `slot-304-landing-de-ionizing-treatment-review-proof.webp` | 1600×900 | review required |
| 305 | `/gallery` | `gallery_evidence` | `gallery:evidence:1` | `slot-305-gallery-evidence-1.webp` | 1600×1200 | permissioned |
| 306 | `/gallery` | `gallery_evidence` | `gallery:evidence:2` | `slot-306-gallery-evidence-2.webp` | 1600×1200 | permissioned |
| 307 | `/gallery` | `gallery_evidence` | `gallery:evidence:3` | `slot-307-gallery-evidence-3.webp` | 1600×1200 | permissioned |
| 308 | `/gallery` | `gallery_evidence` | `gallery:evidence:4` | `slot-308-gallery-evidence-4.webp` | 1600×1200 | permissioned |
| 309 | `/gallery` | `gallery_evidence` | `gallery:evidence:5` | `slot-309-gallery-evidence-5.webp` | 1600×1200 | permissioned |
| 310 | `/gallery` | `gallery_evidence` | `gallery:evidence:6` | `slot-310-gallery-evidence-6.webp` | 1600×1200 | permissioned |
| 311 | `/gallery` | `gallery_evidence` | `gallery:evidence:7` | `slot-311-gallery-evidence-7.webp` | 1600×1200 | permissioned |
| 312 | `/gallery` | `gallery_evidence` | `gallery:evidence:8` | `slot-312-gallery-evidence-8.webp` | 1600×1200 | permissioned |
| 313 | `/gallery` | `gallery_evidence` | `gallery:evidence:9` | `slot-313-gallery-evidence-9.webp` | 1600×1200 | permissioned |
| 314 | `/gallery` | `gallery_evidence` | `gallery:evidence:10` | `slot-314-gallery-evidence-10.webp` | 1600×1200 | permissioned |
| 315 | `/gallery` | `gallery_evidence` | `gallery:evidence:11` | `slot-315-gallery-evidence-11.webp` | 1600×1200 | permissioned |
| 316 | `/gallery` | `gallery_evidence` | `gallery:evidence:12` | `slot-316-gallery-evidence-12.webp` | 1600×1200 | permissioned |
| 317 | `/gallery` | `gallery_technique` | `gallery:technique:1` | `slot-317-gallery-technique-1.webp` | 1600×1200 | permissioned |
| 318 | `/gallery` | `gallery_technique` | `gallery:technique:2` | `slot-318-gallery-technique-2.webp` | 1600×1200 | permissioned |
| 319 | `/gallery` | `gallery_technique` | `gallery:technique:3` | `slot-319-gallery-technique-3.webp` | 1600×1200 | permissioned |
| 320 | `/gallery` | `gallery_technique` | `gallery:technique:4` | `slot-320-gallery-technique-4.webp` | 1600×1200 | permissioned |
| 321 | `/gallery` | `gallery_technique` | `gallery:technique:5` | `slot-321-gallery-technique-5.webp` | 1600×1200 | permissioned |
| 322 | `/gallery` | `gallery_technique` | `gallery:technique:6` | `slot-322-gallery-technique-6.webp` | 1600×1200 | permissioned |
| 323 | `/gallery` | `gallery_technique` | `gallery:technique:7` | `slot-323-gallery-technique-7.webp` | 1600×1200 | permissioned |
| 324 | `/gallery` | `gallery_technique` | `gallery:technique:8` | `slot-324-gallery-technique-8.webp` | 1600×1200 | permissioned |
| 325 | `/gallery` | `gallery_technique` | `gallery:technique:9` | `slot-325-gallery-technique-9.webp` | 1600×1200 | permissioned |
| 326 | `/gallery` | `gallery_technique` | `gallery:technique:10` | `slot-326-gallery-technique-10.webp` | 1600×1200 | permissioned |
| 327 | `/gallery` | `gallery_technique` | `gallery:technique:11` | `slot-327-gallery-technique-11.webp` | 1600×1200 | permissioned |
| 328 | `/gallery` | `gallery_technique` | `gallery:technique:12` | `slot-328-gallery-technique-12.webp` | 1600×1200 | permissioned |
| 329 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:1` | `slot-329-gallery-efficiency-1.webp` | 1600×1200 | permissioned |
| 330 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:2` | `slot-330-gallery-efficiency-2.webp` | 1600×1200 | permissioned |
| 331 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:3` | `slot-331-gallery-efficiency-3.webp` | 1600×1200 | permissioned |
| 332 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:4` | `slot-332-gallery-efficiency-4.webp` | 1600×1200 | permissioned |
| 333 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:5` | `slot-333-gallery-efficiency-5.webp` | 1600×1200 | permissioned |
| 334 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:6` | `slot-334-gallery-efficiency-6.webp` | 1600×1200 | permissioned |
| 335 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:7` | `slot-335-gallery-efficiency-7.webp` | 1600×1200 | permissioned |
| 336 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:8` | `slot-336-gallery-efficiency-8.webp` | 1600×1200 | permissioned |
| 337 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:9` | `slot-337-gallery-efficiency-9.webp` | 1600×1200 | permissioned |
| 338 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:10` | `slot-338-gallery-efficiency-10.webp` | 1600×1200 | permissioned |
| 339 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:11` | `slot-339-gallery-efficiency-11.webp` | 1600×1200 | permissioned |
| 340 | `/gallery` | `gallery_efficiency` | `gallery:efficiency:12` | `slot-340-gallery-efficiency-12.webp` | 1600×1200 | permissioned |
| 341 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:1:before` | `slot-341-gallery-before-after-1-before.webp` | 1600×1200 | permissioned |
| 342 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:1:after` | `slot-342-gallery-before-after-1-after.webp` | 1600×1200 | permissioned |
| 343 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:2:before` | `slot-343-gallery-before-after-2-before.webp` | 1600×1200 | permissioned |
| 344 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:2:after` | `slot-344-gallery-before-after-2-after.webp` | 1600×1200 | permissioned |
| 345 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:3:before` | `slot-345-gallery-before-after-3-before.webp` | 1600×1200 | permissioned |
| 346 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:3:after` | `slot-346-gallery-before-after-3-after.webp` | 1600×1200 | permissioned |
| 347 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:4:before` | `slot-347-gallery-before-after-4-before.webp` | 1600×1200 | permissioned |
| 348 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:4:after` | `slot-348-gallery-before-after-4-after.webp` | 1600×1200 | permissioned |
| 349 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:5:before` | `slot-349-gallery-before-after-5-before.webp` | 1600×1200 | permissioned |
| 350 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:5:after` | `slot-350-gallery-before-after-5-after.webp` | 1600×1200 | permissioned |
| 351 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:6:before` | `slot-351-gallery-before-after-6-before.webp` | 1600×1200 | permissioned |
| 352 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:6:after` | `slot-352-gallery-before-after-6-after.webp` | 1600×1200 | permissioned |
| 353 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:7:before` | `slot-353-gallery-before-after-7-before.webp` | 1600×1200 | permissioned |
| 354 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:7:after` | `slot-354-gallery-before-after-7-after.webp` | 1600×1200 | permissioned |
| 355 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:8:before` | `slot-355-gallery-before-after-8-before.webp` | 1600×1200 | permissioned |
| 356 | `/gallery` | `gallery_before_after_pair` | `gallery:before-after:8:after` | `slot-356-gallery-before-after-8-after.webp` | 1600×1200 | permissioned |
| 357 | `/` | `proof` | `page:home:review-proof` | `slot-357-page-home-review-proof.webp` | 1600×900 | review required |
| 358 | `/` | `site_brand` | `site:brand:logo` | `slot-358-site-brand-logo.webp` | verify design slot | brand owner |
| 359 | `/` | `site_brand` | `site:brand:banner` | `slot-359-site-brand-banner.webp` | verify design slot | brand owner |
| 360 | `/` | `site_brand` | `site:brand:reviews` | `slot-360-site-brand-reviews.webp` | verify design slot | brand owner |
| 361 | `/` | `site_asset` | `site-asset:/assets/brand/rosie-reviews-fallback.png` | `slot-361-site-asset-assets-brand-rosie-reviews-fallback-png.webp` | verify design slot | brand owner |
| 362 | `/` | `site_asset` | `site-asset:/assets/brand/CarPrice2025.PNG` | `slot-362-site-asset-assets-brand-carprice2025-png.webp` | verify design slot | brand owner |
| 363 | `/` | `site_asset` | `site-asset:/assets/brand/CarPriceDetails2025.PNG` | `slot-363-site-asset-assets-brand-carpricedetails2025-png.webp` | verify design slot | brand owner |
| 364 | `/` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG` | `slot-364-site-asset-https-assets-rosiedazzlers-ca-packages-carsizechart-png.webp` | verify design slot | brand owner |
| 365 | `/` | `site_asset` | `site-asset:/assets/photos/coating-detail.jpg` | `slot-365-site-asset-assets-photos-coating-detail-jpg.webp` | verify design slot | brand owner |
| 366 | `/` | `site_asset` | `site-asset:/assets/photos/engine-bay.jpg` | `slot-366-site-asset-assets-photos-engine-bay-jpg.webp` | verify design slot | brand owner |
| 367 | `/` | `site_asset` | `site-asset:/assets/photos/interior-detail.jpg` | `slot-367-site-asset-assets-photos-interior-detail-jpg.webp` | verify design slot | brand owner |
| 368 | `/` | `site_asset` | `site-asset:/assets/photos/service-exterior.jpg` | `slot-368-site-asset-assets-photos-service-exterior-jpg.webp` | verify design slot | brand owner |
| 369 | `/` | `site_asset` | `site-asset:/assets/photos/wrap-tint.jpg` | `slot-369-site-asset-assets-photos-wrap-tint-jpg.webp` | verify design slot | brand owner |
| 370 | `/maintenance-plan` | `maintenance_page` | `maintenance:hero` | `slot-370-maintenance-hero.webp` | 1600×900 | review required |
| 371 | `/` | `page_background` | `page-background:/` | `slot-371-page-background.webp` | 1920×1080 | permissioned |
| 372 | `/404` | `page_background` | `page-background:/404` | `slot-372-page-background-404.webp` | 1920×1080 | permissioned |
| 373 | `/about` | `page_background` | `page-background:/about` | `slot-373-page-background-about.webp` | 1920×1080 | permissioned |
| 374 | `/blog` | `page_background` | `page-background:/blog` | `slot-374-page-background-blog.webp` | 1920×1080 | permissioned |
| 375 | `/book` | `page_background` | `page-background:/book` | `slot-375-page-background-book.webp` | 1920×1080 | permissioned |
| 376 | `/consumables` | `page_background` | `page-background:/consumables` | `slot-376-page-background-consumables.webp` | 1920×1080 | permissioned |
| 377 | `/contact` | `page_background` | `page-background:/contact` | `slot-377-page-background-contact.webp` | 1920×1080 | permissioned |
| 378 | `/faq` | `page_background` | `page-background:/faq` | `slot-378-page-background-faq.webp` | 1920×1080 | permissioned |
| 379 | `/fleet` | `page_background` | `page-background:/fleet` | `slot-379-page-background-fleet.webp` | 1920×1080 | permissioned |
| 380 | `/fleet-pricing` | `page_background` | `page-background:/fleet-pricing` | `slot-380-page-background-fleet-pricing.webp` | 1920×1080 | permissioned |
| 381 | `/gallery` | `page_background` | `page-background:/gallery` | `slot-381-page-background-gallery.webp` | 1920×1080 | permissioned |
| 382 | `/gear` | `page_background` | `page-background:/gear` | `slot-382-page-background-gear.webp` | 1920×1080 | permissioned |
| 383 | `/gift-cards` | `page_background` | `page-background:/gift-cards` | `slot-383-page-background-gift-cards.webp` | 1920×1080 | permissioned |
| 384 | `/gift-certificate-print` | `page_background` | `page-background:/gift-certificate-print` | `slot-384-page-background-gift-certificate-print.webp` | 1920×1080 | permissioned |
| 385 | `/gifts` | `page_background` | `page-background:/gifts` | `slot-385-page-background-gifts.webp` | 1920×1080 | permissioned |
| 386 | `/maintenance` | `page_background` | `page-background:/maintenance` | `slot-386-page-background-maintenance.webp` | 1920×1080 | permissioned |
| 387 | `/maintenance-plan` | `page_background` | `page-background:/maintenance-plan` | `slot-387-page-background-maintenance-plan.webp` | 1920×1080 | permissioned |
| 388 | `/pricing` | `page_background` | `page-background:/pricing` | `slot-388-page-background-pricing.webp` | 1920×1080 | permissioned |
| 389 | `/privacy` | `page_background` | `page-background:/privacy` | `slot-389-page-background-privacy.webp` | 1920×1080 | permissioned |
| 390 | `/services` | `page_background` | `page-background:/services` | `slot-390-page-background-services.webp` | 1920×1080 | permissioned |
| 391 | `/specials` | `page_background` | `page-background:/specials` | `slot-391-page-background-specials.webp` | 1920×1080 | permissioned |
| 392 | `/terms` | `page_background` | `page-background:/terms` | `slot-392-page-background-terms.webp` | 1920×1080 | permissioned |
| 393 | `/videos` | `page_background` | `page-background:/videos` | `slot-393-page-background-videos.webp` | 1920×1080 | permissioned |
| 394 | `/waiver` | `page_background` | `page-background:/waiver` | `slot-394-page-background-waiver.webp` | 1920×1080 | permissioned |
| 395 | `*` | `site_asset` | `site-asset:/assets/placeholders/inventory-tools-photo.jpg` | `slot-395-site-asset-assets-placeholders-inventory-tools-photo-jpg.webp` | verify design slot | brand owner |
| 396 | `*` | `site_asset` | `site-asset:/assets/placeholders/product-gallery-photo.jpg` | `slot-396-site-asset-assets-placeholders-product-gallery-photo-jpg.webp` | verify design slot | brand owner |
| 397 | `*` | `site_asset` | `site-asset:/assets/vehicles/outline_front.svg` | `slot-397-site-asset-assets-vehicles-outline-front-svg.webp` | verify design slot | brand owner |
| 398 | `*` | `site_asset` | `site-asset:/assets/vehicles/outline_back.svg` | `slot-398-site-asset-assets-vehicles-outline-back-svg.webp` | verify design slot | brand owner |
| 399 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/CarPhotos/port-dover-ceramic-proof-before.webp` | `slot-399-site-asset-https-assets-rosiedazzlers-ca-carphotos-port-dover-ceramic-pr.webp` | verify design slot | brand owner |
| 400 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/CarPhotos/simcoe-pet-hair-proof-before.webp` | `slot-400-site-asset-https-assets-rosiedazzlers-ca-carphotos-simcoe-pet-hair-proof.webp` | verify design slot | brand owner |
| 401 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/CarPhotos/tillsonburg-interior-proof-before.webp` | `slot-401-site-asset-https-assets-rosiedazzlers-ca-carphotos-tillsonburg-interior-.webp` | verify design slot | brand owner |
| 402 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/CarPhotos/woodstock-exterior-proof-before.webp` | `slot-402-site-asset-https-assets-rosiedazzlers-ca-carphotos-woodstock-exterior-pr.webp` | verify design slot | brand owner |
| 403 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/brand/KatBlackCar.PNG` | `slot-403-site-asset-https-assets-rosiedazzlers-ca-brand-katblackcar-png.webp` | verify design slot | brand owner |
| 404 | `*` | `site_asset` | `site-asset:https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png` | `slot-404-site-asset-https-assets-rosiedazzlers-ca-brand-rosiedazzlersbanner-png.webp` | verify design slot | brand owner |
| 405 | `*` | `site_brand` | `site:brand:background` | `slot-405-site-brand-background.webp` | verify design slot | brand owner |
| 406 | `/ceramic-coating` | `page_background` | `page-background:/ceramic-coating` | `slot-406-page-background-ceramic-coating.webp` | 1920×1080 | permissioned |
| 407 | `/de-ionizing-treatment` | `page_background` | `page-background:/de-ionizing-treatment` | `slot-407-page-background-de-ionizing-treatment.webp` | 1920×1080 | permissioned |
| 408 | `/engine-cleaning` | `page_background` | `page-background:/engine-cleaning` | `slot-408-page-background-engine-cleaning.webp` | 1920×1080 | permissioned |
| 409 | `/exterior-wax` | `page_background` | `page-background:/exterior-wax` | `slot-409-page-background-exterior-wax.webp` | 1920×1080 | permissioned |
| 410 | `/full-clay-treatment` | `page_background` | `page-background:/full-clay-treatment` | `slot-410-page-background-full-clay-treatment.webp` | 1920×1080 | permissioned |
| 411 | `/graphene-finish` | `page_background` | `page-background:/graphene-finish` | `slot-411-page-background-graphene-finish.webp` | 1920×1080 | permissioned |
| 412 | `/headlight-restoration` | `page_background` | `page-background:/headlight-restoration` | `slot-412-page-background-headlight-restoration.webp` | 1920×1080 | permissioned |
| 413 | `/high-grade-paint-sealant` | `page_background` | `page-background:/high-grade-paint-sealant` | `slot-413-page-background-high-grade-paint-sealant.webp` | 1920×1080 | permissioned |
| 414 | `/norwich-otterville-auto-detailing` | `page_background` | `page-background:/norwich-otterville-auto-detailing` | `slot-414-page-background-norwich-otterville-auto-detailing.webp` | 1920×1080 | permissioned |
| 415 | `/odor-removal` | `page_background` | `page-background:/odor-removal` | `slot-415-page-background-odor-removal.webp` | 1920×1080 | permissioned |
| 416 | `/paint-correction` | `page_background` | `page-background:/paint-correction` | `slot-416-page-background-paint-correction.webp` | 1920×1080 | permissioned |
| 417 | `/pet-hair-removal` | `page_background` | `page-background:/pet-hair-removal` | `slot-417-page-background-pet-hair-removal.webp` | 1920×1080 | permissioned |
| 418 | `/port-dover-auto-detailing` | `page_background` | `page-background:/port-dover-auto-detailing` | `slot-418-page-background-port-dover-auto-detailing.webp` | 1920×1080 | permissioned |
| 419 | `/port-rowan-turkey-point-auto-detailing` | `page_background` | `page-background:/port-rowan-turkey-point-auto-detailing` | `slot-419-page-background-port-rowan-turkey-point-auto-detailing.webp` | 1920×1080 | permissioned |
| 420 | `/simcoe-delhi-auto-detailing` | `page_background` | `page-background:/simcoe-delhi-auto-detailing` | `slot-420-page-background-simcoe-delhi-auto-detailing.webp` | 1920×1080 | permissioned |
| 421 | `/tillsonburg-auto-detailing` | `page_background` | `page-background:/tillsonburg-auto-detailing` | `slot-421-page-background-tillsonburg-auto-detailing.webp` | 1920×1080 | permissioned |
| 422 | `/uv-protectant` | `page_background` | `page-background:/uv-protectant` | `slot-422-page-background-uv-protectant.webp` | 1920×1080 | permissioned |
| 423 | `/waterford-vittoria-auto-detailing` | `page_background` | `page-background:/waterford-vittoria-auto-detailing` | `slot-423-page-background-waterford-vittoria-auto-detailing.webp` | 1920×1080 | permissioned |
| 424 | `/woodstock-ingersoll-auto-detailing` | `page_background` | `page-background:/woodstock-ingersoll-auto-detailing` | `slot-424-page-background-woodstock-ingersoll-auto-detailing.webp` | 1920×1080 | permissioned |
| 425 | `/zorra-thamesford-embro-auto-detailing` | `page_background` | `page-background:/zorra-thamesford-embro-auto-detailing` | `slot-425-page-background-zorra-thamesford-embro-auto-detailing.webp` | 1920×1080 | permissioned |
| 426 | `/bug-tar-removal` | `landing_hero` | `landing:bug-tar-removal:hero` | `slot-426-landing-bug-tar-removal-hero.webp` | 1920×1080 | permissioned |
| 427 | `/bug-tar-removal` | `landing_gallery` | `landing:bug-tar-removal:gallery:1` | `slot-427-landing-bug-tar-removal-gallery-1.webp` | 1600×1200 | permissioned |
| 428 | `/bug-tar-removal` | `landing_gallery` | `landing:bug-tar-removal:gallery:2` | `slot-428-landing-bug-tar-removal-gallery-2.webp` | 1600×1200 | permissioned |
| 429 | `/bug-tar-removal` | `landing_gallery` | `landing:bug-tar-removal:gallery:3` | `slot-429-landing-bug-tar-removal-gallery-3.webp` | 1600×1200 | permissioned |
| 430 | `/bug-tar-removal` | `proof_image` | `landing:bug-tar-removal:review-proof` | `slot-430-landing-bug-tar-removal-review-proof.webp` | 1600×900 | review required |
| 431 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:1:before` | `slot-431-landing-bug-tar-removal-before-after-1-before.webp` | 1600×1200 | permissioned |
| 432 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:1:after` | `slot-432-landing-bug-tar-removal-before-after-1-after.webp` | 1600×1200 | permissioned |
| 433 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:2:before` | `slot-433-landing-bug-tar-removal-before-after-2-before.webp` | 1600×1200 | permissioned |
| 434 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:2:after` | `slot-434-landing-bug-tar-removal-before-after-2-after.webp` | 1600×1200 | permissioned |
| 435 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:3:before` | `slot-435-landing-bug-tar-removal-before-after-3-before.webp` | 1600×1200 | permissioned |
| 436 | `/bug-tar-removal` | `before_after_pair` | `landing:bug-tar-removal:before-after:3:after` | `slot-436-landing-bug-tar-removal-before-after-3-after.webp` | 1600×1200 | permissioned |
| 437 | `/bug-tar-removal` | `page_background` | `page-background:/bug-tar-removal` | `slot-437-page-background-bug-tar-removal.webp` | 1920×1080 | permissioned |
| 438 | `/carpet-shampoo` | `landing_hero` | `landing:carpet-shampoo:hero` | `slot-438-landing-carpet-shampoo-hero.webp` | 1920×1080 | permissioned |
| 439 | `/carpet-shampoo` | `landing_gallery` | `landing:carpet-shampoo:gallery:1` | `slot-439-landing-carpet-shampoo-gallery-1.webp` | 1600×1200 | permissioned |
| 440 | `/carpet-shampoo` | `landing_gallery` | `landing:carpet-shampoo:gallery:2` | `slot-440-landing-carpet-shampoo-gallery-2.webp` | 1600×1200 | permissioned |
| 441 | `/carpet-shampoo` | `landing_gallery` | `landing:carpet-shampoo:gallery:3` | `slot-441-landing-carpet-shampoo-gallery-3.webp` | 1600×1200 | permissioned |
| 442 | `/carpet-shampoo` | `proof_image` | `landing:carpet-shampoo:review-proof` | `slot-442-landing-carpet-shampoo-review-proof.webp` | 1600×900 | review required |
| 443 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:1:before` | `slot-443-landing-carpet-shampoo-before-after-1-before.webp` | 1600×1200 | permissioned |
| 444 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:1:after` | `slot-444-landing-carpet-shampoo-before-after-1-after.webp` | 1600×1200 | permissioned |
| 445 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:2:before` | `slot-445-landing-carpet-shampoo-before-after-2-before.webp` | 1600×1200 | permissioned |
| 446 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:2:after` | `slot-446-landing-carpet-shampoo-before-after-2-after.webp` | 1600×1200 | permissioned |
| 447 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:3:before` | `slot-447-landing-carpet-shampoo-before-after-3-before.webp` | 1600×1200 | permissioned |
| 448 | `/carpet-shampoo` | `before_after_pair` | `landing:carpet-shampoo:before-after:3:after` | `slot-448-landing-carpet-shampoo-before-after-3-after.webp` | 1600×1200 | permissioned |
| 449 | `/carpet-shampoo` | `page_background` | `page-background:/carpet-shampoo` | `slot-449-page-background-carpet-shampoo.webp` | 1920×1080 | permissioned |
| 450 | `/ceramic-spray-wax` | `landing_hero` | `landing:ceramic-spray-wax:hero` | `slot-450-landing-ceramic-spray-wax-hero.webp` | 1920×1080 | permissioned |
| 451 | `/ceramic-spray-wax` | `landing_gallery` | `landing:ceramic-spray-wax:gallery:1` | `slot-451-landing-ceramic-spray-wax-gallery-1.webp` | 1600×1200 | permissioned |
| 452 | `/ceramic-spray-wax` | `landing_gallery` | `landing:ceramic-spray-wax:gallery:2` | `slot-452-landing-ceramic-spray-wax-gallery-2.webp` | 1600×1200 | permissioned |
| 453 | `/ceramic-spray-wax` | `landing_gallery` | `landing:ceramic-spray-wax:gallery:3` | `slot-453-landing-ceramic-spray-wax-gallery-3.webp` | 1600×1200 | permissioned |
| 454 | `/ceramic-spray-wax` | `proof_image` | `landing:ceramic-spray-wax:review-proof` | `slot-454-landing-ceramic-spray-wax-review-proof.webp` | 1600×900 | review required |
| 455 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:1:before` | `slot-455-landing-ceramic-spray-wax-before-after-1-before.webp` | 1600×1200 | permissioned |
| 456 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:1:after` | `slot-456-landing-ceramic-spray-wax-before-after-1-after.webp` | 1600×1200 | permissioned |
| 457 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:2:before` | `slot-457-landing-ceramic-spray-wax-before-after-2-before.webp` | 1600×1200 | permissioned |
| 458 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:2:after` | `slot-458-landing-ceramic-spray-wax-before-after-2-after.webp` | 1600×1200 | permissioned |
| 459 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:3:before` | `slot-459-landing-ceramic-spray-wax-before-after-3-before.webp` | 1600×1200 | permissioned |
| 460 | `/ceramic-spray-wax` | `before_after_pair` | `landing:ceramic-spray-wax:before-after:3:after` | `slot-460-landing-ceramic-spray-wax-before-after-3-after.webp` | 1600×1200 | permissioned |
| 461 | `/ceramic-spray-wax` | `page_background` | `page-background:/ceramic-spray-wax` | `slot-461-page-background-ceramic-spray-wax.webp` | 1920×1080 | permissioned |
| 462 | `/de-badging` | `landing_hero` | `landing:de-badging:hero` | `slot-462-landing-de-badging-hero.webp` | 1920×1080 | permissioned |
| 463 | `/de-badging` | `landing_gallery` | `landing:de-badging:gallery:1` | `slot-463-landing-de-badging-gallery-1.webp` | 1600×1200 | permissioned |
| 464 | `/de-badging` | `landing_gallery` | `landing:de-badging:gallery:2` | `slot-464-landing-de-badging-gallery-2.webp` | 1600×1200 | permissioned |
| 465 | `/de-badging` | `landing_gallery` | `landing:de-badging:gallery:3` | `slot-465-landing-de-badging-gallery-3.webp` | 1600×1200 | permissioned |
| 466 | `/de-badging` | `proof_image` | `landing:de-badging:review-proof` | `slot-466-landing-de-badging-review-proof.webp` | 1600×900 | review required |
| 467 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:1:before` | `slot-467-landing-de-badging-before-after-1-before.webp` | 1600×1200 | permissioned |
| 468 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:1:after` | `slot-468-landing-de-badging-before-after-1-after.webp` | 1600×1200 | permissioned |
| 469 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:2:before` | `slot-469-landing-de-badging-before-after-2-before.webp` | 1600×1200 | permissioned |
| 470 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:2:after` | `slot-470-landing-de-badging-before-after-2-after.webp` | 1600×1200 | permissioned |
| 471 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:3:before` | `slot-471-landing-de-badging-before-after-3-before.webp` | 1600×1200 | permissioned |
| 472 | `/de-badging` | `before_after_pair` | `landing:de-badging:before-after:3:after` | `slot-472-landing-de-badging-before-after-3-after.webp` | 1600×1200 | permissioned |
| 473 | `/de-badging` | `page_background` | `page-background:/de-badging` | `slot-473-page-background-de-badging.webp` | 1920×1080 | permissioned |
| 474 | `/external-ceramic-coating` | `landing_hero` | `landing:external-ceramic-coating:hero` | `slot-474-landing-external-ceramic-coating-hero.webp` | 1920×1080 | permissioned |
| 475 | `/external-ceramic-coating` | `landing_gallery` | `landing:external-ceramic-coating:gallery:1` | `slot-475-landing-external-ceramic-coating-gallery-1.webp` | 1600×1200 | permissioned |
| 476 | `/external-ceramic-coating` | `landing_gallery` | `landing:external-ceramic-coating:gallery:2` | `slot-476-landing-external-ceramic-coating-gallery-2.webp` | 1600×1200 | permissioned |
| 477 | `/external-ceramic-coating` | `landing_gallery` | `landing:external-ceramic-coating:gallery:3` | `slot-477-landing-external-ceramic-coating-gallery-3.webp` | 1600×1200 | permissioned |
| 478 | `/external-ceramic-coating` | `proof_image` | `landing:external-ceramic-coating:review-proof` | `slot-478-landing-external-ceramic-coating-review-proof.webp` | 1600×900 | review required |
| 479 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:1:before` | `slot-479-landing-external-ceramic-coating-before-after-1-before.webp` | 1600×1200 | permissioned |
| 480 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:1:after` | `slot-480-landing-external-ceramic-coating-before-after-1-after.webp` | 1600×1200 | permissioned |
| 481 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:2:before` | `slot-481-landing-external-ceramic-coating-before-after-2-before.webp` | 1600×1200 | permissioned |
| 482 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:2:after` | `slot-482-landing-external-ceramic-coating-before-after-2-after.webp` | 1600×1200 | permissioned |
| 483 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:3:before` | `slot-483-landing-external-ceramic-coating-before-after-3-before.webp` | 1600×1200 | permissioned |
| 484 | `/external-ceramic-coating` | `before_after_pair` | `landing:external-ceramic-coating:before-after:3:after` | `slot-484-landing-external-ceramic-coating-before-after-3-after.webp` | 1600×1200 | permissioned |
| 485 | `/external-ceramic-coating` | `page_background` | `page-background:/external-ceramic-coating` | `slot-485-page-background-external-ceramic-coating.webp` | 1920×1080 | permissioned |
| 486 | `/fleet-vehicle-add-on` | `landing_hero` | `landing:fleet-vehicle-add-on:hero` | `slot-486-landing-fleet-vehicle-add-on-hero.webp` | 1920×1080 | permissioned |
| 487 | `/fleet-vehicle-add-on` | `landing_gallery` | `landing:fleet-vehicle-add-on:gallery:1` | `slot-487-landing-fleet-vehicle-add-on-gallery-1.webp` | 1600×1200 | permissioned |
| 488 | `/fleet-vehicle-add-on` | `landing_gallery` | `landing:fleet-vehicle-add-on:gallery:2` | `slot-488-landing-fleet-vehicle-add-on-gallery-2.webp` | 1600×1200 | permissioned |
| 489 | `/fleet-vehicle-add-on` | `landing_gallery` | `landing:fleet-vehicle-add-on:gallery:3` | `slot-489-landing-fleet-vehicle-add-on-gallery-3.webp` | 1600×1200 | permissioned |
| 490 | `/fleet-vehicle-add-on` | `proof_image` | `landing:fleet-vehicle-add-on:review-proof` | `slot-490-landing-fleet-vehicle-add-on-review-proof.webp` | 1600×900 | review required |
| 491 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:1:before` | `slot-491-landing-fleet-vehicle-add-on-before-after-1-before.webp` | 1600×1200 | permissioned |
| 492 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:1:after` | `slot-492-landing-fleet-vehicle-add-on-before-after-1-after.webp` | 1600×1200 | permissioned |
| 493 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:2:before` | `slot-493-landing-fleet-vehicle-add-on-before-after-2-before.webp` | 1600×1200 | permissioned |
| 494 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:2:after` | `slot-494-landing-fleet-vehicle-add-on-before-after-2-after.webp` | 1600×1200 | permissioned |
| 495 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:3:before` | `slot-495-landing-fleet-vehicle-add-on-before-after-3-before.webp` | 1600×1200 | permissioned |
| 496 | `/fleet-vehicle-add-on` | `before_after_pair` | `landing:fleet-vehicle-add-on:before-after:3:after` | `slot-496-landing-fleet-vehicle-add-on-before-after-3-after.webp` | 1600×1200 | permissioned |
| 497 | `/fleet-vehicle-add-on` | `page_background` | `page-background:/fleet-vehicle-add-on` | `slot-497-page-background-fleet-vehicle-add-on.webp` | 1920×1080 | permissioned |
| 498 | `/headlight-restoration-addon` | `landing_hero` | `landing:headlight-restoration-addon:hero` | `slot-498-landing-headlight-restoration-addon-hero.webp` | 1920×1080 | permissioned |
| 499 | `/headlight-restoration-addon` | `landing_gallery` | `landing:headlight-restoration-addon:gallery:1` | `slot-499-landing-headlight-restoration-addon-gallery-1.webp` | 1600×1200 | permissioned |
| 500 | `/headlight-restoration-addon` | `landing_gallery` | `landing:headlight-restoration-addon:gallery:2` | `slot-500-landing-headlight-restoration-addon-gallery-2.webp` | 1600×1200 | permissioned |
| 501 | `/headlight-restoration-addon` | `landing_gallery` | `landing:headlight-restoration-addon:gallery:3` | `slot-501-landing-headlight-restoration-addon-gallery-3.webp` | 1600×1200 | permissioned |
| 502 | `/headlight-restoration-addon` | `proof_image` | `landing:headlight-restoration-addon:review-proof` | `slot-502-landing-headlight-restoration-addon-review-proof.webp` | 1600×900 | review required |
| 503 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:1:before` | `slot-503-landing-headlight-restoration-addon-before-after-1-before.webp` | 1600×1200 | permissioned |
| 504 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:1:after` | `slot-504-landing-headlight-restoration-addon-before-after-1-after.webp` | 1600×1200 | permissioned |
| 505 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:2:before` | `slot-505-landing-headlight-restoration-addon-before-after-2-before.webp` | 1600×1200 | permissioned |
| 506 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:2:after` | `slot-506-landing-headlight-restoration-addon-before-after-2-after.webp` | 1600×1200 | permissioned |
| 507 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:3:before` | `slot-507-landing-headlight-restoration-addon-before-after-3-before.webp` | 1600×1200 | permissioned |
| 508 | `/headlight-restoration-addon` | `before_after_pair` | `landing:headlight-restoration-addon:before-after:3:after` | `slot-508-landing-headlight-restoration-addon-before-after-3-after.webp` | 1600×1200 | permissioned |
| 509 | `/headlight-restoration-addon` | `page_background` | `page-background:/headlight-restoration-addon` | `slot-509-page-background-headlight-restoration-addon.webp` | 1920×1080 | permissioned |
| 510 | `/odor-treatment` | `landing_hero` | `landing:odor-treatment:hero` | `slot-510-landing-odor-treatment-hero.webp` | 1920×1080 | permissioned |
| 511 | `/odor-treatment` | `landing_gallery` | `landing:odor-treatment:gallery:1` | `slot-511-landing-odor-treatment-gallery-1.webp` | 1600×1200 | permissioned |
| 512 | `/odor-treatment` | `landing_gallery` | `landing:odor-treatment:gallery:2` | `slot-512-landing-odor-treatment-gallery-2.webp` | 1600×1200 | permissioned |
| 513 | `/odor-treatment` | `landing_gallery` | `landing:odor-treatment:gallery:3` | `slot-513-landing-odor-treatment-gallery-3.webp` | 1600×1200 | permissioned |
| 514 | `/odor-treatment` | `proof_image` | `landing:odor-treatment:review-proof` | `slot-514-landing-odor-treatment-review-proof.webp` | 1600×900 | review required |
| 515 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:1:before` | `slot-515-landing-odor-treatment-before-after-1-before.webp` | 1600×1200 | permissioned |
| 516 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:1:after` | `slot-516-landing-odor-treatment-before-after-1-after.webp` | 1600×1200 | permissioned |
| 517 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:2:before` | `slot-517-landing-odor-treatment-before-after-2-before.webp` | 1600×1200 | permissioned |
| 518 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:2:after` | `slot-518-landing-odor-treatment-before-after-2-after.webp` | 1600×1200 | permissioned |
| 519 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:3:before` | `slot-519-landing-odor-treatment-before-after-3-before.webp` | 1600×1200 | permissioned |
| 520 | `/odor-treatment` | `before_after_pair` | `landing:odor-treatment:before-after:3:after` | `slot-520-landing-odor-treatment-before-after-3-after.webp` | 1600×1200 | permissioned |
| 521 | `/odor-treatment` | `page_background` | `page-background:/odor-treatment` | `slot-521-page-background-odor-treatment.webp` | 1920×1080 | permissioned |
| 522 | `/salt-stain-treatment` | `landing_hero` | `landing:salt-stain-treatment:hero` | `slot-522-landing-salt-stain-treatment-hero.webp` | 1920×1080 | permissioned |
| 523 | `/salt-stain-treatment` | `landing_gallery` | `landing:salt-stain-treatment:gallery:1` | `slot-523-landing-salt-stain-treatment-gallery-1.webp` | 1600×1200 | permissioned |
| 524 | `/salt-stain-treatment` | `landing_gallery` | `landing:salt-stain-treatment:gallery:2` | `slot-524-landing-salt-stain-treatment-gallery-2.webp` | 1600×1200 | permissioned |
| 525 | `/salt-stain-treatment` | `landing_gallery` | `landing:salt-stain-treatment:gallery:3` | `slot-525-landing-salt-stain-treatment-gallery-3.webp` | 1600×1200 | permissioned |
| 526 | `/salt-stain-treatment` | `proof_image` | `landing:salt-stain-treatment:review-proof` | `slot-526-landing-salt-stain-treatment-review-proof.webp` | 1600×900 | review required |
| 527 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:1:before` | `slot-527-landing-salt-stain-treatment-before-after-1-before.webp` | 1600×1200 | permissioned |
| 528 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:1:after` | `slot-528-landing-salt-stain-treatment-before-after-1-after.webp` | 1600×1200 | permissioned |
| 529 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:2:before` | `slot-529-landing-salt-stain-treatment-before-after-2-before.webp` | 1600×1200 | permissioned |
| 530 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:2:after` | `slot-530-landing-salt-stain-treatment-before-after-2-after.webp` | 1600×1200 | permissioned |
| 531 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:3:before` | `slot-531-landing-salt-stain-treatment-before-after-3-before.webp` | 1600×1200 | permissioned |
| 532 | `/salt-stain-treatment` | `before_after_pair` | `landing:salt-stain-treatment:before-after:3:after` | `slot-532-landing-salt-stain-treatment-before-after-3-after.webp` | 1600×1200 | permissioned |
| 533 | `/salt-stain-treatment` | `page_background` | `page-background:/salt-stain-treatment` | `slot-533-page-background-salt-stain-treatment.webp` | 1920×1080 | permissioned |
| 534 | `/seat-shampoo` | `landing_hero` | `landing:seat-shampoo:hero` | `slot-534-landing-seat-shampoo-hero.webp` | 1920×1080 | permissioned |
| 535 | `/seat-shampoo` | `landing_gallery` | `landing:seat-shampoo:gallery:1` | `slot-535-landing-seat-shampoo-gallery-1.webp` | 1600×1200 | permissioned |
| 536 | `/seat-shampoo` | `landing_gallery` | `landing:seat-shampoo:gallery:2` | `slot-536-landing-seat-shampoo-gallery-2.webp` | 1600×1200 | permissioned |
| 537 | `/seat-shampoo` | `landing_gallery` | `landing:seat-shampoo:gallery:3` | `slot-537-landing-seat-shampoo-gallery-3.webp` | 1600×1200 | permissioned |
| 538 | `/seat-shampoo` | `proof_image` | `landing:seat-shampoo:review-proof` | `slot-538-landing-seat-shampoo-review-proof.webp` | 1600×900 | review required |
| 539 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:1:before` | `slot-539-landing-seat-shampoo-before-after-1-before.webp` | 1600×1200 | permissioned |
| 540 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:1:after` | `slot-540-landing-seat-shampoo-before-after-1-after.webp` | 1600×1200 | permissioned |
| 541 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:2:before` | `slot-541-landing-seat-shampoo-before-after-2-before.webp` | 1600×1200 | permissioned |
| 542 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:2:after` | `slot-542-landing-seat-shampoo-before-after-2-after.webp` | 1600×1200 | permissioned |
| 543 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:3:before` | `slot-543-landing-seat-shampoo-before-after-3-before.webp` | 1600×1200 | permissioned |
| 544 | `/seat-shampoo` | `before_after_pair` | `landing:seat-shampoo:before-after:3:after` | `slot-544-landing-seat-shampoo-before-after-3-after.webp` | 1600×1200 | permissioned |
| 545 | `/seat-shampoo` | `page_background` | `page-background:/seat-shampoo` | `slot-545-page-background-seat-shampoo.webp` | 1920×1080 | permissioned |
| 546 | `/trim-restoration` | `landing_hero` | `landing:trim-restoration:hero` | `slot-546-landing-trim-restoration-hero.webp` | 1920×1080 | permissioned |
| 547 | `/trim-restoration` | `landing_gallery` | `landing:trim-restoration:gallery:1` | `slot-547-landing-trim-restoration-gallery-1.webp` | 1600×1200 | permissioned |
| 548 | `/trim-restoration` | `landing_gallery` | `landing:trim-restoration:gallery:2` | `slot-548-landing-trim-restoration-gallery-2.webp` | 1600×1200 | permissioned |
| 549 | `/trim-restoration` | `landing_gallery` | `landing:trim-restoration:gallery:3` | `slot-549-landing-trim-restoration-gallery-3.webp` | 1600×1200 | permissioned |
| 550 | `/trim-restoration` | `proof_image` | `landing:trim-restoration:review-proof` | `slot-550-landing-trim-restoration-review-proof.webp` | 1600×900 | review required |
| 551 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:1:before` | `slot-551-landing-trim-restoration-before-after-1-before.webp` | 1600×1200 | permissioned |
| 552 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:1:after` | `slot-552-landing-trim-restoration-before-after-1-after.webp` | 1600×1200 | permissioned |
| 553 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:2:before` | `slot-553-landing-trim-restoration-before-after-2-before.webp` | 1600×1200 | permissioned |
| 554 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:2:after` | `slot-554-landing-trim-restoration-before-after-2-after.webp` | 1600×1200 | permissioned |
| 555 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:3:before` | `slot-555-landing-trim-restoration-before-after-3-before.webp` | 1600×1200 | permissioned |
| 556 | `/trim-restoration` | `before_after_pair` | `landing:trim-restoration:before-after:3:after` | `slot-556-landing-trim-restoration-before-after-3-after.webp` | 1600×1200 | permissioned |
| 557 | `/trim-restoration` | `page_background` | `page-background:/trim-restoration` | `slot-557-page-background-trim-restoration.webp` | 1920×1080 | permissioned |
| 558 | `/truck-box-wash` | `landing_hero` | `landing:truck-box-wash:hero` | `slot-558-landing-truck-box-wash-hero.webp` | 1920×1080 | permissioned |
| 559 | `/truck-box-wash` | `landing_gallery` | `landing:truck-box-wash:gallery:1` | `slot-559-landing-truck-box-wash-gallery-1.webp` | 1600×1200 | permissioned |
| 560 | `/truck-box-wash` | `landing_gallery` | `landing:truck-box-wash:gallery:2` | `slot-560-landing-truck-box-wash-gallery-2.webp` | 1600×1200 | permissioned |
| 561 | `/truck-box-wash` | `landing_gallery` | `landing:truck-box-wash:gallery:3` | `slot-561-landing-truck-box-wash-gallery-3.webp` | 1600×1200 | permissioned |
| 562 | `/truck-box-wash` | `proof_image` | `landing:truck-box-wash:review-proof` | `slot-562-landing-truck-box-wash-review-proof.webp` | 1600×900 | review required |
| 563 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:1:before` | `slot-563-landing-truck-box-wash-before-after-1-before.webp` | 1600×1200 | permissioned |
| 564 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:1:after` | `slot-564-landing-truck-box-wash-before-after-1-after.webp` | 1600×1200 | permissioned |
| 565 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:2:before` | `slot-565-landing-truck-box-wash-before-after-2-before.webp` | 1600×1200 | permissioned |
| 566 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:2:after` | `slot-566-landing-truck-box-wash-before-after-2-after.webp` | 1600×1200 | permissioned |
| 567 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:3:before` | `slot-567-landing-truck-box-wash-before-after-3-before.webp` | 1600×1200 | permissioned |
| 568 | `/truck-box-wash` | `before_after_pair` | `landing:truck-box-wash:before-after:3:after` | `slot-568-landing-truck-box-wash-before-after-3-after.webp` | 1600×1200 | permissioned |
| 569 | `/truck-box-wash` | `page_background` | `page-background:/truck-box-wash` | `slot-569-page-background-truck-box-wash.webp` | 1920×1080 | permissioned |
| 570 | `/two-stage-polish` | `landing_hero` | `landing:two-stage-polish:hero` | `slot-570-landing-two-stage-polish-hero.webp` | 1920×1080 | permissioned |
| 571 | `/two-stage-polish` | `landing_gallery` | `landing:two-stage-polish:gallery:1` | `slot-571-landing-two-stage-polish-gallery-1.webp` | 1600×1200 | permissioned |
| 572 | `/two-stage-polish` | `landing_gallery` | `landing:two-stage-polish:gallery:2` | `slot-572-landing-two-stage-polish-gallery-2.webp` | 1600×1200 | permissioned |
| 573 | `/two-stage-polish` | `landing_gallery` | `landing:two-stage-polish:gallery:3` | `slot-573-landing-two-stage-polish-gallery-3.webp` | 1600×1200 | permissioned |
| 574 | `/two-stage-polish` | `proof_image` | `landing:two-stage-polish:review-proof` | `slot-574-landing-two-stage-polish-review-proof.webp` | 1600×900 | review required |
| 575 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:1:before` | `slot-575-landing-two-stage-polish-before-after-1-before.webp` | 1600×1200 | permissioned |
| 576 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:1:after` | `slot-576-landing-two-stage-polish-before-after-1-after.webp` | 1600×1200 | permissioned |
| 577 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:2:before` | `slot-577-landing-two-stage-polish-before-after-2-before.webp` | 1600×1200 | permissioned |
| 578 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:2:after` | `slot-578-landing-two-stage-polish-before-after-2-after.webp` | 1600×1200 | permissioned |
| 579 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:3:before` | `slot-579-landing-two-stage-polish-before-after-3-before.webp` | 1600×1200 | permissioned |
| 580 | `/two-stage-polish` | `before_after_pair` | `landing:two-stage-polish:before-after:3:after` | `slot-580-landing-two-stage-polish-before-after-3-after.webp` | 1600×1200 | permissioned |
| 581 | `/two-stage-polish` | `page_background` | `page-background:/two-stage-polish` | `slot-581-page-background-two-stage-polish.webp` | 1920×1080 | permissioned |
| 582 | `/vinyl-wrapping` | `landing_hero` | `landing:vinyl-wrapping:hero` | `slot-582-landing-vinyl-wrapping-hero.webp` | 1920×1080 | permissioned |
| 583 | `/vinyl-wrapping` | `landing_gallery` | `landing:vinyl-wrapping:gallery:1` | `slot-583-landing-vinyl-wrapping-gallery-1.webp` | 1600×1200 | permissioned |
| 584 | `/vinyl-wrapping` | `landing_gallery` | `landing:vinyl-wrapping:gallery:2` | `slot-584-landing-vinyl-wrapping-gallery-2.webp` | 1600×1200 | permissioned |
| 585 | `/vinyl-wrapping` | `landing_gallery` | `landing:vinyl-wrapping:gallery:3` | `slot-585-landing-vinyl-wrapping-gallery-3.webp` | 1600×1200 | permissioned |
| 586 | `/vinyl-wrapping` | `proof_image` | `landing:vinyl-wrapping:review-proof` | `slot-586-landing-vinyl-wrapping-review-proof.webp` | 1600×900 | review required |
| 587 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:1:before` | `slot-587-landing-vinyl-wrapping-before-after-1-before.webp` | 1600×1200 | permissioned |
| 588 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:1:after` | `slot-588-landing-vinyl-wrapping-before-after-1-after.webp` | 1600×1200 | permissioned |
| 589 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:2:before` | `slot-589-landing-vinyl-wrapping-before-after-2-before.webp` | 1600×1200 | permissioned |
| 590 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:2:after` | `slot-590-landing-vinyl-wrapping-before-after-2-after.webp` | 1600×1200 | permissioned |
| 591 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:3:before` | `slot-591-landing-vinyl-wrapping-before-after-3-before.webp` | 1600×1200 | permissioned |
| 592 | `/vinyl-wrapping` | `before_after_pair` | `landing:vinyl-wrapping:before-after:3:after` | `slot-592-landing-vinyl-wrapping-before-after-3-after.webp` | 1600×1200 | permissioned |
| 593 | `/vinyl-wrapping` | `page_background` | `page-background:/vinyl-wrapping` | `slot-593-page-background-vinyl-wrapping.webp` | 1920×1080 | permissioned |
| 594 | `/window-tinting` | `landing_hero` | `landing:window-tinting:hero` | `slot-594-landing-window-tinting-hero.webp` | 1920×1080 | permissioned |
| 595 | `/window-tinting` | `landing_gallery` | `landing:window-tinting:gallery:1` | `slot-595-landing-window-tinting-gallery-1.webp` | 1600×1200 | permissioned |
| 596 | `/window-tinting` | `landing_gallery` | `landing:window-tinting:gallery:2` | `slot-596-landing-window-tinting-gallery-2.webp` | 1600×1200 | permissioned |
| 597 | `/window-tinting` | `landing_gallery` | `landing:window-tinting:gallery:3` | `slot-597-landing-window-tinting-gallery-3.webp` | 1600×1200 | permissioned |
| 598 | `/window-tinting` | `proof_image` | `landing:window-tinting:review-proof` | `slot-598-landing-window-tinting-review-proof.webp` | 1600×900 | review required |
| 599 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:1:before` | `slot-599-landing-window-tinting-before-after-1-before.webp` | 1600×1200 | permissioned |
| 600 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:1:after` | `slot-600-landing-window-tinting-before-after-1-after.webp` | 1600×1200 | permissioned |
| 601 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:2:before` | `slot-601-landing-window-tinting-before-after-2-before.webp` | 1600×1200 | permissioned |
| 602 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:2:after` | `slot-602-landing-window-tinting-before-after-2-after.webp` | 1600×1200 | permissioned |
| 603 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:3:before` | `slot-603-landing-window-tinting-before-after-3-before.webp` | 1600×1200 | permissioned |
| 604 | `/window-tinting` | `before_after_pair` | `landing:window-tinting:before-after:3:after` | `slot-604-landing-window-tinting-before-after-3-after.webp` | 1600×1200 | permissioned |
| 605 | `/window-tinting` | `page_background` | `page-background:/window-tinting` | `slot-605-page-background-window-tinting.webp` | 1920×1080 | permissioned |
| 606 | `/windshield-ceramic-coating` | `landing_hero` | `landing:windshield-ceramic-coating:hero` | `slot-606-landing-windshield-ceramic-coating-hero.webp` | 1920×1080 | permissioned |
| 607 | `/windshield-ceramic-coating` | `landing_gallery` | `landing:windshield-ceramic-coating:gallery:1` | `slot-607-landing-windshield-ceramic-coating-gallery-1.webp` | 1600×1200 | permissioned |
| 608 | `/windshield-ceramic-coating` | `landing_gallery` | `landing:windshield-ceramic-coating:gallery:2` | `slot-608-landing-windshield-ceramic-coating-gallery-2.webp` | 1600×1200 | permissioned |
| 609 | `/windshield-ceramic-coating` | `landing_gallery` | `landing:windshield-ceramic-coating:gallery:3` | `slot-609-landing-windshield-ceramic-coating-gallery-3.webp` | 1600×1200 | permissioned |
| 610 | `/windshield-ceramic-coating` | `proof_image` | `landing:windshield-ceramic-coating:review-proof` | `slot-610-landing-windshield-ceramic-coating-review-proof.webp` | 1600×900 | review required |
| 611 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:1:before` | `slot-611-landing-windshield-ceramic-coating-before-after-1-before.webp` | 1600×1200 | permissioned |
| 612 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:1:after` | `slot-612-landing-windshield-ceramic-coating-before-after-1-after.webp` | 1600×1200 | permissioned |
| 613 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:2:before` | `slot-613-landing-windshield-ceramic-coating-before-after-2-before.webp` | 1600×1200 | permissioned |
| 614 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:2:after` | `slot-614-landing-windshield-ceramic-coating-before-after-2-after.webp` | 1600×1200 | permissioned |
| 615 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:3:before` | `slot-615-landing-windshield-ceramic-coating-before-after-3-before.webp` | 1600×1200 | permissioned |
| 616 | `/windshield-ceramic-coating` | `before_after_pair` | `landing:windshield-ceramic-coating:before-after:3:after` | `slot-616-landing-windshield-ceramic-coating-before-after-3-after.webp` | 1600×1200 | permissioned |
| 617 | `/windshield-ceramic-coating` | `page_background` | `page-background:/windshield-ceramic-coating` | `slot-617-page-background-windshield-ceramic-coating.webp` | 1920×1080 | permissioned |

## C. Exact known R2 upload keys and minimum requirements (24)

| Asset | Category | Exact R2 key | Min width | Min height | Requirement note |
|---|---|---|---:|---:|---|
| Pet Hair Removal | `addon` | `packages/pet_hair_removal.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Odor Treatment | `addon` | `packages/odor_treatment.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Seat Shampoo | `addon` | `packages/seat_shampoo.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Carpet Shampoo | `addon` | `packages/carpet_shampoo.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Salt Stain Treatment | `addon` | `packages/salt_stain_treatment.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Headlight Restoration | `addon` | `packages/headlight_restoration.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Windshield Ceramic Coating | `addon` | `packages/windshield_ceramic_coating.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Ceramic Spray Protection | `addon` | `packages/ceramic_spray_wax.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Trim Restoration | `addon` | `packages/trim_restoration.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Bug and Tar Removal | `addon` | `packages/bug_tar_removal.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Truck Box Wash | `addon` | `packages/truck_box_wash.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Fleet Vehicle Add-On | `addon` | `packages/fleet_vehicle_add_on.png` | 1200 | 800 | 1200x800 minimum; 1600x1067 preferred landscape |
| Tillsonburg interior before/after proof | `gallery_proof` | `CarPhotos/tillsonburg-interior-proof-before.webp` | 1200 | 800 | 1200x900 minimum; pair with matching after image; approved_public only |
| Woodstock exterior before/after proof | `gallery_proof` | `CarPhotos/woodstock-exterior-proof-before.webp` | 1200 | 800 | 1200x900 minimum; pair with matching after image; approved_public only |
| Simcoe pet hair proof | `gallery_proof` | `CarPhotos/simcoe-pet-hair-proof-before.webp` | 1200 | 800 | 1200x900 minimum; pair with matching after image; approved_public only |
| Port Dover ceramic/exterior proof | `gallery_proof` | `CarPhotos/port-dover-ceramic-proof-before.webp` | 1200 | 800 | 1200x900 minimum; pair with matching after image; approved_public only |
| Tillsonburg local hero | `regional` | `landing-pages/tillsonburg-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Woodstock/Ingersoll local hero | `regional` | `landing-pages/woodstock-ingersoll-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Simcoe/Delhi local hero | `regional` | `landing-pages/simcoe-delhi-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Port Dover local hero | `regional` | `landing-pages/port-dover-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Norwich/Otterville local hero | `regional` | `landing-pages/norwich-otterville-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Zorra/Thamesford/Embro local hero | `regional` | `landing-pages/zorra-thamesford-embro-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Waterford/Vittoria local hero | `regional` | `landing-pages/waterford-vittoria-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |
| Port Rowan/Turkey Point local hero | `regional` | `landing-pages/port-rowan-turkey-point-auto-detailing.jpg` | 1600 | 900 | 1600x900 preferred landscape JPG/WebP |

**Attention:** if human-written text dimensions conflict with numeric `required_width`/`required_height`, flag discrepancy and defer to Admin Media Health + a manual asset-spec correction. Do NOT silently pick one.

## D. Known visual placeholder categories (38)

| Key | Route or context | Desired approved image | Proposed filename | Default proposed canvas | Privacy |
|---|---|---|---|---|---|
| `service_card` | service cards, package cards, add-on cards | service-specific vehicle/detailing photo or approved before/after crop | `placeholder-service-card.webp` | 1600×900 (proposal) | Review before publication |
| `town_card` | town landing cards and local SEO proof sections | customer-approved local proof image for the town/service | `placeholder-town-card.webp` | 1600×900 (proposal) | Review before publication |
| `gallery_pair` | gallery rows with missing before or after image | two approved customer-safe before/after images | `placeholder-gallery-pair.webp` | 1600×900 (proposal) | Review before publication |
| `seasonal_campaign` | campaign, specials, and marketing cards | campaign-specific graphic: spring salt, summer road trip, winter protection | `placeholder-seasonal-campaign.webp` | 1600×900 (proposal) | Review before publication |
| `fleet` | fleet mini-CRM and fleet public cards | approved fleet or work-vehicle photo | `placeholder-fleet.webp` | 1600×900 (proposal) | Review before publication |
| `incident_evidence` | incident reports and customer progress when evidence is pending or private | admin-approved customer-safe evidence only | `placeholder-incident-evidence.webp` | 1600×900 (proposal) | Review before publication |
| `review_proof` | review proof cards and local trust blocks | approved public review screenshot or typed testimonial | `placeholder-review-proof.webp` | 1600×900 (proposal) | Review before publication |
| `quote_pipeline` | Admin Workflow / Quote dashboard | simple lead-to-booking funnel graphic or real quote screenshot with private data removed | `placeholder-quote-pipeline.webp` | 1600×900 (proposal) | Review before publication |
| `booking_conversion` | Admin Workflow / booking cards | vehicle/calendar visual or mobile booking screenshot | `placeholder-booking-conversion.webp` | 1600×900 (proposal) | Review before publication |
| `proof_of_work` | detailer jobs, workflow hub, service pages | approved start/finish photo set | `placeholder-proof-of-work.webp` | 1600×900 (proposal) | Review before publication |
| `invoice_payment` | workflow hub and payment admin | clean invoice/receipt mockup | `placeholder-invoice-payment.webp` | 1600×900 (proposal) | Review before publication |
| `review_public_proof` | gallery, review cards, SEO proof blocks | approved Google review or before/after photo | `placeholder-review-public-proof.webp` | 1600×900 (proposal) | Review before publication |
| `repeat_maintenance` | maintenance/fleet/workflow cards | seasonal care calendar or vehicle history screenshot | `placeholder-repeat-maintenance.webp` | 1600×900 (proposal) | Review before publication |
| `live_customer_update` | customer progress timeline and live detail workspace | approved during-service photo with a short customer-safe note | `placeholder-live-customer-update.webp` | 1600×900 (proposal) | Review before publication |
| `private_staff_note` | detailer/admin-only timeline entries | staff-only note or evidence that must never appear in the customer feed | `placeholder-private-staff-note.webp` | 1600×900 (proposal) | Review before publication |
| `video_update` | live detailing timeline when a video is pending/uploading | short approved progress video stored in protected media storage | `placeholder-video-update.webp` | 1600×900 (proposal) | Review before publication |
| `live_upload_recovery` | detailer mobile upload panel and failed-upload queue | real upload-progress screenshot after field testing | `placeholder-live-upload-recovery.webp` | 1600×900 (proposal) | Review before publication |
| `customer_approval` | in-job recommendation and price-change cards | approved recommendation workflow screenshot with private data removed | `placeholder-customer-approval.webp` | 1600×900 (proposal) | Review before publication |
| `completed_job_summary` | customer closeout and workflow screens | customer-safe completed job summary screenshot | `placeholder-completed-job-summary.webp` | 1600×900 (proposal) | Review before publication |
| `today_attention` | owner dashboard and priority queue | real owner queue screenshot with customer data removed | `placeholder-today-attention.webp` | 1600×900 (proposal) | Review before publication |
| `production_reliability` | /admin-production.html and operations dashboards | Screenshot or diagram of provider/payment/upload checks after production deployment | `placeholder-production-reliability.webp` | 1600×900 (proposal) | Review before publication |
| `production_test_centre` | /admin-test-centre.html and deployment-test documentation | safe internal screenshot after testing that contains no customer data, credentials, or private media | `placeholder-production-test-centre.webp` | 1600×900 (proposal) | Review before publication |
| `owner_attention` | Today Needs Attention and owner task cards | safe owner workflow screenshot with customer names removed | `placeholder-owner-attention.webp` | 1600×900 (proposal) | Review before publication |
| `customer_acknowledgement` | approved in-job recommendation and completed-summary cards | customer-safe approval or signed-summary proof with personal details removed | `placeholder-customer-acknowledgement.webp` | 1600×900 (proposal) | Review before publication |
| `security_posture` | /admin-security.html and production security readiness cards | safe internal security remediation checklist screenshot | `placeholder-security-posture.webp` | 1600×900 (proposal) | Review before publication |
| `media_recovery_alert` | Admin Media Health and public asset recovery alerts | verified Rosie-owned public asset after the exact R2 key, URL, access policy, dimensions, and consent status are confirmed | `placeholder-media-recovery-alert.webp` | 1600×900 (proposal) | Review before publication |
| `secure_payment` | final-balance payment status, invoice/payment workflow, and payment-assistance cards | approved generic Rosie Dazzlers payment/receipt graphic only; never use a real customer invoice, card, payment link, QR code, or personal data | `placeholder-secure-payment.webp` | 1600×900 (proposal) | Review before publication |
| `daip_governance_gates` | /admin-daip-governance.html and DAIP promotion-gate documentation | safe internal diagram after staging validation; no customer records, media, keys, bucket names, paths, or signed links | `placeholder-daip-governance-gates.webp` | 1600×900 (proposal) | admin governance approval |
| `customer_access_control` | /admin-customers.html and account-recovery guidance | approved generic account-support diagram with all customer names, emails, reset links, tokens, payments, and media removed | `placeholder-customer-access-control.webp` | 1600×900 (proposal) | admin security review |
| `daip_phase1_readiness_review` | /admin-daip-readiness.html and DAIP readiness documentation | internal decision diagram after staging acceptance; never customer media, credentials, bucket names, paths, or signed links | `placeholder-daip-phase1-readiness-review.webp` | 1600×900 (proposal) | Review before publication |
| `daip_private_mvp_blueprint` | admin-only DAIP design review | abstract internal review diagram only; never customer information, real media, storage names, credentials, or public destination logos | `placeholder-daip-private-mvp-blueprint.webp` | 1600×900 (proposal) | Review before publication |
| `daip_gate_c_technical_review` | /admin-daip-gate-c.html | abstract internal diagram only; never customer data, media, credentials, external service details, paths, or URLs | `placeholder-daip-gate-c-technical-review.webp` | 1600×900 (proposal) | Review before publication |
| `social_analytics_connection_centre` | /admin-integrations.html and connection setup documentation | approved generic integration setup diagram; never use screenshots containing IDs, secrets, customer data, tokens, credentials, browser inspector output, or account numbers | `placeholder-social-analytics-connection-centre.webp` | 1600×900 (proposal) | Review before publication |
| `daip_integration_boundary` | /admin-integrations.html and DAIP external-service planning | abstract internal decision diagram only; never show real providers, media, paths, bucket names, URLs, or credentials | `placeholder-daip-integration-boundary.webp` | 1600×900 (proposal) | Review before publication |
| `daip_intake_dry_run` | admin DAIP intake dry-run workspace | an internal architecture diagram only; never customer media or credentials | `placeholder-daip-intake-dry-run.webp` | 1600×900 (proposal) | Review before publication |
| `creative_project_intelligence` | admin creative-project workspace hero | an approved internal workflow diagram containing no customer or credential data | `placeholder-creative-project-intelligence.webp` | 1600×900 (proposal) | Review before publication |
| `startup_go_live_command_path` | Startup Go-Live Guide and launch readiness navigation | A clean internal process diagram or privacy-safe screenshots of the actual Rosie admin pages | `placeholder-startup-go-live-command-path.webp` | 1600×900 (proposal) | Review before publication |
| `inventory_transactional_posting_reversal` | Inventory Posting & Reversal admin page and operator training | A Rosie-branded workflow diagram or privacy-safe screenshot after live acceptance testing | `placeholder-inventory-transactional-posting-reversal.webp` | 1600×900 (proposal) | Review before publication |

## E. Reserved Standard theme assets (27)

| Slot | Filename | Recommended canvas | Runtime status |
|---|---|---|---|
| `brand_logo` | `assets/themes/standard/images/brand-logo.png` | 800×800 | reserved; verify live wiring / R2 priority |
| `brand_banner` | `assets/themes/standard/images/brand-banner.webp` | 1920×480 | reserved; verify live wiring / R2 priority |
| `hero_background` | `assets/themes/standard/images/hero-background.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `reviews` | `assets/themes/standard/images/reviews-proof.webp` | 1600×900 | reserved; verify live wiring / R2 priority |
| `package_basic` | `assets/themes/standard/images/package-basic.webp` | 1600×900 | reserved; verify live wiring / R2 priority |
| `package_complete` | `assets/themes/standard/images/package-complete.webp` | 1600×900 | reserved; verify live wiring / R2 priority |
| `package_premium_wash` | `assets/themes/standard/images/package-premium-wash.webp` | 1600×900 | reserved; verify live wiring / R2 priority |
| `addon_pet_hair_removal` | `assets/themes/standard/images/addon-pet-hair-removal.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_odor_treatment` | `assets/themes/standard/images/addon-odor-treatment.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_seat_shampoo` | `assets/themes/standard/images/addon-seat-shampoo.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_carpet_shampoo` | `assets/themes/standard/images/addon-carpet-shampoo.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_salt_stain_treatment` | `assets/themes/standard/images/addon-salt-stain-treatment.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_headlight_restoration` | `assets/themes/standard/images/addon-headlight-restoration.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_windshield_ceramic_coating` | `assets/themes/standard/images/addon-windshield-ceramic-coating.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_ceramic_spray_wax` | `assets/themes/standard/images/addon-ceramic-spray-wax.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_trim_restoration` | `assets/themes/standard/images/addon-trim-restoration.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_bug_tar_removal` | `assets/themes/standard/images/addon-bug-tar-removal.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_truck_box_wash` | `assets/themes/standard/images/addon-truck-box-wash.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `addon_fleet_vehicle_add_on` | `assets/themes/standard/images/addon-fleet-vehicle.webp` | 1600×1067 | reserved; verify live wiring / R2 priority |
| `town_tillsonburg` | `assets/themes/standard/images/town-tillsonburg.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_woodstock_ingersoll` | `assets/themes/standard/images/town-woodstock-ingersoll.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_simcoe_delhi` | `assets/themes/standard/images/town-simcoe-delhi.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_port_dover` | `assets/themes/standard/images/town-port-dover.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_norwich_otterville` | `assets/themes/standard/images/town-norwich-otterville.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_zorra_thamesford_embro` | `assets/themes/standard/images/town-zorra-thamesford-embro.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_waterford_vittoria` | `assets/themes/standard/images/town-waterford-vittoria.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |
| `town_port_rowan_turkey_point` | `assets/themes/standard/images/town-port-rowan-turkey-point.webp` | 1920×1080 | reserved; verify live wiring / R2 priority |

## F. Source scanning coverage NOT established by the registries

Registries do NOT prove coverage of: (1) `<img src>`, `srcset`, `<picture>`, video posters, meta OG images in every public/static/Admin HTML file; (2) `url(...)` in CSS, `background-image` style attributes, embedded data URLs; (3) SVG files and SVG viewBoxes; (4) generated image URLs in JavaScript, API, or Admin portals; (5) real bytes of local binary assets or private R2 records. See `scripts/audit_standard_theme_media.mjs` for a deterministic repository-wide file scan. Run it on a complete local checkout to produce path/line/source reports and a separate missing-file candidate report. This report has **not** been run in this chat because a full filesystem checkout was unavailable.

## G. Operational privacy and source precedence

1. Actual assigned, approved Photo Studio/public R2 image.
2. Explicit authored public image or public site-settings image.
3. Standard theme static filename only when declared and present, as a safe non-evidence fallback.
4. Existing generic service placeholder (never a misleading before/after or review image).

Admin private evidence, customer progress, invoices, QR/payment links, tokens, private car photos and video timelines must never be auto-populated with public theme assets. For protected content, show a generic locked/empty state only.
