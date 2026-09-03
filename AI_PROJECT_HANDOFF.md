# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 307
**Updated:** 2026-09-03  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 307 is the current **I.T. readiness diagnostics upgrade** Development release. It builds directly on the accepted Build 306 isolated System Health observations and adds evidence-scoped GREEN/AMBER/RED interpretation, explicit configuration-vs-transaction evidence, specific diagnostic codes, and read-only corrective guidance without changing schema, provider authority, business rules, or Production.

The accepted pre-documentation Build 307 Development implementation/evidence baseline is `069bb7d7bff9c1f50974b7018634e16594907c61`. On that exact SHA, Build 307 Development Source Gate run `33701368432` passed. Cloudflare Development Acceptance run `33701368256` passed on exact deployment `c6696a18-964d-4f3b-a540-335ff1665b9e`, which reached `success`, reported Functions attached, passed immutable deployment smoke at `https://c6696a18.rosiedazzlers.pages.dev`, and passed full Development alias runtime/API smoke with convergence on attempt 1/12.

The first Build 307 runtime attempt executed before Cloudflare alias convergence. Exact source validation passed, while the deployed v307 identity check hit the previous Development surface. After Cloudflare acceptance completed, the same Build 307 runtime job was rerun without a source change and both exact source validation and the deployed read-only readiness smoke passed. Final exact-SHA queries returned zero failed, queued, and in-progress runs.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Build 307 has no Production promotion authorization. Do not move `main`.**

Build 307 introduces no schema/database migration, payment-provider transaction, provider API acceptance, pricing/booking business-rule change, accounting/tax judgment, external delivery/publishing proof, or Production data mutation. Final Build 307 closure is based on the exact documentation-synchronized `dev` SHA and its complete source/runtime/Cloudflare acceptance. Build 308 remains untouched until that evidence is clean.

## Build 307 authority

- `functions/api/_lib/system-health-readiness.js` owns the Build 307 readiness interpretation layered over Build 306 raw observations.
- Readiness contract: `rosie_it_readiness_diagnostics_v1`.
- Visible states are **GREEN**, **AMBER**, and **RED**.
- GREEN is reserved for a condition the diagnostic itself directly proves.
- AMBER represents configuration-only/partial evidence or an optional provider boundary where transaction acceptance has not been tested.
- RED represents a missing required local authority or an independently failed family observation.
- Every diagnostic includes an `evidence_class`, `transaction_acceptance`, stable diagnostic code, plain-language summary, and `corrective_action`.
- Corrective mechanics are deliberately read-only/manual: `automatic: false`; the dashboard does not silently edit Cloudflare, Supabase, D1, R2, Stripe, PayPal, auth, notification, or social/provider configuration.
- Database/data-plane configuration is AMBER until separate database acceptance proves connectivity; missing supported database authority is RED.
- R2 binding presence is AMBER until separate object-level acceptance exists; missing required Rosie R2 binding is RED.
- Provider configuration remains AMBER and can never be called payment, webhook, message, delivery, publishing, or external API transaction acceptance by this dashboard.
- Optional provider absence does not falsely make the core app RED.
- Authentication is GREEN only when the protected request resolves authenticated staff and passes `it.runtime.view`.
- `functions/api/admin/system_health_families.js` remains GET-only, `allowLegacyAdminFallback:false`, and `it.runtime.view` protected. It returns the raw Build 306 observations plus Build 307 diagnostics.
- `admin-system-health.html` and `assets/admin-system-health-v307.js` present state, evidence class, transaction status, diagnostic code, and read-only corrective guidance while preserving raw observations for troubleshooting.

## Build 307 validation authority

