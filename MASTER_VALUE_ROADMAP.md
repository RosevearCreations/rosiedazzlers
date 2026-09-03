# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 307
**Updated:** 2026-09-03  
**Read first:** `AI_PROJECT_HANDOFF.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Current release boundary

- **Active Development slice:** Build 307 — I.T. readiness diagnostics upgrade, documentation synchronization/closure.
- **Accepted Production/main:** Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- **Accepted final Build 306 Development SHA:** `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.
- **Accepted pre-documentation Build 307 Development implementation/evidence baseline:** `069bb7d7bff9c1f50974b7018634e16594907c61`.
- Build 307 layers evidence-scoped GREEN/AMBER/RED readiness over the six raw Build 306 observations without altering the raw observation authority.
- GREEN is reserved for a runtime condition the diagnostic itself proves.
- Database/D1/Supabase, R2 and provider configuration remains AMBER when no live transaction/object/provider acceptance was performed.
- Missing required database/R2 authority or an independently failed observation is RED.
- Provider configuration never counts as successful payment, webhook, delivery, publishing or external API transaction acceptance.
- Corrective mechanics are explicit but read-only/manual: `automatic: false`.
- Build 307 Development Source Gate run `33701368432` passed on exact `069bb7d7bff9c1f50974b7018634e16594907c61`.
- Cloudflare Development Acceptance run `33701368256` passed exact deployment `c6696a18-964d-4f3b-a540-335ff1665b9e`, which reached success, reported Functions attached, passed immutable smoke and full Development alias runtime/API smoke with convergence on attempt 1/12.
- Build 307 runtime acceptance initially raced alias deployment. After Cloudflare convergence the same job was rerun without source changes and passed exact source plus deployed read-only readiness smoke.
- Final pre-documentation exact-SHA queries returned zero failed, queued and in-progress workflows.
- Build 307 introduces no schema/database migration, provider transaction, pricing/booking rule, accounting/tax judgment, or Production mutation.
- Build 307 has **no Production promotion authorization**. `main` remains on accepted Build 303.
- Final Build 307 closure is determined from the exact documentation-synchronized `dev` SHA and its complete Development source/runtime/Cloudflare acceptance.
- Retained historical compatibility marker: **Build:** 301 — Build 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`.

## Retained baseline

Build 272 closed the narrow Operations/Finance action-permission and public package-clarity slice while preserving existing prices and booking/deposit mechanics. The retained baseline includes:

- server-authoritative role/module/action permissions;
- Complete = **Best value**;
- Exterior Detail remains distinct from Premium Wash;
- Small/Mid/Oversized + condition/quote pricing authority;
- one meaningful H1 per indexable public page;
- Rosie provides normal detailing water and power while the customer provides a safe/private/permitted work area.

Build 273 established the retained Finance/tax-support baseline with structured evidence, T2125 workpapers and accountant-package support. That authority remains active while later builds advance.

### 9. Payments / Finance / accounting

Retain Build 273 authority: Finance reads remain narrowly scoped, tax-support writes retain `finance.tax.manage`, persistent Finance support records remain evidence-backed, and `accounting_documents` plus accountant-friendly export surfaces remain review-first. No later maintainability, export-integrity or authorization release invents accountant/tax judgment.

## Build 304 — Accountant export integrity

Build 304 separates export shaping/privacy from retained tax-support calculations through `functions/api/_lib/accounting-accountant-export.js`.

The accountant JSON contract retains:

- `schema_version: 2` and export contract `rosie_accountant_workpaper_json`;
- predictable JSON/UTF-8 metadata and deterministic `rosie-accountant-package-YYYY.json` filenames;
- explicit evidence-reference integrity statuses;
- safe basename-only evidence filenames and masked-only identity fields;
- no raw storage path/URL, upload/signed URL, internal document note, staff identity metadata or raw mileage-row/booking-ID leakage.

`functions/api/admin/accounting_accountant_package.js` remains read-only and protected by `finance.view`. Build 304 changes no tax/accounting judgment, provider behavior or schema.

## Build 305 — Finance authorization sweep

Build 305 adds `functions/api/_lib/admin-finance-actions.js` as the centralized method-aware Finance admin route resolver while retaining the existing action authority in `functions/api/_lib/action-permissions.js`.

The accepted action boundary remains:

- `finance.view` for current Finance-prefixed reads;
- `finance.post` for ordinary Finance writes;
- `finance.reconcile` for reconciliation mutations;
- `finance.period.close` for period/month-end closure mutations;
- `finance.refund.manage` for refund mutations/provider refund status refresh;
- `finance.settlement.manage` for settlement/checkout/paid-state mutations;
- `finance.tax.manage` for tax-support/remittance mutations.

The Accountant role retains the same seven Finance defaults and cannot escape the Finance module ceiling. Explicit action denial and module disablement win. The accepted exhaustive scan covered 40 files / 80 exported methods. Final docs-synchronized Build 305 SHA: `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

