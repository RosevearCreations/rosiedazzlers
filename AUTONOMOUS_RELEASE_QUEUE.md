# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries.

## Accepted checkpoint

Development `dev` and Production `main` were deliberately synchronized at **Build 352** exact SHA `db2829fdd8e2d3e0ff8d7c418ad7bec56dd8eede` before the current release began.

## Active — Build 353

Branch: `build353-it-readiness-release-control`

Scope: **I.T. Readiness & Release Control**.

Extend the existing I.T. shell and canonical System Gate so an authorized operator can explicitly run one bounded readiness proof that identifies the current runtime branch/SHA, returns GREEN / AMBER / RED, classifies deployment/database/configuration/provider problems, and supplies a corrective action without exposing credentials or creating a second monitoring system.

### Acceptance checklist

- Existing `/app/it/` remains the canonical I.T. control/recovery workspace.
- Existing `/api/admin/system_gate` remains the canonical bounded runtime proof.
- Runtime branch and exact Cloudflare commit SHA are surfaced when available.
- GitHub exact-SHA checks remain the release authority and are not fetched by runtime with a GitHub token.
- Supabase proof is a minimal read only.
- Public and private R2 proofs are bounded list reads only.
- Stripe and PayPal configuration is represented by safe presence/mode state only.
- Secret values are never returned to browser code.
- Readiness state is GREEN / AMBER / RED with diagnostic category and corrective action.
- Production business-data mutation is closed from the readiness endpoint.
- Schema, R2, provider and deployment mutation are closed from the readiness endpoint.
- Loading I.T. starts no readiness test or provider action automatically.
- No polling/background readiness loop is introduced.
- Existing module-switch and notification-test controls remain explicit and separate.
- Focused **I.T. Readiness & Release Control Authority** validates source/security/runtime contracts.
- No database migration, historical backfill or Production business-data mutation is introduced by the release.
- Exact feature SHA must pass focused authority plus retained Current Source / Staff API / Staff Access / safety gates before synchronizing `dev`.
- Exact synchronized `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Production promotion is authorized only by fast-forwarding `main` to the same exact Development-GREEN SHA.
- Exact `main` SHA must pass Production Cloudflare deployment/checks before the release closes.

## Next

After the current release is GREEN on Production, re-read current source and begin the agreed Customer → Vehicle → Booking → Job → Completed Service → Maintenance-history convergence scope, extending existing identity/maintenance authorities rather than duplicating them.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through feature, Development and authorized Production promotion; keep database migrations as a separate acceptance boundary.
