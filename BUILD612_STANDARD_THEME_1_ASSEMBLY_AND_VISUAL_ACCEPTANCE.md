# Rosie Dazzlers — Build 612: Standard Theme #1 Assembly & Visual Acceptance

## Purpose

Assemble the owner-created Standard theme into the application, address common
typography and layout overflow, preserve genuine employee/customer media, and
make the visual release checkable before returning to substantive workflows.

**Status:** local source/inventory acceptance passed; rendered viewport/operator
acceptance and exact Production deployment verification **pending**. No source
test, artifact count or GitHub check is a substitute for Cloudflare Production
GREEN at the promoted `main` SHA.

## What changed

- Installed the completed owner-provided Standard image variants in
  `assets/themes/standard/images/` and the five conceptual Admin SVGs in
  `assets/themes/standard/admin/`, without overwriting older source assets.
- Registered Standard hero, default logo, banner, neutral review fallback,
  customer PWA icons and favicon within the theme namespace. An explicit Owner
  business-profile logo/banner still takes precedence over the bundled default.
- Removed hard-coded sample testimonials from the review feed fallback; when
  verified review data is unavailable, the page shows a neutral message. The
  public endpoint also fails closed without an explicitly verified source.
- Added mapped town and service artwork as **decorative fallbacks only**.
  Managed Photo Studio/R2 imagery is displayed in preference; simulated
  before/after work, reviews and customer proof are never inserted.
- Kept 24 process illustrations as opt-in static fallback only after existing
  managed imagery, preserving the previous service-photo placeholder when a
  themed file cannot load.
- Reserved package marketing art for catalogue image gaps; actual catalogue
  images remain first priority.
- Used existing Admin placeholder hooks for three named static workflow
  illustrations. The remaining two are registered for a future explicit slot;
  they do not replace private Admin/customer evidence.
- Applied charcoal/gold/silver forms, controls, button selection, focus,
  headings, responsive cards, nav and long-label wrapping in the Standard
  stylesheet. This is a source-level overflow mitigation, not a browser QA
  certification.
- Updated manifest icons and service-worker precache to the installed Standard
  artwork, with a fresh service-worker cache name.
- Fixed the catalog generator to count theme files only once and report real
  file availability, retaining the stable numbered **IMG-001 through IMG-116**
  authority. All 116 original/planned files are now present locally.
- Added focused deterministic regression tests to the theme audit workflow.

## Explicit holds and governance

1. `CarPrice2025.PNG` and `CarPriceDetails2025.PNG` are legacy owner-review
   material. Their amounts/inclusions may be outdated; themed versions are **not
   connected as live pricing** and must not be published as current rates.
2. Before/after, customer reviews, real-job progress, inventory and customer
   vehicle photos remain staff/owner-managed in Photo Studio, R2 or their
   approved workflow. Static fallback art is not proof and creates no consent.
3. Owner theme selection, preview, activation history and persistence for
   future themes are **not** enabled by Build 612. `standard` remains the sole
   registered baseline theme, with a namespace ready for future versions.
4. Fully rendered desktop/tablet/mobile acceptance, protected Admin screenshots,
   accessible contrast at runtime and production CSS/font overflow checks are
   required before declaring visual closure.
5. Cloudflare Deployment ID, `main` SHA, runtime route checks, and independent
   exact-SHA Production receipt are required to declare Production GREEN.

## Tests

From the repository root:

```
node scripts/standard_theme_palette_test.mjs
node scripts/build612_standard_theme_assembly_test.mjs
node scripts/build_application_static_image_catalog.mjs --check
node scripts/build611_image_catalog_test.mjs
node scripts/reconcile_rendered_visual_audits_test.mjs
node scripts/triage_visual_image_slots_test.mjs
```

## Required visual acceptance matrix

| Surface | Width(s) | Accept only if |
| --- | --- | --- |
| Home / service cards | 375, 768, 1440 px | Correct media ownership; no heading, CTA or image overflow |
| Booking `/book` | 375, 768, 1440 px | Package/price/deposit labels readable; action buttons usable |
| 8 town pages | 375, 1440 px | Correct town art; R2/Photo Studio proof retained |
| Service/process pages | 375, 1440 px | Approved image first; static fallback only in process slot |
| Admin Creative/Startup/Roadmap | 375, 1280 px | No cropped controls, customer evidence replaced, or leaking data |
| PWA install / manifest | 192 and 512 px | RD icons legible, maskable safe region respected |

Record actual browser screenshots, viewport measurements, missing-image
exceptions and owner decisions under the normal Build 609–611 visual evidence
process. No synthetic acceptance decision is permitted.

## Return to substantive builds

After exact Production verification, focus the next work on meaningful
customer and operator capability rather than generating additional image
batches:

1. **Booking/quote-first wizard:** reconcile package prices with the current
   authority and introduce a clear condition-aware quote request flow.
2. **Photo Studio/R2 reliability:** resolve autosave, subrequest, sync and
   upload failures; ensure approved images are predictable on the live site.
3. **Admin inventory and job-usage workflow:** coherent image selection,
   partial consumables usage, stock units and per-job reporting.
4. **Owner Theme Manager:** preview, clone, approve, activate and roll back
   themes, with locked static assets and staff-managed image separation.

The active operational `AUTONOMOUS_RELEASE_QUEUE.md` remains authoritative
for gated Production promotion; these are priority themes to reconcile into
the next confirmed queue entries.
