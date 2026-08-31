# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 274  
**Updated:** 2026-08-30  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 273 is the retained Finance/tax-support baseline. **Build 274 is the only active release** and is summarized as it evolves in `BUILD274_SUMMARY.md`.

Current Development rule:

- work from accepted `dev` through `build274-full-closure-queue`;
- promote back to `dev` only after source coherence and focused/cumulative gates are green;
- exact-SHA Cloudflare Development acceptance is required after promotion;
- `main` / live Production remains untouched unless deliberate Production promotion is explicitly requested;
- do not reopen old build numbers for later manual evidence.

Build 274 now has a dedicated source-only GitHub Actions gate at `.github/workflows/build274-source-gate.yml`. It runs on the feature branch before `dev` promotion and does not contact Cloudflare or external providers. Development acceptance remains a separate `dev`-only workflow.

## Application boundary

Rosie Dazzlers remains one secured, **mobile-first application platform** with a static-first public website and eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

The public website is the acquisition/search surface; booking, customer account, Detailer, Operations, Administration, Finance, I.T., DAIP and Socials remain application experiences optimized first for phones and touch use, then tablet/desktop.

Permanent runtime rule:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; workflow state decides whether an authorized module actually wakes.**

`/app/` is the Staff App Launcher. `/app/admin/` is Administration. Native packaging remains a later shell around the same event-driven web application rather than a fork of business logic.

## Role / module / action authority

Role ceilings remain:

| Role | Maximum modules |
|---|---|
| `detailer` | Detailer |
| `senior_detailer` | Detailer + Operations |
| `operations_manager` | Detailer + Operations |
| `accountant` | Finance |
| `it_specialist` | I.T. |
| `promoter` | Socials & Promotion |
| `daip_manager` | DAIP |
| `admin` | all internal modules |

Authorities:

- module grants: `staff_users.permissions_profile.module_access`;
- per-user action overrides: `staff_users.permissions_profile.action_access`;
- action vocabulary/defaults: `data/action_permissions.json`;
- global module availability: `app_management_settings.module_runtime_flags`;
- server authorization is authoritative; hidden navigation is not security.

Retained Build 273 Finance authority includes `finance.view` and `finance.tax.manage`; Operations/Detailer roles do not receive Finance actions. Historical Development schema tolerance remains important: `permissions_profile` may be TEXT or object JSON and must continue to use the shared parser rather than being blindly converted.

## Retained Build 272/273 authority

Do not regress:

- narrow Operations/Finance action permissions;
- Complete = **Best value** and the current Small/Mid/Oversized pricing authority;
- Exterior Detail differentiated from Premium Wash;
- condition/quote rules before final price where work can vary materially;
- booking/deposit mechanics;
- one meaningful H1 per indexable public page;
- persistent Finance tax-support records, T2125 workpaper enrichment and accountant-package workflow;
- accounting evidence links, review requirements and no fabricated tax facts.

## Build 274 active implementation

### I.T. Connections and contextual help

Build 274 makes **I.T. Connections** the authoritative integration centre for Supabase, Cloudflare/R2, Stripe, PayPal, notifications, analytics, social/video publishing and prepared external/control-plane services.

The I.T. surface reports exact runtime names, configured/missing presence, storage type, acquisition instructions, testing, callbacks/scopes and troubleshooting without returning or accepting raw secrets.

Shared contextual help is an application-level system, not page-specific documentation. Protected screens receive page help and editable-field `ⓘ` help through the common loaders. I.T. fields/boxes that require external information have a stronger contract: their circular `i` must explain **how to obtain/configure the value from beginning to end**, including prerequisites, provider navigation, required scopes/roles, callback/redirect setup, safe storage location, bounded test procedure and troubleshooting. YouTube/Google OAuth is the first explicit example of this standard.

### Competitive / Google / conversion forward direction

The active public/business direction is now:

> **Google trust → service authority → frictionless mobile booking → real proof → repeat maintenance.**

Rosie is not primarily missing ordinary service breadth. The larger opportunity is to merchandise existing capability as clear specialist services with condition-aware quoting, real proof and strong local relevance.

#### Google/local-search priorities

