# Rosie Dazzlers — Standard Theme & Visual Asset Audit (Phase 1)

## Standard colour refresh — owner artwork handoff (2026-10-21)

`assets/themes/standard.css` now styles unlabelled pages (the current default)
and pages explicitly marked `data-rosie-theme="standard"` with a consistent
charcoal `#0b0e11`, metallic gold `#dec06d`, bright gold `#f0d58c`, deep gold
`#b58c38`, silver `#aeb7be`, and white `#f5f6f7` theme. Shared navigation,
hero cards, primary buttons, booking selections, notifications, focus rings,
and semantic theme variables use the palette. Error and success colours stay
distinct for legibility. The `assets/site.css` import version was updated.

This changes visual CSS only; **it does not turn on a theme picker, override
approved Photo Studio/R2 assets or activate any not-yet-uploaded image**.
Static candidate filenames and required canvases are in
`docs/audits/ROSIE_APPLICATION_STATIC_IMAGE_CATALOG.md`. The owner can upload
them to `assets/themes/standard/images/` on `dev` for subsequent visual review.
Run `node scripts/standard_theme_palette_test.mjs` to check the palette contract.
The original phase-one audit below remains historical context.

## Current theme preserved
The original dark appearance is **Standard**. Existing CSS is `/assets/site.css` which imports `site-base-build396.css` and `build397-responsive-baseline.css`. Baseline variables are recorded in `/assets/themes/standard.css`; this stylesheet does not replace the existing rules. Registry: `data/theme_registry.json`.

Future site-wide switching will need to include public pages, staff/Admin pages, logo/banner choices, email templates where appropriate, accessibility and user preference persistence. **No switch UI is active yet.**

## Image inventory — verified existing media sources
- Shared chrome `assets/chrome.js`: logo `https://assets.rosiedazzlers.ca/brand/Untitled.png`, banner `https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png`, fallback reviews `/assets/brand/rosie-reviews-fallback.png`, footer logo same as logo. Values may be superseded by public business profile settings. These MUST NOT be forcibly replaced with theme filenames.
- CSS `assets/site-base-build396.css`: background image `https://assets.rosiedazzlers.ca/brand/KatBlackCar.PNG`.
- `data/visual_placeholder_registry.json` tracks service, town, gallery, fleet, video, incident and many private/admin placeholder categories. **Private evidence and signed customer media are not automatically replaceable.**
- `IMAGES.md` and `data/image_requirements_build185.json` provide historical exact R2 keys and upload constraints. The existing keys remain canonical for live R2-based pages.
- `assets/addons/*.svg` includes service graphics (1400 × 900 on many files); `assets/vehicles/outline_front.svg` and `outline_back.svg` have 640 × 360 viewBoxes; the fallback service image SVG has 1200 × 750 viewBox.
- The reserved filenames for a future Standard-theme artwork folder are in `data/standard_theme_image_slots.json`. **They are not all currently live-bound.**

## Existing R2 upload keys and recommended canvas sizes
| Area | Filename / key rule | Minimum | Preferred |
|---|---|---|---|
| Add-on cards | `packages/<addon>.png` | 1200 × 800 | 1600 × 1067 |
| Package cards | `packages/<package>.png` | 1200 × 800 | 1600 × 900 |
| Town landing hero | `landing-pages/<town>-auto-detailing.jpg` | 1600 × 900 | 1920 × 1080 |
| Before/after | `gallery/<town>-<service>-before.jpg` and `...after.jpg` | 1200 × 900 | 1600 × 1200 |
| Video | `videos/<name>.mp4` or `.webm` | 720p | 1080p |

### Specifically documented R2 add-ons (12)
`packages/pet_hair_removal.png`, `packages/odor_treatment.png`, `packages/seat_shampoo.png`, `packages/carpet_shampoo.png`, `packages/salt_stain_treatment.png`, `packages/headlight_restoration.png`, `packages/windshield_ceramic_coating.png`, `packages/ceramic_spray_wax.png`, `packages/trim_restoration.png`, `packages/bug_tar_removal.png`, `packages/truck_box_wash.png`, `packages/fleet_vehicle_add_on.png`.

