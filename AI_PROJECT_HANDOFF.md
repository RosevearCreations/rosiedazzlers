# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 304
**Updated:** 2026-09-02  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 304 is the current **Accountant export integrity** Development release. It builds on accepted Build 303 Production source `09442c53d385aca7995150ace4bde55abd51d7df` and hardens only the accountant-package/export boundary.

The accepted pre-documentation Build 304 Development implementation/evidence baseline is `6351321a2d33ed8489295a60d8de72adea81a859`. On that exact SHA, Build 304 runtime acceptance, the canonical Development source gate, retained Build 290/291/292 runtime checks and Cloudflare Development acceptance were green; Cloudflare deployment `be586bf6-fc84-4030-a1c7-d534913bab0f` reached `success`, reported `uses_functions=true`, passed immutable static smoke, and the Development alias passed full runtime/API smoke on the first convergence attempt. Documentation synchronization is allowed to advance `dev`; final Build 304 closure is based on the exact documentation-synchronized `dev` SHA and its full acceptance.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Build 304 has no Production promotion authorization. Do not move `main`.**

Build 304 introduces no schema/database migration, accounting/tax-policy change, tax judgment, payment-provider mutation or Production data mutation. Build 305 remains untouched until Build 304 final Development acceptance is clean.

## Build 304 authority

- `functions/api/_lib/accounting-accountant-export.js` is the dedicated accountant-export shaping/privacy authority.
- Accountant JSON uses `schema_version: 2`, export contract `rosie_accountant_workpaper_json`, predictable JSON/UTF-8 metadata and deterministic `rosie-accountant-package-YYYY.json` filenames.
- Evidence references are classified as `general`, `verified`, `unverified`, `unresolved`, `missing_related_id` or `unsupported_type`, with an `evidence_integrity` review summary.
- Exported evidence keeps stable document/reference IDs while omitting raw storage paths/URLs, upload/signed URLs, internal document notes, staff identity metadata and raw mileage rows/booking IDs.
- Evidence filenames are sanitized basenames; dynamic CSV payables-status filename tokens are sanitized before `Content-Disposition`.
- `functions/api/admin/accounting_accountant_package.js` remains GET-only, `finance.view` protected and review-first.
- `assets/admin-tax-support-v303.js`, `admin-tax-support.html`, the retained T2125/tax-support calculations and Build 303 backend tax-support authority remain unchanged.
- `scripts/build304_export_contract_test.mjs`, `scripts/build304_release_check.py`, `scripts/build304_http_smoke.sh` and the Build 304 Development source/runtime workflows protect the boundary.

## Historical CI convergence completed during Build 304

Build 304 acceptance exposed historical guards that were valid in intent but were evaluating later source/history with obsolete assumptions. They were repaired without relaxing their protected authority:

- Build 273 follows accountant-export shaping into the Build 304 helper only when the endpoint imports/calls that helper; retained Finance/action/accountant-readiness checks remain mandatory.
- Build 290 rollback readiness obtains complete history before proving the unchanged accepted Build 289 SHA/tree ancestry and fails closed if the proof cannot be obtained.
- Build 291 and Build 292 release guards likewise obtain complete history before asserting their unchanged exact accepted ancestry anchors.
- Build 299 and Build 300 source-hygiene checks inspect their frozen accepted release deltas instead of unrelated later byte-for-byte extracted assets.

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

The accepted Builds 272–303 authority remains intact, including:

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
- Build 303 is the byte-for-byte Tax Support controller extraction retained by Build 304.

## Build 304 validation authority

- `scripts/build304_release_check.py` — exact export contract/privacy boundary, retained Build 303 authority and migration rejection;
- `scripts/build304_export_contract_test.mjs` — hostile/private fixture export-leakage regression protection;
- `scripts/build304_http_smoke.sh` — read-only deployed accountant-package fail-closed smoke;
- `.github/workflows/build304-source-gate.yml` — feature/PR source gate;
- `.github/workflows/build304-development-source-gate.yml` — Development cumulative source gate;
- `.github/workflows/build304-development-acceptance.yml` — Development read-only runtime acceptance;
- retained `scripts/release_check.py`, `scripts/seo_h1_check.py`, route-copy checks and historical focused guards remain cumulative authorities.

Do not call Build 304 Development-green until the exact documentation-synchronized `dev` SHA, Build 304 Development source/runtime gates and Cloudflare Development deployment evidence agree with zero remaining failed/queued/in-progress acceptance runs relevant to that SHA.

## Next autonomous build

**Build 305 — Finance authorization sweep:** test every Finance endpoint against role/module/action permissions, direct API access, anonymous access and cross-module privilege escalation without changing Finance business rules.

After that, continue the recorded Builds 306–319 sequence. Do not invent business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

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