1. Keep the homepage free of invented/sample testimonials. Genuine customer reviews may be rendered only from a verified review authority; Google Business Profile/review connection remains external acceptance.
2. Connect/verify Search Console and use query/page/impression/CTR/position data as the prioritization authority rather than guessing future SEO work.
3. Deepen every major service/add-on landing page so each explains problem severity, procedure, condition tiers, expected results/limits, time/price drivers, FAQ, proof and booking path. Headlight Restoration and Carpet Shampoo/Spill Extraction are the first Build 274 guarded specialist pages.
4. Add Rosie-owned before/after evidence to the exact service/local page it proves rather than relying only on a generic gallery.
5. Keep Oxford/Norfolk town pages genuinely distinct: actual jobs/proof, local conditions, service-area/access details, seasonal concerns, useful FAQs and direct booking paths. Do not mass-produce near-duplicate city doorway pages.
6. Keep business identity/LocalBusiness/Organization/Breadcrumb structured data coherent and sourced from one business-profile authority.
7. Keep one meaningful H1 per public/indexable page, crawlable static-first content, strong canonical/sitemap/internal-linking rules and no public R2 enumeration.
8. Feed Search Console findings back into the I.T./SEO dashboard so high-impression/low-CTR and page-two opportunities become visible work queues.

#### Service-market direction

Position Rosie as **Mobile Auto Detailing & Interior/Exterior Restoration** without abandoning the high-intent “mobile auto detailing” category.

Priority opportunities:

1. **Interior Carpet & Upholstery Restoration** — maintenance shampoo, deeper/repeated extraction and spill/water-intrusion recovery are different scopes rather than one flat-price promise. Current prices remain sourced from the canonical catalog and must not be duplicated as an independent pricing engine.
2. **Headlight Restoration tiers** — light oxidation, moderate restoration and severe restoration/failed-coating review with condition-based procedure, realistic outcome and protection. Current catalog tiers are now crawlably explained on `/headlight-restoration`.
3. **Ontario seasonal services** — Spring Salt Recovery, Post-Winter Interior Reset and Fall/Winter Protection using existing salt/protection capability.
4. **Pre-Sale / Lease-Return Detail** — bundle the relevant interior/exterior, headlights, engine-bay and paint-enhancement work into a high-intent use-case service.
5. **Maintenance plans** — Initial Reset → recurring 4/6/8-week maintenance → seasonal deep reset. Prefer priority/convenience/value over margin-destroying unlimited service.
6. **Fleet/workplace detail days** — target contractors, service businesses and small fleets where multiple vehicles at one location reduce travel overhead.
7. PPF, undercoating/rustproofing or other capital/equipment-heavy services are later partnership/build-vs-buy decisions, not immediate breadth targets.

Every condition-dependent add-on/landing page must explain why price/time can vary and when the booking becomes quote-first/photo-review rather than pretending all vehicles need the same labour.

### Booking / customer-experience direction

The current backend booking authorities remain; simplify the presentation around them instead of replacing working availability, pricing, quote, deposit and conflict logic.

The desired **Quick Book** experience is mobile-first and problem-first:

1. **What does your vehicle need?** — simple result/problem choices such as maintained clean, interior, pet hair/stains/salt, full reset, paint/protection, headlights, spill/wet recovery, pre-sale, fleet or “not sure.”
2. **What do you drive?** — year + make + model. Rosie should use the existing vehicle catalogue to suggest size/body metadata; do not force customers to understand internal vehicle classification.
3. **Choose where/when** — service area and the earliest useful availability; evolve toward “next 3 available appointments” before exposing the full calendar.
4. **Rosie recommends the service** — preselect the closest package/add-ons based on need/condition, but make the recommendation editable.
5. **Condition-dependent branch** — severe stains, salt, pet hair, spills/water, odour, paint defects, headlight oxidation and similar work should immediately encourage/require photo review when final labour cannot be trusted from a flat price.
6. **Optional details stay optional** — colour, mileage, category, body style and plate belong behind an optional/advanced disclosure unless a later rule genuinely needs them.
7. **Contact/payment only after value and slot are clear.** Keep the final acknowledgement/payment step concise.
8. **Returning customers** should progress toward `saved vehicle → repeat last/maintenance service → next opening → confirm deposit`, ideally in only a few taps.
9. Preserve 409 conflict handling, quote-only rules, deposits, service-area constraints, one-vehicle/day capacity and staff review authority.
10. Instrument the funnel so Rosie can measure start → vehicle complete → recommendation → slot selected → quote/photo path → checkout → paid booking → repeat maintenance.

The first Build 274 Quick Book presentation layer is implemented over the existing booking engine. It remains subject to exact Development/mobile acceptance after feature-source gates pass.

The application must remain touch-friendly, responsive, accessible, keyboard-safe and usable on weak/mobile networks. Do not simplify the UI by removing backend correctness.

### Resolved operating authority

The standard mobile setup is no longer a business-input question:

> **Rosie brings standard detailing water and power. The customer provides a safe/private work area. Unusual parking, apartment/condo access, site rules, weather or local runoff constraints are reviewed before dispatch.**

