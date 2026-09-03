# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 309  
**Updated:** 2026-09-03  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 309 is the current **Staff Administration maintainability extraction** Development release. It externalizes the accepted root `admin-staff.html` browser controller into `assets/admin-staff-v309.js` without changing authentication, role/module/action authority, staff-management behavior, schema, payroll/business rules, provider behavior, polling behavior or Production.

The accepted final Build 308 Development SHA is `d14a63c62913edf125a3e2bd8d69f110a6942dad`. The accepted pre-documentation Build 309 Development implementation/evidence baseline is `d579eba52090755cfa5248565e45fdd7358052d3`.

On exact `d579eba52090755cfa5248565e45fdd7358052d3`:

- Build 309 Development Runtime Acceptance run `33708957648`: **SUCCESS**.
- Build 309 Development Source Gate run `33708957679`: **SUCCESS**.
- canonical Development Source Gate run `33708957663`: **SUCCESS**.
- Cloudflare Development Acceptance run `33708957640`: **SUCCESS**.
- exact Cloudflare deployment: `c1473523-7924-4f3c-92e2-da54d8d0e097`.
- exact deployment reached `success`, retained `uses_functions=true`, and passed immutable Development static smoke at `https://c1473523.rosiedazzlers.pages.dev`.
- the mutable `dev` alias passed full static + runtime/API smoke and converged on attempt 1/12.
- retained Build 284 contextual-proof smoke passed on both immutable and mutable Development surfaces.
- the exact 40-workflow pre-documentation fan-out drained with zero failed, queued and in-progress runs.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Build 309 has no Production promotion authorization. Do not move `main`.**

Build 309 introduces no schema/database migration, payment-provider transaction, pricing/booking business-rule change, accounting/tax judgment, external delivery/publishing proof, role/action change, staff permission broadening or Production data mutation. Final Build 309 closure is based on the exact documentation-synchronized `dev` SHA and its complete source/runtime/Cloudflare acceptance.

## Build 309 authority

- `assets/admin-staff-v309.js` owns the accepted root Staff Administration browser controller.
- `admin-staff.html` differs from the accepted Build 308 root source only by replacing the inline module with the versioned module-script tag.
- Existing `MODULE_KEYS` / `ROLE_MODULES` ceilings remain unchanged.
- Per-profile module narrowing remains unchanged.
- Administrator accounts remain forced to every internal module under the existing authority; Build 309 does not broaden or reduce that rule.
- `/api/admin/staff_list` and `/api/admin/staff_save` orchestration, staff/profile/payroll fields and optional legacy password fallback presentation remain behavior-preserving.
- `admin-staff/index.html` remains the pre-existing older route and is byte-for-byte unchanged by Build 309. Build 318 — Whole-application route/API authority sweep owns deliberate route convergence/removal.
- no idle polling was introduced.
- `scripts/build309_http_smoke.sh` is read-only and never saves or mutates a staff record.

## Build 309 historical guard convergence

Build 309 exposed one historical checkout-depth issue rather than a runtime regression:

- PR #52 makes the retained Build 294 exact accepted-Build-293-Production ancestry assertion shallow-history safe by obtaining complete history/exact anchor before evaluating the same `merge-base --is-ancestor` requirement.
- missing history and false ancestry remain fail-closed.
- PR #53 permits only `scripts/build294_release_check.py` as that narrow forward-compatible exception inside the Build 309 scope allowlist.
- no application source, schema, authorization, business rule, Cloudflare mechanic or Production state changed in those repairs.

## Build 309 validation authority

- `scripts/build309_release_check.py` — exact Build 308 root reconstruction, Staff controller authority, unchanged server authorization files, unchanged older folder route, no-schema/no-polling/no-scope-creep checks.
- `scripts/build309_http_smoke.sh` — read-only Development Staff page/asset acceptance.
- `.github/workflows/build309-source-gate.yml` — focused feature source authority.
- `.github/workflows/build309-development-source-gate.yml` — cumulative Development Build 309 source gate.
- `.github/workflows/build309-development-acceptance.yml` — read-only Development runtime acceptance.
- retained `scripts/release_check.py`, historical focused guards, route-copy checks, SEO/H1 checks, Build 308 canonical Cloudflare helper and canonical Development Source Gate remain cumulative authorities.

