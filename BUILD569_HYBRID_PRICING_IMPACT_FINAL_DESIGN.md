# Build 569 — Hybrid Pricing, Quote-First Wizard Impact Assessment & Final Design Packet

**Stage:** design-only proposed final design, pending explicit owner approval of public-pricing policy and customer journey. **No** changed catalog price, booking/quote rule, Stripe transaction, database migration, production variable, public page, or public media. **Dependency:** Build 568, [PR #365](https://github.com/RosevearCreations/rosiedazzlers/pull/365), must independently be Production GREEN before Build 569 may join `dev`/`main`. This contract is tracked under [Planning Issue #364](https://github.com/RosevearCreations/rosiedazzlers/issues/364).

## 1. Verified source-state and authoritative locations

Inventory reviewed at the Build 562 protected-main code baseline:
- `pricing.html` and `services.html`: redirect-style information pages displaying **“Services, prices and booking are now together”**. `pricing/index.html` and `services/index.html` also exist; verify route parity before future implementation.
- `book.html` and `book/index.html`: customer-facing consolidated “Mobile detailing services, prices & booking” page. It already guides vehicle size, package and live price, specialty work, availability and booking. `booking-planner.html` is the substantive step wizard with date/town/vehicle/package/add-ons/deposit. `assets/booking-wizard-responsive-v325.js` handles mobile, focus, field errors and step navigation. Preserve all existing authority until phased rollout.
- `data/rosie_services_pricing_and_packages.json`: bundled fallback **not necessarily live pricing**. `functions/api/_lib/pricing-catalog.js` first loads `app_management_settings.pricing_catalog` from Supabase and falls back to this JSON. `assets/pricing-catalog-client.js` wraps the legacy public catalog and preserves Rosie-supplies-water-and-power operating rule. Admin/public pricing APIs and duplicated legacy consumers must be audited before changing labels or prices.
- `functions/api/_lib/quote-booking-authority.js` validates current catalog package/vehicle/add-on eligibility and **requires manual review** for add-ons with `quote_required` or missing price; it also re-checks AM/PM availability, date/slot blocks and booking holds. `functions/api/admin/lead_quote_preview.js` supports lead quote preview; `functions/api/admin/lead_conversion_create_booking.js` enforces accepted terms, latest pricing and booking availability, with replay protection. Preserve these as server truth.
- `gift-cards.html` has its own gift rules; `maintenance-plan.html` is a maintenance interest list, not active recurring billing. `config/maintenance-plan-business-rulebook.json` is awaiting approval and all enrollment/billing controls are false.
- Multiple quote/availability/seasonality/mobile owner gates exist in `.github/workflows/`. Retain their coverage. Vehicle price charts use 2025-named images; review freshness, never quietly treat chart images as up-to-date prices.

## 2. Baseline pricing snapshot — FOR DISCOVERY ONLY, do not change or promise these are live

Current bundled fallback in CAD for small / mid / oversize:
| Package code | Bundled label | Fallback prices | Deposit |
|---|---|---|---|
| `premium_wash` | Premium Wash | $85 / $105 / $125 | $50 |
| `basic_detail` | Basic Detail | $115 / $135 / $170 | $50 |
| `complete_detail` | Complete Detail | $319 / $369 / $419 | $100 |
| `interior_detail` | Interior Detail | $195 / $220 / $245 | $100 |
| `exterior_detail` | Exterior Detail | $195 / $220 / $245 | $100 |

**Important conflict to resolve:** legacy commercial discussions have cited a different Basic Detail price. Reconcile actual Supabase App Management catalog, bundled fallback, public copy, any cached chart images, quote/deposit/checkout truth and taxes BEFORE choosing or publishing any “from” price. Do not edit any existing value in Build 569.

The catalog has 24 add-ons. Existing `quote_required: true` includes Two Stage Polish, De-Ionizing Treatment, De-Badging, Engine Cleaning, Ceramic Coating, Graphene Fine Finish, Vinyl Wrapping, Window Tinting, Pet Hair Removal, Odor Treatment, Seat/Carpet Shampoo, Salt Stain Treatment, Headlight Restoration, Trim Restoration, Bug and Tar Removal, Truck Box Wash, Fleet Vehicle Add-On. Other add-ons such as Full Clay Treatment, Wax, Sealant and Ceramic Spray Protection have catalog prices without mandatory review. **Never transform a quote-required service into fixed-price checkout because of a marketing label.**

## 3. Recommended hybrid presentation policy — requires owner sign-off

The dominant **front-of-site** CTA becomes “Tell us what your vehicle needs” → a short guided recommendation → **Request your tailored quote**, with an independently available “Book a known service” path retained during controlled rollout.

- **Transparent starting-from price (optional after owner and source validation):** stable scoped maintenance packages, e.g. Premium Wash and possibly Express/Basic Detail. Always clarify vehicle size, condition, travel, taxes and that the final quote can change; do NOT represent as a guaranteed total.
- **Individual quote or inspection:** variable/deep-condition Complete/Interior/Exterior work, and every add-on the authoritative catalog already marks `quote_required`. No fixed price / deposit transaction until staff and current server authority approve a bookable quote.
- **Add-ons:** service landing pages describe work, risks, expected outcomes, care and suitability; show “Request assessment” for condition-dependent services. Catalog truth decides quote-required behavior, not landing-page copy.
- **Gift cards and maintenance:** gift-card denominations/obligations remain unaffected; maintenance plan remains interest-only until a separate approved business-policy change.
- **Friction/SEO:** do not universally erase all prices without approval. Evaluate starting-from vs quote-only display using consent-safe analysis. An owner may choose quote-only for selected packages. Public price disclaimers must be plainly visible.

No “free quote guarantees”, undisclosed fees, fabricated availability, guaranteed stain removal, automatic ceramic results or professional certifications without evidence.

## 4. Final proposed guided UX (to implement in Build 570+ only)

**Entry:** hero card “What does your vehicle need?”, links to service categories, region/weather limitations and “Already know your service? Book” fallback.

**Screen A — Vehicle & location:** car/SUV/truck/oversize, size, postcode or town, safe private driveway/space availability, Rosie brings standard water/power, temperature/season constraints. Do not collect full street address until needed.

**Screen B — Goals & condition:** maintenance refresh, deep interior, exterior/protection, pre-sale, special circumstances; condition/severity chips, optional private photo upload with consent and clear retention controls.

**Screen C — Services:** show up to 3 grounded recommendations with suitability/limitations, readable service card, optional transparent price starting points where authorized; do not infer a final fixed price or confirm booking.

**Screen D — Optional add-ons:** condition-specific cards, prerequisite eligibility, quote-required flags and a link to detailed landing page; no automatic billed add-on. Review source-of-truth prices only for allowed fixed-price scopes.

**Screen E — Review and request:** summarize vehicle, approximate site, selected needs/add-ons, preferred dates (non-binding), name/contact and permission for staff response. Explicit label **“Quote request — not a confirmed booking”**. Confirmation includes acknowledgement/reference, realistic manual follow-up and next steps. Validate/sanitize, rate-limit, consent-log, prevent duplicate submission; respect GDPR/PIPEDA and CASL applicable communications rules (counsel review as needed).

**Confirmed booking continuation:** staff review/supply accepted quote → server revalidates catalog and add-on eligibility → customer accepts commercial terms → fresh availability check/hold → deposit/Stripe only when server and staff authorization permit → confirmation. Existing admin lead/quote/conversion paths remain authoritative; no phantom booking, automatic consent, double charge or bypass of 409 conflicts.

**Mobile & accessibility:** 44+ px targets, good contrast, focus management, keyboard and reduced-motion support, progress/previous/resume (no unconsented long-term personal storage), clear errors and minimal required fields. Email/phone alternatives for users who cannot use a wizard.

## 5. Customer-facing IA and content map

| Surface | Proposed next-build changes | Guard |
|---|---|---|
| `index.html` | prominent quote-first CTA + concise service category cards | retain working existing booking link |
| `pricing.html`, `pricing/index.html` | curated explainers: transparent starting-from vs custom estimate | no stale/static published totals; canonical links |
| `services.html`, `services/index.html` | service overview and suitability | do not invent certifications/outcomes |
| `book.html`, `book/index.html` | guided quote path as primary; existing booking fallback | no unapproved price/availability changes |
| `booking-planner.html` | retain authoritative current confirmed-booking wizard | server controls untouched |
| New add-on pages | scoped content for ceramic, graphene, paint correction, engine, interior remediation, headlights, tint/wrap, odor/pet/salt, clay/wax/sealant | manual quote on flagged services |
| `gift-cards.html` | link to gift suitability guidance | no payment/denomination changes |
| `maintenance-plan.html` | explain interest-only vs subscription | no recurring billing activation |
| Admin lead/quotes | show origin/needs and privacy-safe image metadata | staff review, source trace, immutable terms, audit |

**SEO:** inventory canonical routes, duplicate `.html`/directory aliases and redirects; preserve indexable page identity and one meaningful H1; localized Oxford/Norfolk service area copy truthful, structured data only for actually supplied service claims, no fabricated aggregate ratings.

## 6. Media specification — new images needed, not generated or uploaded in Build 569

- Hero full-width mobile detailing demonstration: **1920×1080** landscape and **900×1200** mobile portrait crop; owned/licensed photo of Rosie on a real permitted worksite, own water/power visible where appropriate; avoid customer plates/faces without permission.
- Service category tiles (maintenance, interior, exterior, complete): **1200×900** 4:3 each, authentic vehicle scenes and accurate scope.
- High-cost add-on landing hero (ceramic, graphene, paint correction, tint, engine/odour remediation): **1600×900** 16:9 each; editorially realistic before/after only with consent, consistent lighting, no misleading enhancement.
- Add-on detail cards: **1000×1000** each, contain one clear treatment subject per image, alt text by action/benefit.
- Before/after pairs: **1200×900** each at matched angle/light and anonymized identifiers; explicit permission and truthful treatment label.
- Process/quote-wizard explanatory image: **1200×800** each; optional only if it clarifies steps, avoid decorative clutter.

Recommended visual theme: Rosie Dazzlers established colors/branding, clean approachable *mobile detailing in Southern Ontario*, natural light, realistic textures, accessible high-contrast labels, no generic luxury-vehicle claims. All sizes are recommended targets pending brand/page layout approval.

## 7. Scope and regression risk matrix

**High:** price authority mismatches (App Management vs fallback vs chart/cached copy), booking/slot/replay/collision, payment/deposits/tax, quotes becoming fake reservations, quote-required add-on eligibility. Mitigation: no code in 569; server contract remains final; feature-flag eventual implementation, test money flows and booking 409, audit actual catalog.

**High:** privacy and media consent, sensitive vehicle/address details, unreviewed photos, spam/injection. Mitigation: minimize early inputs, private/staged uploads and server validation, retention and staff ACL approvals.

**Medium:** SEO duplicate alias routes and stale 2025 chart photos, accessibility/CLS/LCP, mobile form abandonment, weather/site capacity and one-car-per-day expectation. Mitigation: canonical/crawl checks, real-device tests, copy controls, capacity-aware nonbinding interest dates.

**Medium:** admin quote follow-up workload, seasonal delivery, before/after content accuracy, staff training, referral/rebooking and gift cards. Mitigation: staff scripts, lead triage queue, measured rollout, easy reversion.

**Low to medium:** static page assets and service card image cropping; require link/alt/licensing audits.

No new provider key, Supabase schema, Stripe setting or price edit is warranted by this design-only release. Any implementation proposals requiring one must be separately reviewed.

## 8. Build-by-build proposed implementation and gates

- **569 (this build):** source-grounded impact assessment, recommended final design, decision matrix, asset list, architecture and no-code tests; Production code GREEN may happen without changing customer UX. Owner must approve choices.
- **570:** quote-first wizard shell on *isolated feature preview*, no live lead submission by default, accessibility and routing tests.
- **571:** public service architecture / approved pricing-display decisions with live-catalog read-only mapping; no server price mutation, staged SEO parity.
- **572:** add-on landing pages, accurate explanations and approved images/alt/licenses; preserve manual-review flags.
- **573:** quote request to staff pipeline, consent/rate limiting/idempotency/optional private photos and quote-to-booking handoff, guarded tests, no auto-confirmation.
- **574:** mobile usability, production data parity, capacity/weather, Stripe/quote/booking end-to-end regression; controlled flag and rollback rehearsal.
- **575:** measured consent-safe rollout, A/B outcome and owner-approved publication/SEO review; close gaps and renew roadmap.

Every future build must pass its own exact feature/Development/protected-main/Cloudflare production checks. No invented Build 570–575 code, branch or approved launch is implied by this list.

## 9. Explicit owner decisions (all NOT YET APPROVED)

1. Which packages show starting-from price vs request-quote only; especially existing Basic Detail discrepancy. Reconcile real App Management catalog first.
2. Is the new quote-first wizard primary on home and book pages, with direct fixed-price booking retained as alternate?
3. Which add-ons require separate inspection, images and disclosures; how to display starting prices on any quote-required offering.
4. Retain existing deposit/tax/travel and gift-card policies unchanged? Which grandfathering rule protects accepted quotes.
5. Approve final site copy, image ownership/consent and brand styling.
6. Approve nonbinding preferred-date capture vs confirmed slot, customer notices, data-retention period, rollout/rollback thresholds.

**Default safety decision while unresolved:** existing Production behavior unchanged, no public redesign, no changed pricing/charges or booking semantics.

## 10. Feature/Deployment acceptance for Build 569 (DESIGN only)

`assets/hybrid-pricing-design-569.js` exposes only review recommendations and explicit unapproved status. `scripts/hybrid_pricing_design_569_test.mjs` tests that simulated approval flags never activate a new wizard, change pricing, submit leads, book slots, charge deposits, publish media or declare owner sign-off. Dedicated CI runs on feature PR. This design may reach protected main only after Build 568 is fully code Production GREEN and this build's exact feature, dev and main/Cloudflare production proof is complete.

Operational/marketing redesign is **NOT LIVE** from this build. Quote-first wizard implementation requires separately approved Build 570+ release.