Browser and server pricing-catalog normalization already enforce this rule. Build 274 public homepage and specialist service pages now use the same wording. Do not reintroduce “customer provides water/power” as a default rule.

### Business-rule input that must be requested only when it becomes necessary

Do not block engineering that can proceed safely, but explicitly request business input before finalizing rules that cannot be inferred, including:

- material changes to current catalog starting/range pricing or labour thresholds for restoration tiers;
- whether seat removal/carpet lifting/water-intrusion work is offered in all locations and what site/weather constraints apply;
- any warranty Rosie wants to promise for restored headlights/protection work;
- exact maintenance-plan cadence/discount/perks/cancellation rules;
- fleet minimum vehicle count/discount/travel rules;
- final real Google review/GBP/Search Console credentials/account/property selections;
- any new service requiring insurance, certification, equipment or environmental-policy changes.

## Current validation authority

- cumulative guard: `scripts/release_check.py`;
- retained focused guards: `scripts/build271_release_check.py`, `scripts/build272_release_check.py`, `scripts/build273_release_check.py` where present;
- current focused guard: `scripts/build274_release_check.py`;
- feature source gate: `.github/workflows/build274-source-gate.yml`;
- Development workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Build 274 must not be called accepted on Development until the feature source gate and focused/cumulative source chain are green and the exact Development SHA passes Cloudflare/source/anonymous smoke acceptance. Authenticated/manual/provider/device evidence stays explicitly separate.

## Wake/sleep and cost rules

- no open Detailer job → no live job bundle/feed/media/message monitor;
- Operations and Finance datasets load only when selected;
- Customer progress refreshes only when useful and sleeps while hidden/inactive;
- completed jobs stop accepting new live-message writes;
- push/deep-link behavior is event-driven and one-shot;
- module/runtime flags are timer-free;
- no automatic replay of ambiguous non-idempotent writes;
- Functions remain under `/api/*`;
- heavy filtering/aggregation belongs in Postgres rather than Worker loops.

## Build 274 current queue

### Engineering / product work

1. Finish feature source-gate execution, fix any failures, then run the cumulative source chain.
2. Complete detailed external I.T. help coverage and authenticated browser acceptance.
3. Continue Quick Book refinement toward true “next three useful appointments,” returning-customer rebook and funnel instrumentation while preserving backend authority.
4. Continue condition-dependent add-on/service-page convergence after the now-guarded Headlight Restoration and Carpet/Spill Extraction pages.
5. Complete real proof/review plumbing and service-specific proof placement; sample homepage testimonials are removed.
6. Complete maintenance-plan product/booking/account path.
7. Build seasonal, pre-sale/lease-return and fleet/workplace service paths where existing capability supports them.
8. Complete distinct Oxford/Norfolk local pages and Search Console-driven SEO work queues.
9. Continue Finance, payments, module, reliability and security work without waking dormant modules unnecessarily.
10. Keep Development coherent and exact-SHA accepted before any deliberate Production promotion.

### Manual / external evidence queue

Do not fabricate these; complete when credentials, devices, facts or human review are available:

- Google Business Profile ownership/review connection and real review evidence;
- Search Console ownership/property/sitemap/canonical/schema evidence;
- headlight warranty, maintenance-plan and fleet business decisions where not yet approved;
- authenticated role/action/direct-URL/API matrix;
- customer ↔ Detailer real-session messaging/deep links and closed-job UX;
- real provider email/SMS/Web Push delivery/retry/failure evidence;
- Stripe deposit/final-balance/refund/webhook settlement acceptance;
- PayPal sandbox decision/acceptance if retained;
- live inventory posting/reversal/idempotency/shortage evidence;
- representative Cloudflare CPU/script/memory evidence;
- Supabase restore rehearsal;
- Cloudflare deployment rollback rehearsal;
- DAIP private-media processing/retry/cancel/dead-letter/usage evidence;
- real-device phone/tablet/PWA/accessibility/weak-network evidence;
- accountant/tax facts and review still outstanding from Build 273.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no duplicate/thin doorway-location pages;
- no public R2 enumeration on normal requests;
- no subsystem polling merely because a module is installed/authorized;
- server authorization is authoritative;
- customer/private DAIP media never becomes public without consent/review;
- secrets never belong in browser code or Git;
- accounting workpapers automate preparation but do not fabricate tax facts or professional judgment;
- customer booking simplicity must not bypass availability, pricing, quote, payment, consent or audit authority;
- public pages must not present fabricated/sample testimonials as customer reviews;
- the resolved standard mobile setup is Rosie-supplied water/power plus a safe/private customer work area;
- `main` is promoted only deliberately from an accepted Development release.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are historical/current-release checkpoints. Git history is the archive.
