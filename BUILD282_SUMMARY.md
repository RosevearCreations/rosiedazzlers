# Rosie Dazzlers Build 282 — High-Intent Use-Case Conversion

## Boundary

Build 282 starts from the accepted Build 281 Development baseline at `6e0b6015066d2056ee023c35f939da4f5ad23384` and changes the customer acquisition-to-booking path only. It does not create a second pricing engine, change package/add-on prices, alter availability or booking conflict authority, change deposit/payment rules, mutate Production data, or move the Production branch.

Active feature branch: `build282-usecase-conversion`.

## Customer/business opportunity closed

Builds 277–280 deepened service/add-on and local SEO authority. Build 275 had already delivered true next useful appointment shortcuts and a returning-customer rebook accelerator. The next unblocked customer/business opportunity was therefore to turn high-intent customer situations into clear, crawlable acquisition paths that hand off directly to the existing Quick Book engine.

Build 282 adds three first-class use-case destinations:

1. **Pre-Sale / Lease-Return Detail** — starts from Complete Detail because the normal goal is consistent inside/outside presentation, while paint, headlights, odour, pet hair, stains, engine-bay work and other condition-dependent extras keep their own review/quote boundaries.
2. **Spring Salt Recovery** — starts from Interior Detail and explains the difference between light winter residue, crusted carpet salt and wet/saturated-floor history. Heavy extraction, hidden moisture, seat/trim access or under-carpet scope remains quote-reviewed.
3. **Fall / Winter Protection Prep** — starts from Exterior Detail so the paint, glass and trim are cleaned/decontaminated before an existing protection option is selected. It explicitly does not represent rustproofing or undercoating.

Each page is static-first and indexable, contains one meaningful H1, a production canonical, Service/Breadcrumb/FAQ structured data, useful scope/limitation copy, internal links, mobile-service setup and a direct Quick Book path.

## Acquisition → Quick Book bridge

`assets/booking-usecase-entry-v282.js` is a fail-open presentation adapter. It does not own pricing, availability, checkout, deposits, add-on prices or conflict logic.

The public `need=` presets map onto the retained Quick Book recommendations:

- `need=presale` → existing `presale` choice → Complete Detail starting recommendation;
- `need=spring_salt` → existing `deep_interior` choice → Interior Detail starting recommendation + photo review;
- `need=winter_prep` → existing `paint` choice → Exterior Detail starting recommendation + photo review.

The adapter reuses the existing Quick Book controls, writes a bounded Build 282 use-case note for staff review, preserves photo/condition evidence and emits `booking_usecase_entry` analytics. A failed optional adapter load leaves normal booking available.

## Pricing and scope authority

Build 282 deliberately avoids publishing a competing package-price table. Vehicle-size pricing, package/add-on prices, quote-required state, live availability, service-area constraints, deposits, checkout and conflict handling remain in the existing booking/catalog authorities.

Condition-dependent work remains explicit. Rosie confirms expanded scope before proceeding; a customer entering from a use-case page can still change the recommended package/add-ons before checkout.

The standard mobile operating authority remains unchanged:

> Rosie brings standard detailing water and power. The customer provides a safe, private and permitted work area. Unusual parking, building access, weather or local runoff/site restrictions are reviewed before dispatch.

## Discovery / SEO

`/specials` is now a seasonal/use-case discovery hub instead of presenting unapproved discount concepts as current offers. It links the three Build 282 destinations and explains that they are decision guides into the existing booking/pricing engine.

The sitemap now carries the three use-case pages and refreshed `/specials/` entry with `2026-08-31` lastmod authority.

No fabricated customer reviews, invented discounts or unsupported outcome guarantees are introduced.

## Validation contract

Build 282 is protected by:

- `scripts/build282_release_check.py` — focused customer/business contract;
- `scripts/seo_h1_check.py` — retained cumulative hook, which runs Build 282 when the focused guard exists;
- `.github/workflows/build282-source-gate.yml` — exact feature-branch source validation;
- `scripts/development_http_smoke.sh` — exact/static and Development-alias smoke for the adapter, all three public use-case routes and sitemap identity;
- the existing Development Source Gate and Cloudflare Development Acceptance through their cumulative/shared guard paths.

Build 282 is not Development-accepted until its latest feature SHA is source-green, `dev` is fast-forwarded to that exact SHA, Cloudflare reports the exact Development deployment successful with Functions attached, exact static artifact smoke passes, and the `dev` alias passes the full runtime smoke.

## Production boundary

**Production remains closed.** Build 282 does not merge, force-update, deploy or otherwise mutate `main`. Production promotion remains a later deliberate decision from an accepted Development release, with the existing divergent-history reconciliation rule preserved.
