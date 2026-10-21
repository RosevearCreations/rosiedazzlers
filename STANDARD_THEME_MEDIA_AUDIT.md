# Rosie Dazzlers — Standard Theme & Visual Asset Audit (Phase 1)

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
