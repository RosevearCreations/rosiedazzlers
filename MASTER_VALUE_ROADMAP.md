# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 304
**Updated:** 2026-09-02  
**Read first:** `AI_PROJECT_HANDOFF.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Current release boundary

- **Active Development slice:** Build 304 — Accountant export integrity.
- **Accepted Production/main:** Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- **Accepted pre-documentation Build 304 Development implementation/evidence baseline:** `6351321a2d33ed8489295a60d8de72adea81a859`.
- Build 304 gives the accountant JSON package a versioned/predictable export contract, explicit evidence-reference integrity states, safe filenames and an export whitelist that keeps private/internal storage/staff metadata out of the package.
- Build 304 preserves the Build 303 tax-support controller/runtime and Build 273 Finance/T2125/accountant-workpaper calculations.
- No schema/database migration, accounting/tax-policy change, payment-provider mutation or new tax judgment is introduced.
- Build 304 has **no Production promotion authorization**. `main` remains on accepted Build 303.
- Final Build 304 closure is determined from the exact documentation-synchronized `dev` SHA and its complete Development source/runtime/Cloudflare acceptance.
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

Retain Build 273 authority: Finance reads remain narrowly scoped, tax-support writes retain `finance.tax.manage`, persistent Finance support records remain evidence-backed, and `accounting_documents` plus accountant-friendly export surfaces remain review-first. No later maintainability or export-integrity release invents accountant/tax judgment.

## Build 304 — Accountant export integrity

Build 304 separates export shaping/privacy from the retained tax-support calculations through `functions/api/_lib/accounting-accountant-export.js`.

The accountant JSON contract now provides:

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

## Retained Build 301–303 Finance authority

- Build 301 externalized the accepted `admin-accounting.html` runtime into `assets/admin-accounting-v301.js` without changing reconciliation/accounting behavior.
- Build 302 closed Statement Import reliability as a fail-closed convergence guard because the accepted application has no active statement-import parser/API; no retired importer was recreated.
- Build 303 externalized the retained Build 273 Tax Support controller into `assets/admin-tax-support-v303.js` byte-for-byte while leaving `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` unchanged.
- No Build 301–304 maintainability/integrity release invents matching/posting/approval, payment/provider or accountant/tax judgment.

## Retained value/authority through Build 303

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
5. **Build 304 — Accountant export integrity** — current Development release; implementation complete, final documentation-synchronized exact-SHA acceptance required before closure.
6. **Build 305 — Finance authorization sweep** — next untouched item; test every Finance endpoint against role/module/action/direct-API/anonymous/cross-module boundaries.

Retained Finance storage and export concepts include `accounting_documents`, structured evidence, T2125 workpapers and **accountant-friendly export surfaces**. Accountant/tax judgment remains external/manual authority.

## I.T. / reliability roadmap — Builds 306–308

- Build 306 — I.T. Health dashboard extraction.
- Build 307 — readiness diagnostics upgrade with explicit GREEN/AMBER/RED configuration-vs-transaction distinction and corrective mechanics.
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

## Build 304 acceptance sequence

1. run Build 304 export-contract and retained Finance source guards;
2. transfer the accepted implementation to `dev`;
3. run Build 304 and canonical cumulative Development source gates;
4. run read-only Build 304 accountant-export runtime acceptance;
5. prove the exact Cloudflare Development deployment SHA, `uses_functions=true`, immutable deployment smoke and mutable alias convergence;
6. synchronize `BUILD304_SUMMARY.md`, this roadmap, the handoff and execution queue;
7. repeat exact-SHA source/runtime/Cloudflare acceptance on the documentation-synchronized `dev` head;
8. only then call Build 304 Development-green;
9. **do not promote Build 304 to `main` without new explicit authorization.**

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