- `scripts/build307_readiness_diagnostics_test.mjs` — deterministic GREEN/AMBER/RED semantics, configuration-vs-transaction separation, optional-provider behavior, observation failure behavior, corrective-action non-automation, and secret/staff-identity non-disclosure.
- `scripts/build307_release_check.py` — no-schema/no-provider-call boundary, contract checks, v307 dashboard checks, and retained Build 306 observation authority.
- `scripts/build307_http_smoke.sh` — deployed page identity, anonymous API fail-closed behavior, mutation rejection, and read-only-only runtime boundary.
- `.github/workflows/build307-source-gate.yml` — feature source gate retaining Build 306 first.
- `.github/workflows/build307-development-source-gate.yml` — Development cumulative Build 307 source gate.
- `.github/workflows/build307-development-acceptance.yml` — Development read-only readiness runtime acceptance.
- retained `scripts/release_check.py`, historical focused guards, route-copy checks, SEO guards, canonical Development Source Gate and Cloudflare exact-SHA acceptance remain cumulative authorities.

Do not call Build 307 fully closed until the exact documentation-synchronized `dev` SHA, Build 307 Development source/runtime gates, canonical Development source gate and Cloudflare Development deployment evidence agree with zero remaining failed/queued/in-progress acceptance runs relevant to that SHA.

## Retained Build 306 authority

- `functions/api/_lib/system-health-families.js` remains the semantics-free six-family System Health observation authority: `deployment`, `api`, `d1`, `storage`, `authentication`, and `providers`.
- The collector uses `Promise.allSettled`, so one failed observation cannot suppress unrelated families and every family can be requested independently.
- Historical family key `d1` reports Rosie's actual configured database mode accurately: `supabase` when Supabase service authority is present, `d1` only for a real `DB` binding, otherwise `unconfigured`.
- Raw provider observations expose configuration-presence metadata only and perform no provider API/transaction.
- Raw storage observations expose binding presence only and perform no R2 object operation.
- Raw authentication observations exclude staff email/IDs, tokens and session secrets.
- `scripts/build306_release_check.py` remains successor-aware but still forbids GREEN/AMBER/RED/corrective semantics from entering the raw Build 306 observation helper.
- Final documentation-synchronized Build 306 Development SHA: `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.

## Retained Build 305 authority

- `functions/api/_lib/admin-finance-actions.js` is the centralized method-aware Finance admin route/action resolver.
- Every current `accounting_*`, `payment_*`, and `payroll_*` admin route/method is covered by the Build 305 exhaustive scan.
- Finance GET/HEAD reads resolve to `finance.view`.
- Finance mutations resolve to the narrow existing authority: `finance.post`, `finance.reconcile`, `finance.period.close`, `finance.refund.manage`, `finance.settlement.manage`, or `finance.tax.manage`.
- The established seven-action Finance vocabulary and Accountant defaults are unchanged.
- Role ceilings, Finance-module disablement, and explicit per-action denial continue to fail closed.
- Operations-owned quote/final-balance request lifecycle remains Operations authority; hosted final-balance checkout creation is Finance settlement authority; booking-scoped operational Finance notes retain their existing booking-work authority.
- The accepted Build 305 tree covered 40 Finance files / 80 exported HTTP methods.
- Final documentation-synchronized Build 305 Development SHA: `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

## Historical CI convergence completed during Build 305

Build 305 centralized Finance route resolution and exposed two historical guards whose protected intent remained correct but whose inline-location assumption had become stale. Both were repaired without weakening authority:

- Build 272 still requires its exact customer/quote Operations mappings and exact four historical refund/settlement Finance leaves/actions. When Build 305 delegation is present, the guard follows those Finance leaves into `admin-finance-actions.js` and syntax-checks the helper.
- Build 290 still requires its exact `quote_deposit_refund_save -> finance.refund.manage` protection plus all staff-auth, authorization-matrix, forward-restore, documentation and Production-closed authority. When delegation is present, it follows that exact action into the helper.

These repairs do not create new permissions or broaden any role.

## Retained Build 304 authority

