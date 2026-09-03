# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 308  
**Updated:** 2026-09-03  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 308 is the current **Cloudflare deployment/recovery consolidation** Development release. It centralizes exact-SHA Development acceptance and manual recovery around `scripts/cloudflare_pages_development.sh` without changing application business logic, schema, pricing, booking, Finance/tax policy, staff authorization, provider transaction behavior or Production.

The accepted pre-documentation Build 308 Development implementation/evidence baseline is `5147b13f07d6eeef29162c69c4f46b76722956f7`.

On that exact SHA:

- Build 308 Development Runtime Acceptance run `33704055168`: **SUCCESS**.
- Build 308 Development Source Gate run `33704055304`: **SUCCESS**.
- canonical Development Source Gate run `33704055243`: **SUCCESS**.
- Cloudflare Development Acceptance run `33704055178`: **SUCCESS**.
- exact Cloudflare deployment: `3fd42f73-1053-4cfd-8919-4ba94a6ddc62`.
- exact deployment reached `success`, retained `uses_functions=true`, and passed immutable Development static smoke at `https://3fd42f73.rosiedazzlers.pages.dev`.
- the mutable `dev` alias passed full static + runtime/API smoke and converged on attempt 1/12.
- retained Build 284 contextual-proof smoke passed on both immutable and mutable Development surfaces.
- final pre-documentation exact-SHA workflow fan-out drained with zero failed, queued and in-progress runs.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Build 308 has no Production promotion authorization. Do not move `main`.**

Build 308 introduces no schema/database migration, payment-provider transaction, pricing/booking business-rule change, accounting/tax judgment, external delivery/publishing proof, role/action change, or Production data mutation. Final Build 308 closure is based on the exact documentation-synchronized `dev` SHA and its complete source/runtime/Cloudflare acceptance.

## Build 308 authority

- `scripts/cloudflare_pages_development.sh` is the canonical Cloudflare Pages Development acceptance/recovery helper.
- Normal `.github/workflows/cloudflare-development-acceptance.yml` delegates to the canonical helper in read-only `accept` mode.
- Normal acceptance contains no deployment DELETE or recreate request.
- Exact-SHA success, `uses_functions=true`, immutable deployment smoke and bounded mutable-`dev` alias convergence remain mandatory.
- The helper tolerates only a bounded same-deployment-ID list/detail metadata propagation delay after exact list-side success.
- Wrong SHA/branch, terminal failure/cancel state, missing Functions metadata, immutable smoke failure or alias convergence failure remain fail-closed.
- Cloudflare recovery is manual `workflow_dispatch` only and defaults to `observe`.
- `repair` requires exact current `dev` SHA confirmation before mutation is considered.
- Recovery can target only a non-terminal preview deployment; terminal or Production targets fail closed.
- Recovery DELETE/recreate mechanics exist only in the canonical helper.
- Production promotion remains a separate deliberate authority and is not performed by Build 308 tooling.

## Build 308 historical guard convergence

Build 308 moved release mechanics out of duplicated workflow YAML. Retained historical guards were repaired forward-compatibly rather than weakened:

- Build 274 I.T. Connections evidence remains explicit.
- Build 275 static/full smoke evidence remains explicit without duplicate execution.
- Build 276 follows the canonical exact-SHA success mechanism while retaining the Production promotion boundary.
- Build 281 follows the canonical helper while still requiring successful exact SHA, `uses_functions=true`, immutable smoke and bounded alias convergence.
- Build 283/284 evidence remains explicit in the normal acceptance summary and smoke path.
- Build 308's release guard protects these successor-aware compatibility markers.

## Build 308 validation authority

- `scripts/build308_release_check.py` — canonical helper/recovery contract, no duplicate Cloudflare mechanics, bounded list/detail consistency, retained historical markers and fail-closed Production/terminal-deployment rules.
- `scripts/build308_http_smoke.sh` — read-only Development acceptance boundary.
- `.github/workflows/build308-source-gate.yml` — focused feature source authority.
- `.github/workflows/build308-development-source-gate.yml` — cumulative Development Build 308 source gate.
- `.github/workflows/build308-development-acceptance.yml` — read-only Development runtime acceptance.
- `.github/workflows/cloudflare-development-acceptance.yml` — canonical exact-SHA Cloudflare Development acceptance.
- `.github/workflows/cloudflare-pages-recovery.yml` — manual-only observe/repair recovery entrypoint.
- retained `scripts/release_check.py`, historical focused guards, route-copy checks, SEO/H1 checks and canonical Development Source Gate remain cumulative authorities.

Do not call Build 308 fully closed until the documentation-synchronized exact `dev` SHA passes Build 308 source/runtime, canonical Development source and Cloudflare exact-SHA acceptance with zero remaining failed/queued/in-progress workflows relevant to that SHA.

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

## Retained business/runtime authority through Build 308

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

## Next autonomous build

**Build 309 — Staff Administration maintainability extraction:** externalize the accepted staff/profile/account administration runtime while preserving authentication, role/module/action authority and staff-management behavior exactly.

Build 309 must not broaden Admin or staff permissions, redesign authentication, create a schema migration, or pre-empt Build 310's Admin full-access acceptance matrix. Continue the recorded Builds 309–319 sequence without inventing business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

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