Do not call Build 309 fully closed until the documentation-synchronized exact `dev` SHA passes Build 309 source/runtime, canonical Development source and Cloudflare exact-SHA acceptance with zero remaining failed/queued/in-progress workflows relevant to that SHA.

## Retained Build 308 authority

- `scripts/cloudflare_pages_development.sh` remains the canonical Cloudflare Pages Development acceptance/recovery helper.
- Normal `.github/workflows/cloudflare-development-acceptance.yml` delegates to the canonical helper in read-only `accept` mode.
- Normal acceptance contains no deployment DELETE or recreate request.
- Exact-SHA success, `uses_functions=true`, immutable deployment smoke and bounded mutable-`dev` alias convergence remain mandatory.
- The helper tolerates only a bounded same-deployment-ID list/detail metadata propagation delay after exact list-side success.
- Wrong SHA/branch, terminal failure/cancel state, missing Functions metadata, immutable smoke failure or alias convergence failure remain fail-closed.
- Cloudflare recovery is manual `workflow_dispatch` only and defaults to `observe`.
- `repair` requires exact current `dev` SHA confirmation before mutation is considered.
- Recovery can target only a non-terminal preview deployment; terminal or Production targets fail closed.
- Recovery DELETE/recreate mechanics exist only in the canonical helper.
- final documentation-synchronized Build 308 Development SHA: `d14a63c62913edf125a3e2bd8d69f110a6942dad`.

## Retained Build 307 authority

Build 307 remains the I.T. readiness interpretation layer over Build 306 raw observations:

- `functions/api/_lib/system-health-readiness.js` owns `rosie_it_readiness_diagnostics_v1`.
- visible states remain **GREEN**, **AMBER**, **RED**.
- GREEN is reserved for a condition the diagnostic directly proves.
- AMBER represents configuration-only/partial evidence or an optional provider boundary without transaction acceptance.
- RED represents missing required local authority or an independently failed observation.
- every diagnostic retains `evidence_class`, `transaction_acceptance`, stable diagnostic code, summary and read-only `corrective_action`.
- corrective mechanics remain manual: `automatic: false`.
- database/data-plane and R2 configuration are not fabricated into transaction/object acceptance.
- provider configuration is never payment, webhook, delivery, publishing or external-provider transaction acceptance.
- authentication is GREEN only when protected staff authority and `it.runtime.view` are actually proven.
- `functions/api/admin/system_health_families.js` remains GET-only, `allowLegacyAdminFallback:false`, and `it.runtime.view` protected.
- `admin-system-health.html` and `assets/admin-system-health-v307.js` remain the protected readiness presentation.

## Retained Build 306 authority

- `functions/api/_lib/system-health-families.js` remains the semantics-free six-family observation authority: `deployment`, `api`, `d1`, `storage`, `authentication`, `providers`.
- the collector uses `Promise.allSettled` so one failed family cannot suppress unrelated observations.
- historical family key `d1` accurately reports `supabase`, `d1`, or `unconfigured`.
- raw provider observations expose configuration presence only and perform no provider API/transaction.
- raw storage observations expose binding presence only and perform no R2 object operation.
- raw authentication observations exclude staff identity, tokens and session secrets.
- final documentation-synchronized Build 306 Development SHA: `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.

## Retained Build 305 authority

- `functions/api/_lib/admin-finance-actions.js` remains the centralized method-aware Finance route/action resolver.
- current `accounting_*`, `payment_*`, and `payroll_*` admin route/method pairs remain under the established seven-action Finance vocabulary.
- Finance reads resolve to `finance.view`.
- mutations remain separated among `finance.post`, `finance.reconcile`, `finance.period.close`, `finance.refund.manage`, `finance.settlement.manage`, and `finance.tax.manage`.
- role ceilings, module disablement and explicit action denial remain fail-closed.
- final documentation-synchronized Build 305 Development SHA: `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

## Retained Build 304 authority

- `functions/api/_lib/accounting-accountant-export.js` owns accountant-export shaping/privacy.
- accountant JSON retains `schema_version: 2`, export contract `rosie_accountant_workpaper_json`, predictable UTF-8/JSON metadata and deterministic `rosie-accountant-package-YYYY.json` filenames.
- storage locators, internal notes, staff identity metadata and raw mileage/booking rows remain excluded from accountant exports.
- `functions/api/admin/accounting_accountant_package.js` remains GET-only, `finance.view` protected and review-first.
- Build 304 changes no accounting/tax judgment, provider behavior or schema.

