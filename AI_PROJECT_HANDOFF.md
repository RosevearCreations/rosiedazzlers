# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 284  
**Updated:** 2026-08-31  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 281 is the accepted Development reliability baseline at `6e0b6015066d2056ee023c35f939da4f5ad23384`. Build 282 is the accepted high-intent customer/business baseline at `841d90561a98089835018c008ec144667782f37d`. Build 283 is the accepted proof/media publication baseline at `a3bcb16c6af94fddd561aba795fd488c94a588f5`. Build 284 is the active **contextual proof placement** slice and is summarized in `BUILD284_SUMMARY.md`.

**Build 273 is the retained Finance/tax-support baseline.** Later builds extend the platform without replacing that Finance authority.

Acceptance is evidence-based, not document-based: Build 284 is accepted only when its exact feature SHA passes the feature source gate and Cloudflare preview, `dev` points to that same SHA, Cloudflare reports the exact Development deployment successful with Functions attached, exact static smoke passes, the mutable `dev` alias passes full runtime smoke, and the Production boundary remains non-mutating.

Production remains deliberately separate. `main` is still the Build 274 Production line and must not be force-moved to `dev`; future promotion must reconcile the known divergent histories deliberately.

## Application boundary

Rosie Dazzlers is one secured, mobile-first platform with a static-first public acquisition website and eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent runtime rule:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; workflow state decides whether an authorized module actually wakes.**

Server authorization remains authoritative. Dormant modules do not wake merely because they exist.

## Retained Build 272/273 authority

These exact retained authorities remain live and must not be weakened by later customer/business work:

- narrow Operations/Finance action permissions;
- Complete = **Best value** and the current Small/Mid/Oversized pricing authority;
- Exterior Detail remains differentiated from Premium Wash;
- condition/quote rules apply before final price where work can vary materially;
- booking/deposit/conflict mechanics remain authoritative;
- one meaningful H1 per indexable public page;
- persistent Finance tax-support records, evidence links, T2125 workpaper and accountant-package workflow remain retained;
- Finance authority includes `finance.view` and `finance.tax.manage`; Operations/Detailer roles do not inherit Finance actions;
- accounting automation must not fabricate tax facts or professional judgment.

## Retained business/public authority

Do not regress these rules:

- public positioning: **Mobile Auto Detailing & Interior/Exterior Restoration** while retaining “mobile auto detailing” as the primary high-intent category;
- vehicle-size/package/add-on pricing comes from the canonical catalogue, not page-specific duplicate prices;
- material condition variability uses photo/inspection review and an explicit expanded-scope confirmation boundary;
- booking keeps service-area, availability, capacity/conflict, quote, deposit and payment authority;
- production canonicals, crawlable static-first content and useful sitemap/internal links;
- no fabricated/sample customer reviews or invented provider evidence;
- private/customer media never becomes public without consent/review **and an explicit publication action**;
- public-use consent/privacy approval and actual publication are separate authorities;
- sample Gallery fallback never counts as real Rosie proof;
- no public R2 enumeration on normal requests;
- **Rosie brings standard detailing water and power. The customer provides a safe, private and permitted work area.** Unusual parking, building access, site rules, weather or local runoff restrictions are reviewed before dispatch.

## Completed forward work through Build 283

- Build 274 established Mobile Quick Book, I.T. Connections/help and the retained public/business foundation.
- Build 275 added booking/retention convergence, including true next useful AM/PM appointment shortcuts, returning-customer rebook acceleration and funnel-exit evidence.
- Build 276 hardened Development source/release mechanics.
- Builds 277–280 deepened all indexed add-on destinations, normalized the self-contained mobile operating model, deepened eight distinct Oxford/Norfolk local pages and closed sitemap/canonical/H1 coverage.
- Build 281 hardened exact Cloudflare deployment versus mutable `dev` alias acceptance, including `uses_functions=true`, immutable static identity and bounded full-runtime alias convergence.
- Build 282 added three high-intent acquisition → existing-booking paths: Pre-Sale / Lease-Return, Spring Salt Recovery, and Fall / Winter Protection Prep.
- Build 283 separated media pairing, public-use consent/privacy review and explicit publication, while defining fail-closed real-proof readiness.

Do not re-open these items because an older roadmap mentions them.

## Build 283 — retained proof/media publication authority

Build 283 strengthens the existing Gallery/App Management path without adding another media system or database migration.

### Final-media eligibility

`functions/api/admin/gallery_media_candidates_list.js` filters the internal Gallery picker so rejected/private/hidden/deleted/withdrawn or unusable candidates are withheld before staff pairing. The existing final-stage/customer-visible/approved job-media source boundary remains authoritative.

A candidate being eligible for pairing is **not** public-use consent and is **not** publication.

### Separate review and publication

