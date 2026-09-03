# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 306
**Updated:** 2026-09-02  
**Read first:** `AI_PROJECT_HANDOFF.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Current release boundary

- **Active Development slice:** Build 306 — I.T. Health dashboard extraction, documentation synchronization/closure.
- **Accepted Production/main:** Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- **Accepted pre-documentation Build 306 Development implementation/evidence baseline:** `fc3cf314f419c7b7209892262cc0cce8a7a0c61b`.
- Build 306 extracts six independently observable System Health families: deployment, API, `d1` release-key/database data plane, storage, authentication and providers.
- The `d1` release key reports the actual configured database mode accurately: Supabase when Rosie's Supabase authority is present, D1 only when a real `DB` binding exists, otherwise unconfigured.
- The family collector uses `Promise.allSettled`; one failed family cannot suppress the others, and each family can be refreshed independently.
- The Build 306 API is GET-only, protected by `it.runtime.view`, exposes no provider secrets/session tokens/staff identifiers and performs no provider/database/storage mutation.
- Cloudflare Development Acceptance run `33699582911` passed exact `fc3cf314f419c7b7209892262cc0cce8a7a0c61b` with Functions attached, immutable deployment smoke and full Development alias convergence/runtime smoke.
- The first Build 306 runtime attempt raced the new deployment and saw `404` for the new page. After Cloudflare exact-SHA acceptance, the same job was rerun with no source change and both exact source validation and deployed read-only System Health smoke passed.
- Final pre-documentation exact-SHA queries returned zero failed, queued and in-progress workflows.
- Build 306 does not assign GREEN/AMBER/RED state, diagnose expected degradation versus defects, or prescribe corrective mechanics; Build 307 owns those semantics.
- Build 306 has **no Production promotion authorization**. `main` remains on accepted Build 303.
- Final Build 306 closure is determined from the exact documentation-synchronized `dev` SHA and its complete Development source/runtime/Cloudflare acceptance.
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

Build 304 separates export shaping/privacy from the retained tax-support calculations through `functions/api/_lib/accounting-accountant-export.js`.

The accountant JSON contract provides:

- `schema_version: 2` and export contract `rosie_accountant_workpaper_json`;
- predictable `application/json` / UTF-8 metadata;
- deterministic `rosie-accountant-package-YYYY.json` filenames;
- evidence reference statuses `general`, `verified`, `unverified`, `unresolved`, `missing_related_id`, and `unsupported_type`;
- evidence-integrity review counts;
- safe basename-only evidence filenames;
- masked-only identity fields;
- no raw storage path/URL, upload/signed URL, internal document note, staff identity metadata or raw mileage-row/booking-ID leakage.

`functions/api/admin/accounting_accountant_package.js` remains read-only and protected by `finance.view`. `functions/api/admin/accounting_export.js` retains CSV behavior while normalizing its dynamic payables-status filename token. Accountant-facing notes remain available where they are deliberately part of the workpaper contract.

Build 304 also repairs historical CI assumptions without weakening their authority: Build 273 follows export shaping into the helper only when delegated there; Build 290/291/292 obtain complete history before strict accepted-anchor ancestry checks; and Build 299/300 source hygiene is frozen to each build's accepted historical release delta.

## Build 305 — Finance authorization sweep

Build 305 adds `functions/api/_lib/admin-finance-actions.js` as the centralized method-aware Finance admin route resolver while retaining the existing action authority in `functions/api/_lib/action-permissions.js`.

The accepted boundary is:

- `finance.view` for current Finance-prefixed reads;
- `finance.post` for ordinary Finance writes;
- `finance.reconcile` for reconciliation mutations;
- `finance.period.close` for period/month-end closure mutations;
- `finance.refund.manage` for refund mutations/provider refund status refresh;
- `finance.settlement.manage` for settlement/checkout/paid-state mutations;
- `finance.tax.manage` for tax-support/remittance mutations.

The Accountant role still has the same seven Finance defaults and cannot escape the Finance module ceiling. Explicit action denial and module disablement win. Operations-owned quote/final-balance request lifecycle remains Operations authority; hosted final-balance checkout creation remains Finance settlement authority; booking-scoped operational finance notes retain booking-work authority.

The Build 305 regression suite scans the actual admin directory, covers all current `accounting_*`, `payment_*`, and `payroll_*` route/method pairs, and fails if a new Finance-prefixed route is introduced without an action resolution. The accepted tree covered 40 files / 80 exported methods.

Build 305 also repairs retained Build 272 and Build 290 guard location assumptions without weakening their protected actions. Both guards follow exact historical Finance mappings into the canonical resolver only when delegation is present.

## Build 306 — I.T. Health dashboard extraction

Build 306 adds `functions/api/_lib/system-health-families.js` as the observation-only System Health family authority and `functions/api/admin/system_health_families.js` as its protected GET-only API.

The six isolated families are:

- `deployment` — Pages deployment identity inputs independent of runtime checks;
- `api` — protected Pages Functions request-path observation;
- `d1` — historical release family key for the database/data plane, accurately reporting `supabase`, `d1`, or `unconfigured`;
- `storage` — safe Cloudflare R2 binding-presence metadata only;
- `authentication` — authenticated role/admin authority without staff identity or token leakage;
- `providers` — existing integration-registry configuration presence only, with no provider transaction/API call.

`admin-system-health.html` and `assets/admin-system-health-v306.js` provide a standalone protected dashboard with all-family and individual-family refresh. A family observation failure is contained to that family.

The Build 306 test suite verifies independent family addressing, accurate Supabase-vs-D1 mode, secret/staff-identity non-disclosure, anonymous fail-closed behavior, mutation rejection and the explicit Build 307 semantic boundary.

Build 306 changes no readiness policy. GREEN/AMBER/RED normalization, configuration-vs-transaction interpretation, diagnosis and corrective mechanics are Build 307 work.

## Retained Build 301–303 Finance authority

- Build 301 externalized the accepted `admin-accounting.html` runtime into `assets/admin-accounting-v301.js` without changing reconciliation/accounting behavior.
- Build 302 closed Statement Import reliability as a fail-closed convergence guard because the accepted application has no active statement-import parser/API; no retired importer was recreated.
- Build 303 externalized the retained Build 273 Tax Support controller into `assets/admin-tax-support-v303.js` byte-for-byte while leaving `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` unchanged.
- No Build 301–305 maintainability/integrity/authorization release invents matching/posting/approval, payment/provider or accountant/tax judgment.

## Retained value/authority through Build 306

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
- Build 306 — I.T. Health dashboard extraction creates independent, read-only health observations without redefining readiness/provider authority.

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
2. **Build 301 — Finance Reconciliation maintainability extraction** — complete; behavior-preserving Accounting/reconciliation runtime extraction.
3. **Build 302 — Statement Import reliability** — complete as a fail-closed convergence guard because the accepted application has no active statement-import parser/API; no retired ingestion path was recreated.
4. **Build 303 — Finance Tax-support maintainability extraction** — complete and accepted in Production at `09442c53d385aca7995150ace4bde55abd51d7df`; retained Build 273 controller externalized byte-for-byte.
5. **Build 304 — Accountant export integrity** — complete on Development; export contract/privacy integrity hardened without tax/accounting policy change.
6. **Build 305 — Finance authorization sweep** — complete on Development; final docs-synchronized accepted SHA `fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605`.

Retained Finance storage and export concepts include `accounting_documents`, structured evidence, T2125 workpapers and **accountant-friendly export surfaces**. Accountant/tax judgment remains external/manual authority.

## I.T. / reliability roadmap — Builds 306–308

- **Build 306 — I.T. Health dashboard extraction** — technically complete; documentation-synchronized exact-SHA Development acceptance is the final closure step.
- **Build 307 — I.T. readiness diagnostics upgrade** — next untouched item after Build 306 closure; normalize GREEN/AMBER/RED state, distinguish configuration from transaction acceptance, improve diagnosis and expose corrective mechanics using Build 306 observations.
- Build 308 — Cloudflare deployment/recovery consolidation around the proven exact-SHA Development path.

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

## Build 306 acceptance sequence

1. run Build 306 family-isolation/non-disclosure contract and retained Build 305 source guard;
2. merge the accepted implementation to `dev`;
3. run Build 306 and canonical cumulative Development source gates;
4. prove exact Cloudflare Development deployment SHA, Functions attachment, immutable deployment smoke and mutable alias convergence;
5. run Build 306 deployed read-only page/API smoke after deployment convergence;
6. require zero failed, queued and in-progress workflows on the exact pre-documentation SHA;
7. synchronize `BUILD306_SUMMARY.md`, this roadmap, the handoff and execution queue;
8. repeat exact-SHA source/runtime/Cloudflare acceptance on the documentation-synchronized `dev` head;
9. only then call Build 306 Development-green/closed;
10. **do not promote Build 306 to `main` without new explicit authorization.**

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
