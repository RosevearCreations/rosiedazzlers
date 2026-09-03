# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 309  
**Updated:** 2026-09-03  
**Read first:** `AI_PROJECT_HANDOFF.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Current release boundary

- **Active Development slice:** Build 309 — Staff Administration maintainability extraction, documentation synchronization/closure.
- **Accepted Production/main:** Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- **Accepted final Build 308 Development SHA:** `d14a63c62913edf125a3e2bd8d69f110a6942dad`.
- **Accepted pre-documentation Build 309 Development implementation/evidence baseline:** `d579eba52090755cfa5248565e45fdd7358052d3`.
- Build 308 exact-SHA Cloudflare acceptance/recovery authority remains retained and unchanged.
- Build 309 externalizes only the accepted root `admin-staff.html` controller into `assets/admin-staff-v309.js`.
- role ceilings, per-profile module narrowing, forced full Admin module access and staff list/save behavior remain unchanged.
- the pre-existing older `admin-staff/index.html` route remains byte-for-byte unchanged; Build 318 owns whole-application route/API authority convergence.
- Build 309 Development Runtime Acceptance run `33708957648` passed exact `d579eba52090755cfa5248565e45fdd7358052d3`.
- Build 309 Development Source Gate run `33708957679` passed that same SHA.
- canonical Development Source Gate run `33708957663` passed that same SHA.
- Cloudflare Development Acceptance run `33708957640` passed exact deployment `c1473523-7924-4f3c-92e2-da54d8d0e097`.
- exact deployment retained `uses_functions=true` and passed immutable Development static smoke.
- the mutable `dev` alias passed full runtime/API smoke and converged on attempt 1/12.
- retained Build 284 contextual-proof smoke passed on immutable and mutable Development surfaces.
- the exact 40-workflow pre-documentation fan-out returned zero failed, queued and in-progress workflows.
- Build 309 introduces no schema/database migration, provider transaction, pricing/booking rule, staff permission change, accounting/tax judgment, polling or Production mutation.
- Build 309 has **no Production promotion authorization**. `main` remains on accepted Build 303.
- Final Build 309 closure is determined from the exact documentation-synchronized `dev` SHA and its complete Development source/runtime/Cloudflare acceptance.
- Retained historical compatibility marker: **Build:** 301 — Build 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`.

## Retained baseline

Build 272 closed the narrow Operations/Finance action-permission and public package-clarity slice while preserving existing prices and booking/deposit mechanics. The retained baseline includes:

- server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail remains distinct from Premium Wash;
- Small/Mid/Oversized + condition/quote pricing authority;
- one meaningful H1 per indexable public page;
- Rosie provides normal detailing water and power while the customer provides a safe/private/permitted work area.

Build 273 established the retained Finance/tax-support baseline with structured evidence, T2125 workpapers and accountant-package support. That authority remains active while later builds advance. **Retain Build 273 authority.**

### 9. Payments / Finance / accounting

Finance reads remain narrowly scoped, tax-support writes retain `finance.tax.manage`, persistent Finance support records remain evidence-backed, and `accounting_documents` plus accountant-friendly export surfaces remain review-first. No maintainability, export-integrity or authorization release invents accountant/tax judgment.

### Build 304 — Accountant export integrity

Build 304 separates export shaping/privacy through `functions/api/_lib/accounting-accountant-export.js` while retaining:

- `schema_version: 2` and export contract `rosie_accountant_workpaper_json`;
- predictable JSON/UTF-8 metadata and deterministic `rosie-accountant-package-YYYY.json` filenames;
- explicit evidence-reference integrity statuses;
- no raw storage path/URL, upload/signed URL, internal document note, staff identity metadata or raw mileage-row/booking-ID leakage.

`functions/api/admin/accounting_accountant_package.js` remains read-only and protected by `finance.view`.

### Build 305 — Finance authorization sweep

`functions/api/_lib/admin-finance-actions.js` remains the centralized method-aware Finance admin route resolver. The accepted action boundary remains:

- `finance.view` for Finance-prefixed reads;
- `finance.post` for ordinary Finance writes;
- `finance.reconcile` for reconciliation mutations;
- `finance.period.close` for period/month-end closure;
- `finance.refund.manage` for refund mutations/provider refund status refresh;
- `finance.settlement.manage` for settlement/checkout/paid-state mutations;
- `finance.tax.manage` for tax-support/remittance mutations.