## Build 306 — I.T. Health dashboard extraction

Build 306 adds `functions/api/_lib/system-health-families.js` as the observation-only System Health family authority and `functions/api/admin/system_health_families.js` as its protected GET-only API.

The six isolated families remain:

- `deployment` — Pages deployment identity inputs independent of runtime checks;
- `api` — protected Pages Functions request-path observation;
- `d1` — historical release family key for the database/data plane, accurately reporting `supabase`, `d1`, or `unconfigured`;
- `storage` — safe Cloudflare R2 binding-presence metadata only;
- `authentication` — authenticated role/admin authority without staff identity or token leakage;
- `providers` — existing integration-registry configuration presence only, with no provider transaction/API call.

The collector uses `Promise.allSettled`; a family failure stays isolated. The raw helper remains semantics-free. Final docs-synchronized Build 306 SHA: `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.

## Build 307 — I.T. readiness diagnostics upgrade

Build 307 adds `functions/api/_lib/system-health-readiness.js` above the raw Build 306 observation layer.

The `rosie_it_readiness_diagnostics_v1` contract adds:

- explicit `GREEN`, `AMBER`, `RED` state;
- an `evidence_class` explaining what was actually proved;
- a separate `transaction_acceptance` field;
- stable diagnostic codes rather than vague service-unavailable wording;
- plain-language summaries;
- `corrective_action` with `automatic: false`, title, safe steps and a link to the Startup Command Center.

Evidence rules are intentionally conservative:

- Deployment and API can become GREEN where the protected runtime itself proves the condition.
- Authentication becomes GREEN only after the protected staff request passes `it.runtime.view`.
- Database/data-plane configuration remains AMBER because Build 307 does not execute a database transaction; missing supported database authority is RED.
- R2 binding presence remains AMBER because Build 307 does not read/write/list/delete an object; missing required Rosie binding is RED.
- Providers remain AMBER for configuration-only or missing/optional state; provider configuration is never provider transaction acceptance.
- An independently failed family observation is RED without suppressing healthy families.

`admin-system-health.html` and `assets/admin-system-health-v307.js` show state, evidence class, transaction status, diagnostic code, raw observations, and read-only corrective guidance. `functions/api/admin/system_health_families.js` remains GET-only, `allowLegacyAdminFallback:false`, and `it.runtime.view` protected.

`scripts/build306_release_check.py` was repaired forward-compatibly: it still requires the raw Build 306 helper to be semantics-free while permitting the dashboard page to consume the v307 successor runtime.

## Retained Build 301–303 Finance authority

- Build 301 externalized the accepted `admin-accounting.html` runtime into `assets/admin-accounting-v301.js` without changing reconciliation/accounting behavior.
- Build 302 closed Statement Import reliability as a fail-closed convergence guard because the accepted application has no active statement-import parser/API; no retired importer was recreated.
- Build 303 externalized the retained Build 273 Tax Support controller into `assets/admin-tax-support-v303.js` byte-for-byte while leaving its backend authorities unchanged.
- No Build 301–307 maintainability/integrity/authorization/readiness release invents matching/posting/approval, payment/provider or accountant/tax judgment.

## Retained value/authority through Build 307

- Builds 274–280 established Mobile Quick Book, I.T. help, reliable release mechanics and deep service/local SEO while keeping Rosie’s self-contained mobile water/power model.
- Build 281 hardened exact-SHA Cloudflare acceptance and mutable Development alias convergence.
- Build 282 created high-intent acquisition paths into current booking authority.
- Builds 283–284 established explicit proof/media publication authority and fail-closed contextual proof placement.
- Builds 285–287 created rebook/review/share loops without carrying stale prices or inventing referral economics.
- Builds 288–290 closed customer/staff privacy, weak-network recovery and server-authoritative authorization/rollback boundaries.
- Builds 291–293 added maintenance/fleet interest and customer next-action coordination without inventing cadence, pricing, contracts or recurring billing.
- Builds 294–295 removed customer authority over staff-owned maintenance scheduling/private fields and stale customer-source controls.
- Build 296 — My Account maintainability extraction preserves the accepted account runtime in `assets/my-account-v296.js`.
- Build 297 — Operations customer support maintainability extraction preserves the accepted customer-support runtime in `assets/admin-customers-v297.js`.
- Build 298 — Operations booking/quote support maintainability extraction preserves the accepted Quote Pipeline runtime in `assets/admin-quotes-v298.js`.
- Build 299 — Operations booking-dashboard support maintainability extraction preserves the accepted Booking Dashboard runtime in `assets/admin-booking-v299.js`.
- Build 300 — Finance Payments maintainability extraction preserves the accepted mature root Payments runtime in `assets/admin-payments-v300.js`; its pre-existing older folder route remains deliberately deferred to Build 318.
- Build 301 — Finance Reconciliation maintainability extraction preserves the accepted Accounting runtime in `assets/admin-accounting-v301.js`.
- Build 302 — Statement Import reliability preserves the retired-import/fail-closed boundary.
- Build 303 — Finance Tax-support maintainability extraction preserves the retained Tax Support runtime in `assets/admin-tax-support-v303.js`.
- Build 304 — Accountant export integrity preserves Finance/tax authority while hardening evidence/export privacy and predictable formats.
- Build 305 — Finance authorization sweep makes current Finance-prefixed admin routes exhaustive under the existing action model without broadening roles.
- Build 306 — I.T. Health dashboard extraction creates independent semantics-free read-only observations.
- Build 307 — I.T. readiness diagnostics upgrade adds conservative readiness interpretation and manual corrective guidance without fabricating external evidence.

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

## Finance roadmap — Builds 300–305

1. **Build 300 — Finance Payments maintainability extraction** — complete and accepted.
2. **Build 301 — Finance Reconciliation maintainability extraction** — complete.
3. **Build 302 — Statement Import reliability** — complete as a fail-closed retired-import convergence guard.
4. **Build 303 — Finance Tax-support maintainability extraction** — complete and accepted in Production at `09442c53d385aca7995150ace4bde55abd51d7df`.
5. **Build 304 — Accountant export integrity** — complete on Development.
6. **Build 305 — Finance authorization sweep** — complete on Development; final accepted SHA `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