Gallery rows carry an explicit `publication_status`.

- new rows start `draft`;
- public-use consent/privacy confirmation remains an explicit staff assertion based on real evidence;
- that approval does **not** publish;
- **Publish** is a separate action and fails closed unless both public-use consent and media-privacy approval pass;
- **Unpublish**, private/hide, rejection, and sensitive edits remove or return publication to review;
- legacy saved rows with no explicit publication state are not inferred public.

The public Gallery reuses the existing `before_after_gallery` setting. If saved rows exist but none pass the Build 283 explicit publication gate, bundled sample fallback remains visible instead of leaking legacy rows or breaking the Gallery.

### Real-proof eligibility

A real proof row must be non-sample, explicitly published, public-use consent approved, media-privacy approved, paired before/after media, tied to service and town/location, supplied with vehicle/condition context, and documented as **problem → process → result**. Sample fallback never counts as real Rosie proof.

Build 283 adds **no database migration** and no parallel Gallery authority.

## Build 284 — active contextual proof placement

Build 284 consumes only the Build 283 public Gallery authority and places real proof at customer decision points.

### Shared presentation layer

`assets/contextual-proof-v284.js` is a presentation-only renderer. The existing first-party visual bootstrap loads it only when a service/add-on, location, or Build 282 high-intent use-case marker is present.

The client intentionally rechecks the real-proof boundary even though the public API already fails closed:

- explicit `published` state;
- approved public-use consent;
- approved media privacy;
- non-sample proof;
- paired before/after media;
- service and town/location;
- vehicle and condition;
- problem, process and result.

At most three records are shown. No customer name or testimonial is synthesized or exposed by this layer.

### Context matching

- service/add-on pages require the Gallery service slug to match the page;
- location pages require a town represented by that location page;
- Build 282 use-case pages require a relevant starting-service match and explicitly describe the evidence as relevant work rather than proof that every vehicle has the same condition/result.

If no real matching row exists, the section remains hidden. Existing public proof-placeholder plans are hidden instead of masquerading as customer evidence.

### Authority/storage boundary

Build 284 adds **no database migration**, direct R2 enumeration, private/admin API dependency, review authority, pricing authority, or booking authority. Publishing/consent/privacy remains Build 283-owned.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- public H1/current conversion+proof hook: `scripts/seo_h1_check.py`;
- retained Build 282 guard: `scripts/build282_release_check.py`;
- retained Build 283 guard: `scripts/build283_release_check.py`;
- focused Build 284 guard: `scripts/build284_release_check.py`;
- feature source workflow: `.github/workflows/build284-source-gate.yml`;
- Build 284 HTTP smoke: `scripts/build284_http_smoke.sh`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Build 284 is not Development-green merely because source exists. The exact accepted feature SHA, feature preview, `dev`, Cloudflare Development artifact, Build 284 smoke, and runtime smoke must agree.

## Next business/product work after Build 284

Proceed in this order where work is not blocked by real business/provider evidence:

1. publish **real, consented Rosie proof** through the Build 283 controls; Build 284 will surface only proof-ready rows where their service/town/use-case context genuinely matches;
2. Search Console/Google Business Profile measurement and genuine review authority when account access is available;
3. maintenance-plan product/account/booking path **after** cadence, price/perks and pause/cancel rules are approved;
4. fleet/workplace acquisition path **after** minimum-vehicle, discount/travel and recurring-service rules are approved;
5. customer retention/account improvements around recommended next service and low-friction rebook;
6. authenticated/mobile/accessibility/weak-network acceptance for customer flows;
7. Stripe/PayPal provider acceptance and Finance settlement/reconciliation closure;
8. continued module/security/reliability work without waking dormant subsystems.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent for any actual before/after proof;
- real Gallery rows with accurate service/town/vehicle/condition/problem/process/result context;
- Google Business Profile ownership/review connection;
- Search Console ownership/property/sitemap/indexing evidence;
- genuine customer review/proof publication consent;
- maintenance-plan and fleet commercial rules not yet approved;
- authenticated role/action/direct-URL/API matrix;
- real email/SMS/Web Push delivery evidence;
- Stripe deposit/final-balance/refund/webhook acceptance;
- PayPal sandbox acceptance if retained;
- Supabase restore and Cloudflare rollback rehearsals;
- representative real-device/PWA/accessibility/weak-network evidence;
- accountant/tax facts and judgment-heavy review.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy filtering/aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; Git history is the archive. Old build-numbered documents must not override these two current authorities.

<!-- Historical Build 283 retained-guard compatibility only; this is not the living build number.
**Build:** 283
Build 283 proof/media publication authority remains retained.
-->

<!-- Historical Build 274 retained-guard compatibility only; this is not the living build number.
**Build:** 274
Build 274 active implementation
-->