The Accountant role retains the same Finance ceiling and explicit module/action denial remains fail-closed. Final docs-synchronized Build 305 SHA: `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

## I.T. / reliability authority

### Build 306 — I.T. Health dashboard extraction

`functions/api/_lib/system-health-families.js` remains the observation-only family authority and `functions/api/admin/system_health_families.js` remains its protected GET-only API.

The six isolated families remain:

- `deployment`
- `api`
- `d1` historical release-key/database data plane, accurately reporting `supabase`, `d1`, or `unconfigured`
- `storage`
- `authentication`
- `providers`

The collector uses `Promise.allSettled`; a family failure remains isolated. Provider/storage observations expose safe configuration/binding presence only. Final docs-synchronized Build 306 SHA: `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.

### Build 307 — I.T. readiness diagnostics upgrade

`functions/api/_lib/system-health-readiness.js` remains the readiness layer above Build 306 raw observations. The `rosie_it_readiness_diagnostics_v1` contract retains:

- `GREEN`, `AMBER`, `RED` state;
- `evidence_class`;
- separate `transaction_acceptance`;
- stable diagnostic codes;
- plain-language summaries;
- `corrective_action` with `automatic: false`.

GREEN is reserved for a directly proved runtime condition. Database/R2/provider configuration remains separate from transaction/object/provider acceptance. Missing required local authority or an independently failed family observation is RED. Corrective mechanics remain read-only/manual.

### Build 308 — Cloudflare deployment/recovery consolidation

Build 308 makes `scripts/cloudflare_pages_development.sh` the canonical exact-SHA Development Cloudflare authority.

Normal `accept` mode:

- validates Cloudflare token/project authority;
- waits for the exact `dev` SHA to reach success;
- verifies exact SHA/branch identity;
- requires `uses_functions=true`;
- performs immutable deployment static smoke;
- waits for bounded mutable `dev` alias convergence;
- performs full runtime/API smoke only on the mutable alias;
- records the non-mutating Production promotion boundary.

Manual `recover` mode:

- is reachable only through `workflow_dispatch`;
- defaults to `observe`;
- requires explicit `repair` plus exact current `dev` SHA confirmation before mutation;
- refuses terminal deployments;
- refuses Production/non-preview targets;
- keeps DELETE/recreate mechanics inside the canonical helper only.

During acceptance Build 308 found a Cloudflare metadata propagation race: list-side exact deployment success could precede detail-side success. The helper now performs a bounded same-deployment-ID detail consistency retry without relaxing SHA/branch, terminal-state, Functions, smoke or Production-safety requirements.

Retained historical Build 274/275/276/281/283/284 guards are successor-aware and continue to protect their original semantics after mechanics moved into the canonical helper. Final documentation-synchronized Build 308 Development SHA: `d14a63c62913edf125a3e2bd8d69f110a6942dad`.

## Administration authority

### Build 309 — Staff Administration maintainability extraction

Build 309 externalizes the accepted root Staff Administration controller into `assets/admin-staff-v309.js` while preserving existing behavior exactly:

- role templates remain a hard ceiling;
- per-person module grants may narrow non-admin access;
- Administrator accounts remain granted every internal module under the existing authority;
- `/api/admin/staff_list` and `/api/admin/staff_save` orchestration is unchanged;
- payroll/staff/profile fields and the optional legacy password fallback presentation are unchanged;
- server Staff authorization helpers/endpoints are unchanged;
- no polling, schema migration or staff-permission redesign was introduced;
- `admin-staff/index.html` remains the pre-existing older route and is explicitly deferred to Build 318.

During acceptance, the retained Build 294 Production-ancestry check was made shallow-history safe without weakening the exact ancestry assertion. Build 309's scope guard permits only that specific forward-compatible historical guard repair.

## Retained Build 301–303 Finance authority

- Build 301 externalized the accepted Accounting runtime into `assets/admin-accounting-v301.js` without changing reconciliation/accounting behavior.
- Build 302 closed Statement Import reliability as a fail-closed retired-import convergence guard.
- Build 303 externalized the retained Tax Support controller into `assets/admin-tax-support-v303.js` byte-for-byte while leaving backend authorities unchanged and remains the current accepted Production boundary.

## Retained value/authority through Build 309