- `functions/api/_lib/accounting-accountant-export.js` owns accountant-export shaping/privacy.
- Accountant JSON uses `schema_version: 2`, export contract `rosie_accountant_workpaper_json`, predictable JSON/UTF-8 metadata and deterministic `rosie-accountant-package-YYYY.json` filenames.
- Evidence references remain integrity-classified and storage locators, internal document notes, staff identity metadata and raw mileage/booking rows remain excluded from exports.
- `functions/api/admin/accounting_accountant_package.js` remains GET-only, `finance.view` protected and review-first.
- Build 304 changed no tax/accounting judgment, provider behavior or schema.

Historical CI convergence completed during Build 304 remains retained: Build 273 follows delegated accountant-export shaping; Build 290/291/292 obtain sufficient history before strict ancestry checks; Build 299/300 source-hygiene checks inspect their frozen accepted historical release deltas.

## Retained Build 303 authority

Build 303 externalizes the retained Build 273 Tax Support & Accountant Readiness browser controller into `assets/admin-tax-support-v303.js` byte-for-byte. Backend authorities `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` remain unchanged. T2125 support, factual mileage/home-office/capital-asset/year-end records and accountant-package behavior remain review-first without new tax judgment.

Build 302 remains closed as a fail-closed Statement Import convergence guard: the accepted application has no active statement-import parser/API, statement reporting remains read-only/fail-closed on POST, and bank reconciliation remains separate.

