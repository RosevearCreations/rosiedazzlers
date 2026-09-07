# Build 353 — I.T. Readiness & Release Control

## Scope

Build 353 extends the existing Build 348 I.T. control plane instead of introducing a second readiness system. The canonical `/api/admin/system_gate` remains the bounded runtime proof and `/app/it/` remains the staff-facing control surface.

## What changed

- The I.T. workspace is now explicitly **I.T. Readiness & Release Control**.
- The System Gate reports Cloudflare runtime branch, exact commit SHA and environment classification when available.
- The gate returns a GREEN / AMBER / RED traffic-light state derived from bounded runtime blockers and warnings.
- Readiness findings are categorized as deployment, database, configuration or provider issues and include a corrective action.
- Configuration status reports presence/mode only for Supabase, public R2, private DAIP R2, Stripe and PayPal; secret values are never returned.
- GitHub exact-SHA checks remain the release authority. Runtime does not fetch GitHub CI status and requires no GitHub token.
- Release control explicitly records that Production business-data mutation, schema mutation, R2 mutation, payment-provider mutation and deployment mutation are closed from the readiness endpoint.
- Existing module switches and explicit notification tests remain separate operator-initiated controls.

## Runtime contract

The readiness gate is invoked only by the operator. Opening I.T. does not run it automatically. The gate performs bounded read-only proofs only and introduces no polling/background loop.

The release adds no database migration, historical backfill, storage write, provider transaction or Production business-data mutation.

## Acceptance

The exact feature SHA must pass:

- **I.T. Readiness & Release Control Authority**
- **Current Source Gate**
- retained Staff API / Staff Access / repository safety authorities

After synchronization, that same exact SHA must pass Development deployment/HTTP acceptance before promotion. Production promotion must preserve the exact tested SHA and must pass the Production Cloudflare deployment/check set before the release is called Production GREEN.