- Builds 274–280 established Mobile Quick Book, I.T. help, reliable release mechanics and deep service/local SEO while keeping Rosie's self-contained mobile water/power model.
- Build 281 hardened exact-SHA Cloudflare acceptance and mutable Development alias convergence.
- Build 282 created high-intent acquisition paths into current booking authority.
- Builds 283–284 established explicit proof/media publication authority and fail-closed contextual proof placement.
- Builds 285–287 created rebook/review/share loops without carrying stale prices or inventing referral economics.
- Builds 288–290 closed customer/staff privacy, weak-network recovery and server-authoritative authorization/rollback boundaries.
- Builds 291–293 added maintenance/fleet interest and customer next-action coordination without inventing cadence, pricing, contracts or recurring billing.
- Builds 294–295 removed customer authority over staff-owned maintenance scheduling/private fields and stale customer-source controls.
- Build 296 preserves My Account runtime in `assets/my-account-v296.js`.
- Build 297 preserves Operations Customer Support runtime in `assets/admin-customers-v297.js`.
- Build 298 preserves Quote Pipeline runtime in `assets/admin-quotes-v298.js`.
- Build 299 preserves Booking Dashboard runtime in `assets/admin-booking-v299.js`.
- Build 300 preserves Finance Payments runtime in `assets/admin-payments-v300.js`; its pre-existing older folder route remains deferred to Build 318.
- Build 301 preserves Finance Reconciliation runtime in `assets/admin-accounting-v301.js`.
- Build 302 preserves the retired-import/fail-closed boundary.
- Build 303 preserves Tax Support runtime in `assets/admin-tax-support-v303.js`.
- Build 304 hardens accountant export integrity.
- Build 305 makes Finance-prefixed admin route authorization exhaustive under the existing action model.
- Build 306 isolates semantics-free System Health observations.
- Build 307 adds conservative readiness interpretation and manual corrective guidance.
- Build 308 consolidates exact-SHA Development Cloudflare acceptance/recovery without weakening release evidence or Production isolation.
- Build 309 preserves Staff Administration runtime in `assets/admin-staff-v309.js` and explicitly leaves the older Staff folder route for Build 318.

## Permanent business/runtime constraints

- server role/module/action authorization is authoritative;
- modules wake only when authorized and needed;
- no background polling merely because a module exists;
- one meaningful H1 per indexable public page;
- current package/vehicle-size/condition quote logic remains authoritative unless deliberately changed;
- Rosie supplies normal detailing water/power; the customer supplies a safe/private/permitted work area;
- no fabricated reviews, consent, public proof, Google verification, provider evidence, accounting facts or tax judgment;
- private/customer media stays private until consent/privacy review plus explicit publication;
- no automatic replay of ambiguous non-idempotent writes.

## Completed Finance roadmap — Builds 300–305

1. **Build 300 — Finance Payments maintainability extraction** — complete.
2. **Build 301 — Finance Reconciliation maintainability extraction** — complete.
3. **Build 302 — Statement Import reliability** — complete as fail-closed retired-import convergence.
4. **Build 303 — Finance Tax-support maintainability extraction** — complete and accepted in Production at `09442c53d385aca7995150ace4bde55abd51d7df`.
5. **Build 304 — Accountant export integrity** — complete on Development.
6. **Build 305 — Finance authorization sweep** — complete on Development.

## I.T. / reliability roadmap — Builds 306–308