### Specifically documented town heroes (8)
`landing-pages/tillsonburg-auto-detailing.jpg`, `landing-pages/woodstock-ingersoll-auto-detailing.jpg`, `landing-pages/simcoe-delhi-auto-detailing.jpg`, `landing-pages/port-dover-auto-detailing.jpg`, `landing-pages/norwich-otterville-auto-detailing.jpg`, `landing-pages/zorra-thamesford-embro-auto-detailing.jpg`, `landing-pages/waterford-vittoria-auto-detailing.jpg`, `landing-pages/port-rowan-turkey-point-auto-detailing.jpg`.

## Phase 2 required for exhaustive page-by-page audit
This phase-1 file is **not an exhaustive inventory of every image in every route**. Search and inspect all public route templates and root HTML, admin HTML, CSS image URLs, JS-created images, SVGs, app icons and dynamic media records. For each slot, record route, selector, active source, placeholder status, required dimensions/aspect ratio, alt text, privacy/approval status, agreed exact filename, and whether local static or R2 delivery applies. Only then rewire static placeholders with safe fallback behavior and verify no approved R2 photo is displaced.

Before replacing image placeholders, check consent/privacy. Do not publish real private job proof, customer invoices, review evidence or staff screenshots as generic theme art.

## Current status
Standard baseline and reserved naming contract created. Full page-by-page audit and live placeholder rewiring **not complete**. No Cloudflare Production GREEN claim is made by these files.

## Phase 2 update — live filename fallback wiring (development only)

The shared `assets/landing-page-build388.js` now imports `assets/standard-image-slots.js`. Its `bindLandingMedia()` tries the existing original image and known-format alternatives first; then a Standard static filename for the current service slug; then the original safe service placeholder. An absent image remains a normal placeholder. Photo Studio explicit assignments and authored R2 images retain precedence.

Verified slug-to-filename mappings in the live renderer:

| Service route | Standard filename | Preferred canvas |
|---|---|---|
| `/pet-hair-removal` | `addon-pet-hair-removal.webp` | 1600 × 1067 |
| `/odor-removal` | `addon-odor-treatment.webp` | 1600 × 1067 |
| `/seat-shampoo` | `addon-seat-shampoo.webp` | 1600 × 1067 |
| `/carpet-shampoo` | `addon-carpet-shampoo.webp` | 1600 × 1067 |
| `/salt-stain-treatment` | `addon-salt-stain-treatment.webp` | 1600 × 1067 |
| `/headlight-restoration` | `addon-headlight-restoration.webp` | 1600 × 1067 |
| `/windshield-ceramic-coating` | `addon-windshield-ceramic-coating.webp` | 1600 × 1067 |
| `/ceramic-spray-wax` | `addon-ceramic-spray-wax.webp` | 1600 × 1067 |
| `/trim-restoration` | `addon-trim-restoration.webp` | 1600 × 1067 |
| `/bug-tar-removal` | `addon-bug-tar-removal.webp` | 1600 × 1067 |
| `/truck-box-wash` | `addon-truck-box-wash.webp` | 1600 × 1067 |
| `/fleet-vehicle-add-on` | `addon-fleet-vehicle.webp` | 1600 × 1067 |

Upload under `assets/themes/standard/images/` with *exact spelling*. These mappings apply to dynamic landing images using the shared media resolver; pre-rendered static HTML images and arbitrary Admin cards remain separate audit tasks and are **not** represented as rewired.

This is a partial audit/wiring pass, **not** a claim that every image or SVG in the repository has been inventoried. No deployed route, browser or Cloudflare Production validation has been performed.

