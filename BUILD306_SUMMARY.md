# Build 306 — I.T. Health Dashboard Extraction

**Development-only release**  
**Pre-documentation accepted SHA:** `fc3cf314f419c7b7209892262cc0cce8a7a0c61b`  
**Production/main remains:** Build 303 `09442c53d385aca7995150ace4bde55abd51d7df`

## Purpose

Build 306 extracts I.T. System Health into six independently observable diagnostic families without changing readiness policy, business rules, schema, provider behavior or Production.

The six release-family keys are:

1. `deployment`
2. `api`
3. `d1`
4. `storage`
5. `authentication`
6. `providers`

The historical queue uses the `d1` family key, but Rosie currently reports the configured application database accurately: Supabase when the Supabase service authority is present, D1 only when an actual `DB` binding is present, otherwise unconfigured.

## Implementation

- `functions/api/_lib/system-health-families.js` owns isolated observation collection and uses `Promise.allSettled` so one failed family does not suppress the others.
- `functions/api/admin/system_health_families.js` is GET-only, requires authenticated staff plus `it.runtime.view`, supports either all families or `?family=<family>`, and rejects mutation methods.
- `admin-system-health.html` is the standalone protected I.T. System Health surface.
- `assets/admin-system-health-v306.js` allows all-family and individual-family refresh without coupling failures.
- Provider observations reuse the existing integration registry and expose configuration-presence metadata only; no provider transaction/API call is made.
- Storage observations expose binding-name presence only; no object contents or credentials leave the server.
- Authentication observations expose role/admin authority only; staff email, staff IDs, tokens and session secrets are excluded.

## Deliberate Build 307 boundary

Build 306 is observation/extraction only. It does **not** assign GREEN/AMBER/RED state, distinguish expected degradation from defects, prescribe corrective mechanics, redesign notification semantics, or redefine readiness. Those responsibilities remain Build 307.

## Regression protection

- `scripts/build306_health_family_test.mjs` verifies six-family isolation, single-family addressing, accurate Supabase-vs-D1 reporting, and secret/staff-identity non-disclosure.
- `scripts/build306_release_check.py` protects the six-family contract, GET-only `it.runtime.view` authority, no-schema boundary and Build 307 semantic boundary.
- `scripts/build306_http_smoke.sh` verifies the deployed page, anonymous API fail-closed behavior and mutation rejection without making writes.
- Build 306 feature, Development source and Development runtime workflows retain Build 305 authority before accepting Build 306.

## Development acceptance

PR #37 merged the exact green feature head into `dev` at:

`fc3cf314f419c7b7209892262cc0cce8a7a0c61b`

On that exact SHA:

- Cloudflare Development Acceptance run `33699582911` completed successfully.
- The exact Cloudflare deployment was confirmed successful, Functions were attached, immutable deployment smoke passed, and the mutable Development alias converged and passed runtime/API smoke.
- The first Build 306 Runtime Acceptance attempt raced Cloudflare and received a `404` for the brand-new static page before deployment existed. Source validation had already passed.
- After Cloudflare exact-SHA acceptance completed, the same failed runtime job was rerun without any source change. Its Build 306 source validation and deployed read-only System Health smoke both passed.
- Final pre-documentation exact-SHA workflow queries returned zero failed, zero queued and zero in-progress runs.

No Build 306 source change was made to conceal the deployment-order race; the accepted implementation remained unchanged.

## Safety / authority boundary

Build 306 introduced:

- no database/schema migration;
- no accounting/tax-policy change;
- no booking/pricing/business-rule change;
- no real Stripe/PayPal/provider transaction;
- no provider secret disclosure;
- no Production data mutation;
- no Production promotion authority.

`main` must remain on accepted Build 303 unless a later release explicitly authorizes promotion.

## Next build

**Build 307 — I.T. readiness diagnostics upgrade** is next, but remains untouched until the documentation-synchronized Build 306 `dev` head passes its final exact-SHA source/runtime/Cloudflare acceptance.