- **Build 306 — I.T. Health dashboard extraction** — complete on Development; final docs-synchronized SHA `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.
- **Build 307 — I.T. readiness diagnostics upgrade** — complete on Development.
- **Build 308 — Cloudflare deployment/recovery consolidation** — complete on Development; final documentation-synchronized SHA `d14a63c62913edf125a3e2bd8d69f110a6942dad`.

## Administration / inventory / catalog — Builds 309–313

- **Build 309 — Staff Administration maintainability extraction** — implementation/evidence complete on pre-documentation exact SHA `d579eba52090755cfa5248565e45fdd7358052d3`; documentation-synchronized exact-SHA acceptance is the final closure step.
- **Build 310 — Admin full-access acceptance matrix** — next autonomous build after Build 309 closure; prove existing Admin full access and narrower-profile restrictions without changing permissions to make the test pass.
- Build 311 — Inventory Operations maintainability extraction.
- Build 312 — deterministic inventory data-integrity sweep.
- Build 313 — Catalog/Product Administration extraction.

## Media / Social / SEO — Builds 314–316

- Build 314 — Media/Photo Studio reliability.
- Build 315 — Content/Socials maintainability extraction; external publishing remains disabled without real provider authority.
- Build 316 — SEO/Integration administration cleanup without inventing Search Console/Google verification.

## Whole-system hardening — Builds 317–319

- Build 317 — DAIP privacy/cost/runtime audit.
- Build 318 — Whole-application route/API authority sweep, including the pre-existing Payments root/folder divergence discovered by Build 300 and the pre-existing Staff root/folder divergence retained by Build 309.
- Build 319 — runtime efficiency + CI consolidation without weakening exact release/rollback evidence.

## Deferred until explicit business/evidence authority exists

Do not autonomously invent:

- maintenance pricing, cadence, discounts, perks, recurring scope or cancellation/priority terms;
- fleet minimums, pricing, travel rules, discounts, contracts or cancellation economics;
- referral/loyalty qualification, reward economics, caps, timing, refund handling or expiry;
- material restoration pricing/labour rules;
- genuine public-use consent/proof;
- Google Business Profile/Search Console ownership/verification;
- provider transaction/settlement/webhook acceptance;
- real email/SMS/Web Push delivery;
- accountant/tax judgment;
- physical-device evidence not proven by automation.

## Build 309 acceptance sequence

1. retain Build 308 release/recovery and all earlier source/runtime authority;
2. extract only the accepted root Staff Administration runtime into `assets/admin-staff-v309.js`;
3. preserve role ceilings, profile narrowing, Admin full-module authority and Staff API behavior exactly;
4. leave the pre-existing `admin-staff/index.html` route unchanged for Build 318;
5. run the Build 309 exact reconstruction/source guard and read-only Staff HTTP smoke;
6. merge the exact green feature head and narrow forward-compatible Build 294 history repair to `dev`;
7. run Build 309 and canonical cumulative Development source gates;
8. prove exact Cloudflare Development SHA, Functions attachment, immutable deployment smoke and bounded mutable-alias convergence through the Build 308 canonical helper;
9. require zero failed, queued and in-progress workflows on the exact pre-documentation SHA;
10. synchronize `BUILD309_SUMMARY.md`, this roadmap, the handoff and execution queue;
11. repeat exact-SHA source/runtime/Cloudflare acceptance on the documentation-synchronized `dev` head;
12. only then call Build 309 Development-green/closed and cut Build 310 from that exact head;
13. **do not promote Build 309 to `main` without new explicit authorization.**

## Retained focused-guard compatibility anchors

These anchors preserve historical focused-guard vocabulary; they are not the living build number.

- **Build:** 274 — Build 274 — active; contextual help; Mobile Quick Book; Google trust and measurable local SEO; I.T. Connections; Mobile Auto Detailing & Interior/Exterior Restoration.
- **Build:** 283 — Build 283 publication authority remains retained; explicit publish/unpublish governs public proof.
- **Build:** 284 — Build 284 contextual proof placement remains retained.
- **Build:** 287 — Build 287 review/share attribution authority remains retained; no referral/loyalty economics are implied. Production remains closed.
- **Build:** 288 — Build 288 customer/staff privacy boundary remains retained. Production remains closed.
- **Build:** 289 — Build 289 accessibility and weak-network account resilience remains retained. Production remains closed.
- **Build:** 290 — Build 290 forward restore authorization authority remains retained. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 291 — Build 291 maintenance retention intake remains retained. `accounting_documents`; accountant-friendly export surfaces. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 292 — Build 292 fleet/workplace acquisition intake remains retained. Production remains closed.
- **Build:** 293 — Build 293 — customer retention next-action hub; Customer maintenance/auto-schedule authority closure; customer-safe review booking linkage; `accounting_documents`; accountant-friendly export surfaces. Production remains closed.
- **Build:** 294 — Build 294 customer maintenance / auto-schedule authority closure remains retained. Production remains closed.
- **Build:** 295 — Build 295 — customer account static source authority cleanup; My Account maintainability extraction.
- **Build:** 296 — Build 296 — My Account maintainability extraction.
- **Build:** 297 — Build 297 — Operations customer support maintainability extraction; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 298 — Build 298 — Operations booking/quote support maintainability extraction; `assets/admin-quotes-v298.js`; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 299 — Build 299 — Operations booking-dashboard support maintainability extraction; `assets/admin-booking-v299.js`; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 300 — Build 300 — Finance Payments maintainability extraction; `assets/admin-payments-v300.js`; accepted Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`; next retained queue marker Build 301 — Finance Reconciliation maintainability extraction; duplicate-route owner Build 318 — Whole-application route/API authority sweep.

## Documentation policy

`AI_PROJECT_HANDOFF.md` and this file are the two living authorities. `AUTONOMOUS_RELEASE_QUEUE.md` records the agreed Builds 300–319 execution order. Build summaries are release checkpoints; Git history is the archive.