## Quote-first wizard coverage and development continuity

The optional quote-first wizard is independently documented by `BUILD570_QUOTE_FIRST_WIZARD_SHELL.md`, `BUILD573_QUOTE_REQUEST_STAFF_BOOKING_INTEGRATION.md` and `BUILD574_MOBILE_PRODUCTION_PARITY_BOOKING_REGRESSION.md`. Its preview route is `/preview/quote-first/`; the ordinary `/book` wizard remains active and independent. Customer contact intake requires explicit owner activation and Turnstile configuration, and must not be activated as a consequence of theme or artwork releases.

Theme and media audit includes the wizard as a separate UI surface: `preview/quote-first/index.html`, `assets/quote-first-wizard-v570.css`, `assets/quote-first-wizard-v570.js`, `assets/quote-first-intake-ui-v573.js`. Do not add a generic banner over the preview's existing no-quote/no-booking notice, and do not change its consent, validation or payments boundaries. Theme-switch implementation must provide accessible wizard styles and real-device visual verification before activation.

## Phase 3 — competitor-driven master inventory and static service wiring (2026-10-20)

**Confirmed from source registries:**
- Photo Studio: 617 registered targets spanning 62 page paths, in data/build253_photo_targets.json. Target types include 20 package cards, 24 add-on cards, 36 landing heroes, 108 landing gallery slots, 216 before/after components, 60 page backgrounds, Admin context, brand elements, proof, gallery and FAQ.
- Admin Media Health: 24 required R2 assets in data/media_requirements.json with exact R2 keys and minimum sizes.
- Visual placeholder taxonomy: 38 categories in data/visual_placeholder_registry.json including public, Admin and private evidence contexts.
- Standard theme proposed static asset manifest: 99 records (original 27 plus 24 wired process images and 48 reserved public-proof before/after images), in data/standard_theme_image_slots.json.
- Master slot/filename table: docs/audits/ROSIE_MEDIA_SLOT_CATALOG_STANDARD.md. This is 785 lines of full registered coverage and upload planning, not a count of missing image files.
- Full-checkout static source scanning script: scripts/audit_standard_theme_media.mjs. Once run inside a complete repository checkout, it writes docs/audits/GENERATED_MEDIA_REFERENCES.md and data/generated_media_reference_inventory.json, enumerating literal static HTML images, CSS image URLs, JS image URL literals, dynamic source fields and SVG viewBoxes. It is not yet run in a complete checkout, and its results cannot be represented as already verified.

**Verified application wiring on dev:** 24 individual public service pages now have a data-standard-filename on the intentionally generic *process* placeholder. Existing Photo Studio and authored R2 photos take precedence. assets/standard-static-media.js checks for the exact uploaded process-<slug>.webp filename and updates a service process placeholder only if that file loads and the placeholder remains unchanged. assets/chrome.js invokes it after public Photo Studio overrides; an absent upload leaves the original placeholder visible. The shared dynamic landing renderer also supports a service-specific filename fallback.

**Public proof caution:** Real before/after images stay explicitly approved/consented and target-key-assigned through Photo Studio. A similarly named file is NOT automatically treated as proof. The per-route proof-<slug>-before.webp and proof-<slug>-after.webp filenames are reservations, not live mappings.

**Competitor research:** docs/research/ROSIE_COMPETITOR_PROCESS_FEATURE_AUDIT_2026-10-20.md contains four-site primary-source observations, known Rosie overlap, 24 prioritized requirements, release safeguards, user journeys, and separate media concepts. This is research, not approval to change production pricing, accept quote photos, create another booking system or launch a public wizard.

**Still to verify:** a complete executed local scanner report; DOM-based rendered-image audit across every actual public and Admin route; binary image dimensions/crop and original SVG asset geometry; private R2/media records under staff authorization; any missing-file and broken-URL findings; accessibility and browser visual acceptance; deployment. No production GREEN claim.
