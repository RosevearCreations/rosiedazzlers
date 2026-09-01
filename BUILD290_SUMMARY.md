# Rosie Dazzlers Build 290 — Authorization Acceptance + Forward-Restore Readiness

**Status:** Development candidate  
**Baseline:** accepted Build 289 Development SHA `4464e758e02332138bca039149ecbb9ff475988c`  
**Accepted Build 289 tree:** `a4e279eae6cb7136d309278b568fa5769a70d796`  
**Production:** remains on accepted Build 288 unless separately authorized

Build 290 deepens the existing staff authorization/reliability model. It does not introduce new roles, pricing, booking, payment, maintenance, fleet or database authority.

## Authorization acceptance

- The existing role/module/action model remains authoritative.
- A new executable action matrix proves role ceilings, module narrowing, explicit action allow/deny behavior and 403 denial behavior.
- Anonymous direct requests to representative Operations, quote and Finance APIs must fail closed before mutation/action disclosure.
- Protected admin direct URLs remain static `noindex` shells; customer/business records are fetched only after authenticated API access.
- Unexpected shared staff-auth failures no longer return raw exception text. The browser receives the generic `Staff authorization service unavailable.` response while server logs retain diagnostic context.

## Provider configuration sign-off

The owner confirmed on 2026-09-01 that PayPal, Stripe and the other configured providers are already present in the Cloudflare Development environment. Build 290 records this as **Development configuration-present / owner sign-off**. It is not a fabricated claim that a real Stripe charge, PayPal sandbox transaction, webhook settlement or provider-side acceptance test has occurred.

## Restore / rollback readiness

Build 290 uses a non-destructive **forward restore commit** if Development needs to return to the accepted Build 289 source tree. We do not rewind `dev`, force-push, or move Production `main`.

The canonical procedure is `BUILD290_ROLLBACK.md`, checked by `scripts/build290_rollback_check.py`. Build 290 itself performs no rollback.

## Validation

- `scripts/build290_action_permission_test.mjs`
- `scripts/build290_rollback_check.py`
- `scripts/build290_release_check.py`
- `scripts/build290_http_smoke.sh`
- `.github/workflows/build290-source-gate.yml`
- `.github/workflows/build290-development-acceptance.yml`
- cumulative Development Source Gate through Build 290
- existing full Cloudflare Development acceptance

## Boundary

There is **no schema migration** in Build 290. No payment-provider transaction authority or acceptance evidence is fabricated. No maintenance/fleet/referral economics are introduced.

**Production remains closed for Build 290** until an accepted Development SHA is deliberately promoted.