Retained historical compatibility marker: **Build:** 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7` and next historical queue marker **Build 302 — Statement Import reliability**.

## Build 301 authority

Build 301 externalizes the accepted `admin-accounting.html` classic-script runtime into `assets/admin-accounting-v301.js` without refactoring its executable behavior. The accepted Build 300 `admin-accounting.html` and `admin-accounting/index.html` sources were identical; Build 301 keeps those route copies aligned and makes both load the same versioned runtime asset.

This remains a structural extraction rather than a Finance redesign. Bank reconciliation reads/rendering, payroll payout reconciliation, payable settlement, recurring expenses, journal/remittance behavior, documents, period-close workflow, statement/tax reports and exports retain their accepted Build 300 behavior exactly. Build 301 does not invent a reconciliation write path where the accepted runtime did not already provide one.

Build 301 changes no matching/posting/approval rule, payment/provider rule, tax/accounting judgment, API contract, schema or migration. Real provider transaction, settlement, approval or reconciliation evidence is not fabricated. Runtime acceptance is read-only.

## Application boundary

Rosie Dazzlers remains one secured, mobile-first platform with eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent rule: **role defines the maximum module set; a staff profile may narrow non-admin access; a global module switch may make a module unavailable; workflow state decides whether an authorized module wakes.** Server authorization remains authoritative and dormant modules stay asleep.

## Retained Build 272/273 authority

Build 273 is the retained Finance/tax-support baseline. The accepted Build 272/273 boundaries remain live while later releases advance:

- narrow Operations/Finance action permissions;
- server-authoritative role/module/action permissions;
- Finance tax-support writes retain `finance.tax.manage` while reads remain narrowly scoped;
- persistent Finance tax-support records, evidence links, T2125 workpaper and accountant-package workflow remain retained;
- Complete = **Best value**;
- Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Retained business/runtime authority

The accepted Builds 272–307 authority remains intact, including:

- Build 273 Finance/tax-support and accountant-workpaper authority;
- Complete = **Best value** and current Small/Mid/Oversized + condition/quote pricing authority;
- Rosie supplies normal detailing water/power while the customer supplies a safe/private/permitted work area;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, customer proof, consent, reviews, provider evidence or Google verification;
- Build 283/284 consented proof/publication and contextual-proof fail-closed rules;
- Build 285 current-rule rebook handoff;
- Build 286 completed-booking customer review authority;
- Build 287 neutral review/share attribution without referral economics;
- Build 288 customer/staff privacy-safe projections;
- Build 289 manual weak-network/auth recovery without polling/write replay;
- Build 290 server-authoritative role/module/action authorization and forward-restore readiness;
- Build 291 maintenance interest remains preference-only with no approved cadence/economics/recurring billing;
- Build 292 fleet/workplace intake remains quote-first with no approved thresholds/rates/discounts/contracts;
- Build 293 customer next-action orchestration retains current booking/payment authority;
- Build 294/295 remove customer authority over staff maintenance scheduling fields and stale private controls;
- Builds 296–299 are behavior-preserving maintainability extractions for My Account, Operations Customers, Quote Pipeline and Booking Dashboard;
- Build 300 is the behavior-preserving Finance Payments extraction in `assets/admin-payments-v300.js`, including its recorded pre-existing Payments duplicate-route boundary for Build 318;
- Build 301 is the behavior-preserving Finance Reconciliation extraction;
- Build 302 preserves the retired statement-import boundary;
- Build 303 is the byte-for-byte Tax Support controller extraction;
- Build 304 hardens accountant export integrity without changing accounting/tax authority;
- Build 305 makes the existing Finance action model exhaustive without broadening roles/business authority;
- Build 306 extracts I.T. System Health into isolated semantics-free read-only observations;
- Build 307 adds evidence-scoped readiness interpretation and read-only corrective guidance without fabricating transaction acceptance.

## Next autonomous build

**Build 308 — Cloudflare deployment/recovery consolidation:** integrate the proven exact-SHA Development deployment/recovery path into normal release tooling and remove redundant recovery mechanics while preserving immutable deployment evidence, bounded Development-alias convergence, rollback/promote boundaries, and non-mutating Production safety.

Build 308 must not weaken the exact-SHA gate, silently deploy to Production, force-move `main`, or convert recovery tooling into an automatic destructive action. Continue the recorded Builds 308–319 sequence without inventing business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

## Manual/external evidence that must not be fabricated

- genuine customer/public-use consent and proof context;
- Google Business Profile/Search Console ownership or verification;
- maintenance, fleet or referral economics not explicitly approved;
- real email/SMS/Web Push delivery;
- real payment-provider transaction, settlement, refund or webhook acceptance beyond configuration-present evidence;
- accountant/tax judgment;
- physical-device evidence not established by automated acceptance.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Retained guard compatibility markers

These lines preserve historical focused-guard anchors; they are not the living build number.

- **Build:** 274 — Build 274 active implementation; I.T. Connections; Quick Book; Mobile Auto Detailing & Interior/Exterior Restoration.
- **Build:** 283 — Build 283 proof/media publication authority remains retained; explicit publish/unpublish still governs public proof.
- **Build:** 284 — Build 284 contextual proof placement remains retained.
- **Build:** 287 — Build 287 review/share attribution authority remains retained. Production remains closed.
- **Build:** 288 — Build 288 customer/staff privacy boundary remains retained. Production remains closed.
- **Build:** 289 — Build 289 account accessibility and weak-network resilience remains retained. Production remains closed.
- **Build:** 290 — Build 290 forward restore and authorization acceptance remain retained. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 291 — Build 291 maintenance retention intake remains retained. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 292 — Build 292 fleet / workplace acquisition intake remains retained. Production remains closed.
- **Build:** 293 — Build 293 — customer retention next-action hub; customer-safe review projection retaining `booking_id`; Production remains closed.
- **Build:** 294 — Build 294 customer maintenance / auto-schedule authority closure remains retained. Production remains closed.
- **Build:** 295 — customer account static source authority cleanup; My Account maintainability extraction.
- **Build:** 296 — My Account maintainability extraction.
- **Build:** 297 — Operations customer support maintainability extraction; retained accepted Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 298 — Operations booking/quote support maintainability extraction; `assets/admin-quotes-v298.js`; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 299 — Operations booking-dashboard support maintainability extraction; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 300 — Finance Payments maintainability extraction; `assets/admin-payments-v300.js`; accepted Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`; next retained queue marker Build 301 — Finance Reconciliation maintainability extraction; duplicate-route owner Build 318 — Whole-application route/API authority sweep.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; `AUTONOMOUS_RELEASE_QUEUE.md` is the agreed execution sequence; Git history is the archive.
