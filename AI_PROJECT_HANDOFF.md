# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 305
**Updated:** 2026-09-02  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 305 is the current **Finance authorization sweep** Development release. It builds on the accepted Build 304 accountant-export integrity boundary and closes Finance route/action coverage without changing Finance business rules, schema, provider behavior, or the established seven-action Finance permission vocabulary.

The accepted pre-documentation Build 305 Development implementation/evidence baseline is `00571a39172052cbf42b2bec41ec25633803891b`. On that exact SHA, the full workflow fan-out finished with zero failed, queued, or in-progress runs. Build 305 source/runtime acceptance and the canonical cumulative Development source authority were green. Cloudflare Development Acceptance run `33697631645` passed on exact deployment `467003c1-6d58-48f3-8d9b-1aea116bb107`, which reached `success`, reported `uses_functions=true`, passed immutable static smoke at `https://467003c1.rosiedazzlers.pages.dev`, and passed full static + dynamic/API smoke on `https://dev.rosiedazzlers.pages.dev` with alias convergence on attempt 1/12.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Build 305 has no Production promotion authorization. Do not move `main`.**

Build 305 introduces no schema/database migration, accounting/tax-policy change, tax judgment, payment-provider mutation, pricing/booking business-rule change, or Production data mutation. Final Build 305 closure is based on the exact documentation-synchronized `dev` SHA and its complete source/runtime/Cloudflare acceptance. Build 306 remains untouched until that evidence is clean.

## Build 305 authority

- `functions/api/_lib/admin-finance-actions.js` is the centralized method-aware Finance admin route/action resolver.
- Every current `accounting_*`, `payment_*`, and `payroll_*` admin route/method is covered by the Build 305 exhaustive scan.
- Finance GET/HEAD reads resolve to `finance.view`.
- Finance mutations resolve to the narrow existing authority: `finance.post`, `finance.reconcile`, `finance.period.close`, `finance.refund.manage`, `finance.settlement.manage`, or `finance.tax.manage`.
- The established seven-action Finance vocabulary and Accountant defaults are unchanged.
- Role ceilings, Finance-module disablement, and explicit per-action denial continue to fail closed.
- Operations-owned quote/final-balance request lifecycle remains Operations authority; hosted final-balance checkout creation is Finance settlement authority; booking-scoped operational Finance notes retain their existing booking-work authority.
- `scripts/build305_finance_action_test.mjs` verifies representative mappings, role/module/action boundaries and exhaustively scans the accepted Finance API surface. The accepted Build 305 tree covered 40 Finance files / 80 exported HTTP methods.
- `scripts/build305_release_check.py`, `scripts/build305_http_smoke.sh`, and the Build 305 source/Development source/runtime workflows protect the boundary.

## Historical CI convergence completed during Build 305

Build 305 centralized Finance route resolution and exposed two historical guards whose protected intent remained correct but whose inline-location assumption had become stale. Both were repaired without weakening authority:

- Build 272 still requires its exact customer/quote Operations mappings and exact four historical refund/settlement Finance leaves/actions. When Build 305 delegation is present, the guard follows those Finance leaves into `admin-finance-actions.js` and syntax-checks the helper.
- Build 290 still requires its exact `quote_deposit_refund_save -> finance.refund.manage` protection plus all staff-auth, authorization-matrix, forward-restore, documentation and Production-closed authority. When delegation is present, it follows that exact action into the helper.

These repairs do not create new permissions or broaden any role.

## Retained Build 304 authority

Build 304 remains the accepted accountant-export integrity boundary beneath Build 305:

- `functions/api/_lib/accounting-accountant-export.js` owns accountant-export shaping/privacy.
- Accountant JSON uses `schema_version: 2`, export contract `rosie_accountant_workpaper_json`, predictable JSON/UTF-8 metadata and deterministic `rosie-accountant-package-YYYY.json` filenames.
- Evidence references remain integrity-classified and storage locators, internal document notes, staff identity metadata and raw mileage/booking rows remain excluded from exports.
- `functions/api/admin/accounting_accountant_package.js` remains GET-only, `finance.view` protected and review-first.
- Build 304 changed no tax/accounting judgment, provider behavior or schema.

Historical CI convergence completed during Build 304 also remains retained: Build 273 follows delegated accountant-export shaping; Build 290/291/292 obtain sufficient history before strict ancestry checks; Build 299/300 source-hygiene checks inspect their frozen accepted release deltas.

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

The accepted Builds 272–305 authority remains intact, including:

- Build 273 Finance/tax-support and accountant-workpaper authority;
- Complete = **Best value** and the current Small/Mid/Oversized + condition/quote pricing authority;
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
- Build 305 makes the existing Finance action model exhaustive across Finance-prefixed admin routes without broadening roles or business authority.

## Build 305 validation authority

- `scripts/build305_finance_action_test.mjs` — route/action matrix plus exhaustive Finance file/method coverage and cross-module escalation checks;
- `scripts/build305_release_check.py` — seven-action vocabulary, centralized resolver, no-schema boundary and retained Build 304 authority;
- `scripts/build305_http_smoke.sh` — anonymous read/write fail-closed checks across representative Finance action classes;
- `.github/workflows/build305-source-gate.yml` — feature source gate;
- `.github/workflows/build305-development-source-gate.yml` — Development cumulative Finance source gate;
- `.github/workflows/build305-development-acceptance.yml` — Development runtime authorization acceptance;
- retained `scripts/release_check.py`, historical focused guards, route-copy checks, SEO guards and Cloudflare exact-SHA acceptance remain cumulative authorities.

Do not call Build 305 fully closed until the exact documentation-synchronized `dev` SHA, Build 305 Development source/runtime gates, canonical Development source gate and Cloudflare Development deployment evidence agree with zero remaining failed/queued/in-progress acceptance runs relevant to that SHA.

## Next autonomous build

**Build 306 — I.T. Health dashboard extraction:** cleanly modularize the I.T./System Health runtime so deployment, API, D1, storage, authentication and provider readiness can be tested independently while preserving existing readiness semantics and provider authority exactly.

Build 307—not Build 306—owns the later GREEN/AMBER/RED readiness normalization, configuration-vs-transaction distinction, clearer failure messages and corrective mechanics. Continue the recorded Builds 306–319 sequence without inventing business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

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