Retained Finance storage and export concepts include `accounting_documents`, structured evidence, T2125 workpapers and **accountant-friendly export surfaces**. Accountant/tax judgment remains external/manual authority.

## I.T. / reliability roadmap — Builds 306–308

- **Build 306 — I.T. Health dashboard extraction** — complete on Development; final docs-synchronized SHA `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.
- **Build 307 — I.T. readiness diagnostics upgrade** — technically complete; documentation-synchronized exact-SHA Development acceptance is the final closure step.
- **Build 308 — Cloudflare deployment/recovery consolidation** — next untouched item after Build 307 closure; integrate the proven exact-SHA Development recovery path into normal release tooling and remove redundant deployment/recovery mechanics without weakening release evidence.

## Administration / inventory / catalog — Builds 309–313

- Build 309 — Staff Administration maintainability extraction.
- Build 310 — Admin full-access acceptance matrix.
- Build 311 — Inventory Operations maintainability extraction.
- Build 312 — deterministic inventory data-integrity sweep.
- Build 313 — Catalog/Product Administration extraction.

## Media / Social / SEO — Builds 314–316

- Build 314 — Media/Photo Studio reliability.
- Build 315 — Content/Socials maintainability extraction; external publishing remains disabled without real provider authority.
- Build 316 — SEO/Integration administration cleanup without inventing Search Console/Google verification.

## Whole-system hardening — Builds 317–319

- Build 317 — DAIP privacy/cost/runtime audit.
- Build 318 — Whole-application route/API authority sweep, including the pre-existing Payments root/folder divergence discovered by Build 300.
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

## Build 307 acceptance sequence

1. retain Build 306 raw family-isolation/non-disclosure authority;
2. run Build 307 readiness semantics/privacy/no-schema source guard;
3. merge the exact green feature head to `dev`;
4. run Build 307 and canonical cumulative Development source gates;
5. prove exact Cloudflare Development deployment SHA, Functions attachment, immutable deployment smoke and mutable alias convergence;
6. run Build 307 deployed read-only readiness page/API smoke only after deployment convergence; a deployment-order race may be rerun without changing source;
7. require zero failed, queued and in-progress workflows on the exact pre-documentation SHA;
8. synchronize `BUILD307_SUMMARY.md`, this roadmap, the handoff and execution queue;
9. repeat exact-SHA source/runtime/Cloudflare acceptance on the documentation-synchronized `dev` head;
10. only then call Build 307 Development-green/closed;
11. **do not promote Build 307 to `main` without new explicit authorization.**

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
