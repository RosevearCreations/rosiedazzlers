# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 310  
**Updated:** 2026-09-03  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 310 is the current **Admin full-access acceptance matrix** Development release. It is a proof/acceptance-only build over the accepted Build 309 Staff Administration authority. It proves the existing server-authoritative Admin permission model without broadening permissions, changing authentication, changing schema/business rules or touching Production.

- accepted final Build 309 Development SHA: `1eea3569da3ea402eb3cd7cedb1f107194265c71`;
- Build 310 feature final SHA: `d4fbdd8843d8bb9e476c984ec9a614452fc8843e`;
- accepted pre-documentation Build 310 Development SHA: `c7db8fed785851f167167e8c1a1ca9d43066ab5e`;
- Build 310 Source Gate run `33759860596` / #2: **SUCCESS** on exact feature SHA `d4fbdd8843d8bb9e476c984ec9a614452fc8843e`;
- PR #55 merged Build 310 to `dev`;
- Build 310 Development Runtime Acceptance run `33759971667`: **SUCCESS** on exact `c7db8fed785851f167167e8c1a1ca9d43066ab5e`;
- Cloudflare Development Acceptance run `33759971634` / #100: **SUCCESS** on that same Development SHA;
- immutable deployment smoke, mutable `dev` alias convergence and the Development=`dev` / Production=`main` boundary were retained;
- accepted Production/main remains Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.

Build 310 has **no Production promotion authorization**. Do not move `main` unless a later instruction explicitly authorizes a Production promotion.

Final Build 310 closure is the documentation-synchronized exact `dev` SHA after this handoff, `MASTER_VALUE_ROADMAP.md`, `AUTONOMOUS_RELEASE_QUEUE.md` and `BUILD310_SUMMARY.md` are merged and the cumulative Development source/runtime/Cloudflare acceptance is green again on that exact SHA.

## Build 310 authority

The canonical internal module order remains:

1. `detailer`
2. `operations`
3. `admin`
4. `it`
5. `finance`
6. `daip`
7. `socials`

The canonical action registry contains **28 actions across those seven modules**.

Build 310 proves:

- Admin accepts every registered action even when a deliberately narrowed module/action profile is supplied;
- the existing legacy-Admin compatibility bridge retains full action authority only where that existing compatibility path applies;
- non-Admin roles remain bounded by their existing hard role ceilings;
- per-profile module/action settings may narrow non-Admin authority but cannot expand it past the role ceiling;
- unknown action keys fail closed;
- Staff Administration UI controls, forced-Admin presentation, save normalization, server auth ceiling and action registry agree.

Build 310 adds only proof/acceptance assets:

- `scripts/build310_admin_full_access_test.mjs`;
- `scripts/build310_http_smoke.sh`;
- `.github/workflows/build310-source-gate.yml`;
- `.github/workflows/build310-development-acceptance.yml`.

The Build 310 source gate contains a proof-only changed-files boundary. Runtime/business source changes are not part of this release.

## Retained Build 309 authority

Build 309 remains the Staff Administration maintainability boundary:

- `assets/admin-staff-v309.js` owns the accepted root Staff Administration controller;
- `admin-staff.html` delegates to that versioned module;
- role templates remain hard ceilings;
- per-person module grants may narrow non-Admin access;
- Administrator accounts remain forced to every internal module under the existing authority;
- `/api/admin/staff_list` and `/api/admin/staff_save` behavior remains unchanged;
- staff/profile/payroll fields and optional legacy password fallback presentation remain unchanged;
- `admin-staff/index.html` remains the pre-existing older route and is deliberately deferred to **Build 318 — Whole-application route/API authority sweep**;
- final documentation-synchronized Build 309 Development SHA: `1eea3569da3ea402eb3cd7cedb1f107194265c71`.

## Retained I.T. / release authority

### Build 308

`scripts/cloudflare_pages_development.sh` remains the canonical Cloudflare Pages Development acceptance/recovery helper.

Normal acceptance remains read-only and requires:

- exact current `dev` SHA success;
- Development branch identity;
- `uses_functions=true`;
- immutable deployment smoke;
- bounded mutable-`dev` alias convergence;
- full runtime/API smoke on the mutable Development alias;
- no Production mutation.

Recovery remains manual `workflow_dispatch` only, defaults to `observe`, and `repair` requires exact current-`dev` SHA confirmation. Terminal and Production targets fail closed. Final documentation-synchronized Build 308 Development SHA: `d14a63c62913edf125a3e2bd8d69f110a6942dad`.

### Builds 306–307

- `functions/api/_lib/system-health-families.js` remains the semantics-free six-family observation authority: deployment, api, d1/database data plane, storage, authentication and providers.
- `functions/api/admin/system_health_families.js` remains GET-only and protected by `it.runtime.view`.
- `functions/api/_lib/system-health-readiness.js` remains the conservative GREEN/AMBER/RED interpretation layer.
- GREEN is direct evidence only; database/R2/provider configuration is not fabricated into transaction/object/provider acceptance.
- corrective guidance remains read-only/manual with `automatic: false`.

## Retained Finance / Production authority

Build 303 remains the accepted Production boundary at `09442c53d385aca7995150ace4bde55abd51d7df`.

Retained Development Finance authority includes:

- Build 300 Payments runtime extraction in `assets/admin-payments-v300.js`;
- Build 301 Reconciliation runtime extraction in `assets/admin-accounting-v301.js`;
- Build 302 fail-closed retired Statement Import boundary;
- Build 303 Tax Support runtime extraction in `assets/admin-tax-support-v303.js`;
- Build 304 accountant-export privacy/integrity authority;
- Build 305 exhaustive Finance-prefixed route/action authorization under the existing seven-action Finance vocabulary.

No later maintainability/acceptance build invents accounting/tax judgment or payment-provider transaction evidence.

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

Permanent rule: **role defines the maximum module set; a staff profile may narrow non-Admin access; a global module switch may make a module unavailable; workflow state decides whether an authorized module wakes.** Server authorization remains authoritative and dormant modules stay asleep.

## Retained business/runtime authority

- current Small/Mid/Oversized + condition/quote pricing authority remains unchanged;
- Complete remains **Best value**;
- Exterior Detail remains distinct from Premium Wash;
- current availability, conflict, deposit, checkout and payment mechanics remain authoritative;
- one meaningful H1 per indexable public page remains mandatory;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists;
- no automatic replay of ambiguous non-idempotent writes.

## Next autonomous build

**Build 311 — Inventory Operations maintainability extraction.**

Build 311 owns structural modularization of inventory, supplies, tools, consumption, reorder and kit administration. It must preserve current stock/accounting rules, API contracts, authorization and user-visible behavior. It must not pre-empt **Build 312 — Inventory data-integrity sweep** by making speculative data repairs.

The agreed continuation is:

- Build 311 — Inventory Operations maintainability extraction;
- Build 312 — Inventory data-integrity sweep;
- Build 313 — Catalog/Product Administration extraction;
- Build 314 — Media/Photo Studio reliability;
- Build 315 — Content/Socials maintainability extraction;
- Build 316 — SEO/Integration administration cleanup;
- Build 317 — DAIP privacy/cost/runtime audit;
- Build 318 — Whole-application route/API authority sweep;
- Build 319 — Runtime efficiency + CI consolidation.

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

## Documentation policy

`AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` are the two living authorities. `AUTONOMOUS_RELEASE_QUEUE.md` records the exact agreed Builds 300–319 execution order. Build summaries are release checkpoints; Git history remains the detailed archive.
