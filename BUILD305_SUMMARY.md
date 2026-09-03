# Build 305 — Finance Authorization Sweep

**Status:** DEVELOPMENT CLOSED / PRODUCTION NOT AUTHORIZED  
**Recorded:** 2026-09-02  
**Accepted pre-documentation Development SHA:** `00571a39172052cbf42b2bec41ec25633803891b`  
**Accepted Production/main remains:** Build 303 `09442c53d385aca7995150ace4bde55abd51d7df`

## Purpose

Build 305 closes the Finance endpoint authorization-coverage gap without changing Finance business rules, accounting/tax policy, provider behavior, database schema, or the established seven-action Finance permission vocabulary.

## Authority added

- `functions/api/_lib/admin-finance-actions.js` is the centralized method-aware Finance admin route resolver.
- Current `accounting_*`, `payment_*`, and `payroll_*` admin routes are covered automatically.
- Finance reads require `finance.view`.
- Finance mutations resolve to the narrow existing action: `finance.post`, `finance.reconcile`, `finance.period.close`, `finance.refund.manage`, `finance.settlement.manage`, or `finance.tax.manage`.
- The Accountant role remains bounded to the Finance module and keeps its established defaults for all seven Finance actions.
- A disabled Finance module, an explicit per-action denial, or a non-Finance role ceiling still fails closed.
- Operations-owned quote/final-balance request lifecycle remains Operations authority; hosted final-balance checkout creation remains Finance settlement authority; booking-scoped operational Finance notes retain their existing booking-work authority.

## Regression protection

- `scripts/build305_finance_action_test.mjs` verifies representative route/action mappings plus role ceiling, module disable, explicit action narrowing, Admin authority, and Operations exceptions.
- The same test scans the actual admin API directory and proves every current Finance-prefixed file/method resolves to a Finance action. The accepted Build 305 tree covered **40 Finance files / 80 exported HTTP methods**.
- `scripts/build305_release_check.py` protects the unchanged seven-action vocabulary, centralized resolver, no-schema boundary, and exhaustive route coverage.
- `scripts/build305_http_smoke.sh` verifies anonymous Finance reads and representative posting/reconciliation/tax/refund/settlement mutations fail closed before route logic.
- Build 305 source and Development source/runtime workflows provide feature and exact Development acceptance.

## Historical guard convergence

Build 305 moved retained Finance mappings from inline admin middleware into the centralized resolver. Two historical focused guards were valid in intent but stale in location assumptions:

- Build 272 now follows the exact four retained refund/settlement leaves into the resolver only when delegation is present, while preserving all Operations, pricing, public clarity, T2125, SEO and documentation assertions.
- Build 290 now follows its retained `quote_deposit_refund_save -> finance.refund.manage` protection into the resolver only when delegated, while preserving staff-auth, authorization matrix, rollback, documentation and Production-closed assertions.

Neither repair weakens the historical action requirement.

## Development acceptance evidence

On exact pre-documentation Development SHA `00571a39172052cbf42b2bec41ec25633803891b`:

- the full workflow fan-out finished with **0 failed, 0 queued, and 0 in-progress runs**;
- Build 305 source and runtime acceptance were green;
- the canonical cumulative Development source authority was green after the Build 272/290 forward-compat repairs;
- Cloudflare Development Acceptance run `33697631645` completed successfully;
- exact Cloudflare deployment `467003c1-6d58-48f3-8d9b-1aea116bb107` reached `success`;
- the exact deployment reported `uses_functions=true`;
- immutable deployment static smoke passed at `https://467003c1.rosiedazzlers.pages.dev`;
- `https://dev.rosiedazzlers.pages.dev` passed the full static + dynamic/API smoke and converged on attempt 1/12.

Final Build 305 closure requires the same clean exact-SHA source/runtime/Cloudflare acceptance after this documentation synchronization is merged to `dev`.

## Explicit non-changes

Build 305 introduces:

- no database/schema migration;
- no new Finance action or role default;
- no accounting/tax judgment;
- no pricing/booking business-rule change;
- no real Stripe/PayPal payment, settlement, refund, webhook, or delivery acceptance claim;
- no Production data mutation.

## Production boundary

**Build 305 has no Production promotion authorization. Do not move `main`.** Production remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df` unless a later deliberate promotion is separately authorized and accepted.

## Next build

After documentation-synchronized Build 305 Development acceptance is fully green, the next autonomous item is **Build 306 — I.T. Health dashboard extraction**. It is a maintainability extraction: modularize the I.T./System Health runtime so deployment, API, D1, storage, authentication, and provider readiness can be tested independently. GREEN/AMBER/RED readiness semantics and corrective-mechanic upgrades belong to Build 307, not Build 306.
