# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 310  
**Updated:** 2026-09-03  
**Read first:** `AI_PROJECT_HANDOFF.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## North star

Build a professional mobile-first detailing platform connecting:

`search / lead → service/use-case recommendation → quote / booking → assigned work → live customer/detailer interaction → proof → payment → accounting/tax workpaper → genuine review/public proof → referral/rebook → repeat maintenance`

while server work remains event-driven and dormant modules stay asleep.

## Current release boundary

- **Active Development slice:** Build 310 — Admin full-access acceptance matrix, documentation synchronization/closure.
- **Accepted Production/main:** Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- **Accepted final Build 309 Development SHA:** `1eea3569da3ea402eb3cd7cedb1f107194265c71`.
- **Accepted pre-documentation Build 310 Development SHA:** `c7db8fed785851f167167e8c1a1ca9d43066ab5e`.
- Build 310 feature final SHA: `d4fbdd8843d8bb9e476c984ec9a614452fc8843e`.
- Build 310 Source Gate run `33759860596` / #2 succeeded on the exact feature SHA.
- Build 310 Development Runtime Acceptance run `33759971667` succeeded on exact `c7db8fed785851f167167e8c1a1ca9d43066ab5e`.
- Cloudflare Development Acceptance run `33759971634` / #100 succeeded on that same Development SHA.
- exact Development/Production branch isolation, immutable deployment smoke and mutable `dev` alias convergence remain retained.
- Build 310 changes no runtime/business source, schema, pricing, booking, inventory, accounting/tax rule, payment-provider behavior or Production.
- Build 310 has **no Production promotion authorization**.

Final Build 310 closure is the documentation-synchronized `dev` SHA after the four release-authority files are merged and cumulative Development source/runtime/Cloudflare acceptance is green again.

## Permanent architecture / authorization boundary

Rosie Dazzlers remains one secured, mobile-first platform with eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent authorization rule:

**role defines the maximum module set; a staff profile may narrow non-Admin access; a global module switch may make a module unavailable; workflow state decides whether an authorized module wakes.**

Server authorization remains authoritative. Dormant modules stay asleep.

### Build 310 — Admin full-access acceptance matrix

Build 310 proves the existing authority rather than changing it:

- canonical internal modules: `detailer`, `operations`, `admin`, `it`, `finance`, `daip`, `socials`;
- canonical action registry: 28 actions;
- Admin accepts every registered action even when a narrowed profile is supplied;
- non-Admin roles remain bounded by their role ceilings;
- profile/module/action settings may narrow non-Admin access but cannot exceed the role ceiling;
- unknown action keys fail closed;
- Staff Administration UI, save normalization, server role ceiling and action registry agree.

Regression authority:

- `scripts/build310_admin_full_access_test.mjs`;
- `scripts/build310_http_smoke.sh`;
- `.github/workflows/build310-source-gate.yml`;
- `.github/workflows/build310-development-acceptance.yml`.

## Retained Administration authority

### Build 309 — Staff Administration maintainability extraction

- `assets/admin-staff-v309.js` owns the accepted root Staff Administration controller.
- role templates remain hard ceilings;
- per-person module grants may narrow non-Admin access;
- Administrator accounts remain forced to every internal module under the existing authority;
- `/api/admin/staff_list` and `/api/admin/staff_save` behavior remains unchanged;
- staff/profile/payroll fields remain unchanged;
- the older `admin-staff/index.html` route remains deliberately deferred to Build 318.
- final documentation-synchronized Build 309 Development SHA: `1eea3569da3ea402eb3cd7cedb1f107194265c71`.

## Retained I.T. / reliability authority

### Build 306 — I.T. Health dashboard extraction

`functions/api/_lib/system-health-families.js` remains the observation-only family authority and `functions/api/admin/system_health_families.js` remains its protected GET-only API.

The six isolated families remain deployment, api, d1/database data plane, storage, authentication and providers. Provider/storage observations expose safe configuration/binding presence only. Final documentation-synchronized Build 306 SHA: `202a62c271ddf42caedf13c9dc3a0cf139e55b8e`.

### Build 307 — I.T. readiness diagnostics upgrade

`functions/api/_lib/system-health-readiness.js` remains the conservative readiness layer above Build 306 raw observations. GREEN is direct evidence only. Database/R2/provider configuration remains distinct from transaction/object/provider acceptance. Corrective actions remain read-only/manual with `automatic: false`.

### Build 308 — Cloudflare deployment/recovery consolidation

`scripts/cloudflare_pages_development.sh` remains the canonical Development Cloudflare authority.

Normal acceptance remains read-only and requires exact current `dev` SHA, Development branch identity, `uses_functions=true`, immutable deployment smoke, bounded mutable-`dev` alias convergence and full runtime/API smoke on the mutable alias.

Recovery remains manual `workflow_dispatch` only, defaults to `observe`, and `repair` requires explicit exact current-`dev` SHA confirmation. Terminal/Production targets fail closed. Final documentation-synchronized Build 308 Development SHA: `d14a63c62913edf125a3e2bd8d69f110a6942dad`.

## Retained Finance / accounting authority

- Build 300 — Payments runtime extraction in `assets/admin-payments-v300.js`.
- Build 301 — Reconciliation runtime extraction in `assets/admin-accounting-v301.js`.
- Build 302 — fail-closed retired Statement Import boundary.
- Build 303 — Tax Support runtime extraction in `assets/admin-tax-support-v303.js`; current accepted Production boundary.
- Build 304 — accountant export integrity/privacy.
- Build 305 — exhaustive Finance-prefixed route/action authorization under the existing Finance action vocabulary.

No maintainability or acceptance build invents accountant/tax judgment or payment-provider transaction evidence.

## Retained customer / operations / acquisition authority

- Builds 274–280 retain Mobile Quick Book, contextual I.T. help, reliable release mechanics and deep service/local SEO.
- Build 281 retains exact-SHA Cloudflare acceptance and bounded mutable Development alias convergence.
- Build 282 retains high-intent acquisition paths into current booking authority.
- Builds 283–284 retain explicit proof/media publication authority and fail-closed contextual proof placement.
- Builds 285–287 retain current-rule rebook/review/share loops without referral economics.
- Builds 288–290 retain privacy, weak-network recovery, server-authoritative authorization and forward-restore authority.
- Builds 291–293 retain maintenance/fleet interest and customer next-action coordination without inventing cadence, pricing, contracts or recurring billing.
- Builds 294–295 retain customer/staff maintenance authority separation and stale private-control removal.
- Build 296 retains My Account runtime in `assets/my-account-v296.js`.
- Build 297 retains Operations Customer Support runtime in `assets/admin-customers-v297.js`.
- Build 298 retains Quote Pipeline runtime in `assets/admin-quotes-v298.js`.
- Build 299 retains Booking Dashboard runtime in `assets/admin-booking-v299.js`.

## Permanent business/runtime constraints

- server role/module/action authorization is authoritative;
- modules wake only when authorized and needed;
- no background polling merely because a module exists;
- one meaningful H1 per indexable public page;
- current package/vehicle-size/condition quote logic remains authoritative unless deliberately changed;
- Complete remains **Best value**;
- Exterior Detail remains distinct from Premium Wash;
- Rosie supplies normal detailing water/power; the customer supplies a safe/private/permitted work area;
- no fabricated reviews, consent, public proof, Google verification, provider evidence, accounting facts or tax judgment;
- private/customer media stays private until consent/privacy review plus explicit publication;
- no automatic replay of ambiguous non-idempotent writes.

## Completed sequence — Builds 300–310

- **Builds 300–305 — Finance:** complete on Development; Build 303 remains Production.
- **Build 306 — I.T. Health dashboard extraction:** complete.
- **Build 307 — I.T. readiness diagnostics upgrade:** complete.
- **Build 308 — Cloudflare deployment/recovery consolidation:** complete.
- **Build 309 — Staff Administration maintainability extraction:** complete; final docs-synchronized SHA `1eea3569da3ea402eb3cd7cedb1f107194265c71`.
- **Build 310 — Admin full-access acceptance matrix:** implementation/evidence complete on pre-documentation SHA `c7db8fed785851f167167e8c1a1ca9d43066ab5e`; documentation-synchronized exact-SHA acceptance is the final closure step.

## Administration / inventory / catalog — Builds 311–313

### Build 311 — Inventory Operations maintainability extraction

Next autonomous build after Build 310 closure.

Scope:

- modularize the accepted inventory/operations administration browser runtime;
- cover inventory, supplies, tools, consumption/use, reorder and kit administration surfaces that belong to the current Inventory Operations page/runtime;
- preserve current API contracts, authorization, stock/accounting semantics and user-visible behavior;
- preserve current database/schema authority;
- add exact reconstruction/source guards and read-only Development acceptance;
- avoid adding background polling or unnecessary Worker/database activity.

Build 311 must **not** invent or silently repair inventory data. Deterministic data-quality investigation/repair belongs to Build 312.

### Build 312 — Inventory data-integrity sweep

Detect duplicates, orphaned links, invalid quantities, stale external identifiers, broken kit relationships and inconsistent units. Repair only deterministic integrity defects with explicit regression protection.

### Build 313 — Catalog/Product Administration extraction

Separate Product/Catalog administration runtime while preserving pricing/product authority exactly.

## Media / Social / SEO — Builds 314–316

- Build 314 — Media/Photo Studio reliability.
- Build 315 — Content/Socials maintainability extraction; external publishing remains disabled without real provider authority.
- Build 316 — SEO/Integration administration cleanup without inventing Search Console/Google verification.

## Whole-system hardening — Builds 317–319

- Build 317 — DAIP privacy/cost/runtime audit.
- Build 318 — Whole-application route/API authority sweep, including retained duplicate/root-folder route boundaries.
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

## Build 310 closure sequence

1. retain Build 309 and all earlier source/runtime authority;
2. prove all seven modules / 28 actions for Admin without broadening permissions;
3. prove every non-Admin role ceiling and profile narrowing remains fail-closed;
4. keep deployed acceptance read-only/credential-free;
5. merge the exact green feature SHA to `dev`;
6. run Build 310 Development runtime and canonical Cloudflare exact-SHA acceptance;
7. synchronize `BUILD310_SUMMARY.md`, this roadmap, the handoff and execution queue;
8. repeat cumulative source/runtime/Cloudflare acceptance on the documentation-synchronized `dev` head;
9. only then call Build 310 Development GREEN/CLOSED and cut Build 311 from that exact head;
10. **do not promote Build 310 to `main` without new explicit authorization.**

## Documentation policy

`AI_PROJECT_HANDOFF.md` and this file are the two living authorities. `AUTONOMOUS_RELEASE_QUEUE.md` records the agreed Builds 300–319 execution order. Build summaries are release checkpoints; Git history is the detailed archive.