## Retained Build 303 / Production authority

Build 303 externalizes the retained Tax Support browser controller into `assets/admin-tax-support-v303.js` while preserving backend Finance/tax authorities. It remains the accepted Production boundary at `09442c53d385aca7995150ace4bde55abd51d7df`.

Build 302 remains closed as the fail-closed retired Statement Import boundary. Build 301 remains the behavior-preserving Finance Reconciliation extraction in `assets/admin-accounting-v301.js`.

Retained historical compatibility marker: **Build:** 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7` and next historical queue marker **Build 302 — Statement Import reliability**.

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

Build 273 is the retained Finance/tax-support baseline. Its persistent Finance tax-support records, structured evidence, T2125 workpaper and accountant-package workflow remain review-first.

The retained baseline includes narrow Operations/Finance action permissions and Finance/tax-support authority:

- server-authoritative role/module/action permissions;
- Finance tax-support writes retain `finance.tax.manage` while reads remain narrowly scoped;
- structured Finance evidence, T2125 workpaper and accountant-package workflow remain review-first;
- Complete = **Best value**;
- Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Retained business/runtime authority through Build 309

- Builds 274–280 retain Mobile Quick Book, I.T. help, release mechanics and service/local SEO authority.
- Build 281 retains exact-SHA Cloudflare acceptance and bounded mutable Development alias convergence.
- Build 282 retains high-intent acquisition paths into existing booking authority.
- Builds 283–284 retain explicit proof publication and fail-closed contextual proof placement.
- Builds 285–287 retain current-rule rebook/review/share loops without referral economics.
- Builds 288–290 retain privacy, weak-network recovery, server-authoritative authorization and forward-restore authority.
- Builds 291–293 retain maintenance/fleet interest and next-action coordination without inventing cadence, pricing, contracts or recurring billing.
- Builds 294–295 retain customer/staff maintenance authority separation and stale private-control removal.
- Builds 296–299 are behavior-preserving maintainability extractions for My Account, Operations Customers, Quote Pipeline and Booking Dashboard.
- Build 300 is the behavior-preserving Finance Payments extraction in `assets/admin-payments-v300.js`, including its recorded pre-existing Payments duplicate-route boundary for Build 318.
- Build 301 is the behavior-preserving Finance Reconciliation extraction.
- Build 302 preserves the retired statement-import boundary.
- Build 303 is the Tax Support controller extraction and current Production boundary.
- Build 304 hardens accountant export integrity without changing accounting/tax authority.
- Build 305 makes the existing Finance action model exhaustive without broadening roles/business authority.
- Build 306 extracts I.T. System Health into isolated semantics-free read-only observations.
- Build 307 adds evidence-scoped readiness interpretation and read-only corrective guidance without fabricating transaction acceptance.
- Build 308 centralizes exact-SHA Cloudflare Development acceptance/recovery without weakening release evidence or Production isolation.
- Build 309 externalizes the accepted root Staff Administration runtime while preserving authentication, role/module ceilings, profile narrowing and staff-management behavior; the older folder route remains deferred to Build 318.

## Next autonomous build

**Build 310 — Admin full-access acceptance matrix:** automatically prove that the Admin role can access every enabled module/action while narrower staff profiles remain correctly restricted.

Build 310 must test the existing server-authoritative role/module/action model. It must not broaden Admin or staff permissions, redesign authentication, create a schema migration, or invent access solely to make the matrix pass. Continue the recorded Builds 310–319 sequence without inventing business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

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
- **Build:** 299 — Operations booking-dashboard support maintainability extraction; `assets/admin-booking-v299.js`; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 300 — Finance Payments maintainability extraction; `assets/admin-payments-v300.js`; accepted Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`; next retained queue marker Build 301 — Finance Reconciliation maintainability extraction; duplicate-route owner Build 318 — Whole-application route/API authority sweep.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; `AUTONOMOUS_RELEASE_QUEUE.md` is the agreed execution sequence; Git history is the archive.