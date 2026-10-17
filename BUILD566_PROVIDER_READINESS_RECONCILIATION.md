# Build 566 — Production Provider Credential Readiness & Deployment Backlog Reconciliation

**Scope:** bounded, read-only planning and verification. This release adds an auditable requirements manifest and a fail-closed status evaluator. It does **not** activate live adapters, send provider requests, read or write secret values, execute migrations, or mark any private media as publicly publishable.

**Release order:** Builds 562, 563, 564 and 565 must first independently reach protected `main` with exact-commit successful Cloudflare Production deployment and runtime/business checks. Build 566 was explicitly requested as next, but its implementation is isolated on a branch stacked after Build 565. No shortcut around predecessors.

## Credential inventory — names only

The Build 564 server-side contract lists these required production secrets/configuration names:
- `DAIP_WORKER_IDENTITY_PROVIDER_URL` — authorized worker identity service endpoint
- `DAIP_WORKER_IDENTITY_PROVIDER_TOKEN` — server-only worker provider credential
- `DAIP_CONSENT_PROVIDER_URL` — consent-verification service endpoint
- `DAIP_CONSENT_PROVIDER_TOKEN` — server-only consent API credential
- `DAIP_LEDGER_AUTHORITY_REFERENCE` — reviewed server-side evidence authority label
- `SUPABASE_URL` — approved private ledger project endpoint
- `SUPABASE_SERVICE_ROLE_KEY` — secret service-role credential, never public/browser/preview-shared

**Provider sourcing:** the actual worker and consent providers and their API formats have NOT been selected or verified. Their dashboard/API credential steps therefore cannot yet be truthfully supplied. Owner first selects each compatible provider and verifies cost, scopes, retention, signing and consent revocation endpoints. Supabase URL and service role key are obtained from the *approved project's* Supabase Dashboard > Project Settings > API (labels may differ). Never copy a service-role key into GitHub Issues, Slack or a chat message. Configure environment-scoped secrets in Cloudflare Pages project settings > Variables and Secrets, separating Preview and Production. Restrict access and rotate exposed keys.

**Security:** declaring an environment variable name is NOT proof that a credential is configured or usable. Runtime provider calls, worker signature/key registration, current non-revoked derivative-scoped consent, and supervised human acceptance each require independently reviewed records.

## Migration review and HOLD

1. Build 562 SQL: `sql/2026-10-15_build562_private_acceptance_ledger.sql` — append-only RLS ledger with scoped idempotency.
2. Build 564 SQL: `sql/2026-10-15_build564_atomic_private_acceptance_rpc.sql` — atomic insertion/replay RPC dependent on 562.
3. Confirm the actual approved Supabase project, current schema, explicit backup/recovery and rollback strategy, permission grants, RLS, no-update/delete trigger, duplicate replay/conflict tests, and separated staging-first approval.
4. Do **not** execute these SQL files or use a service key until the owner approves a concrete plan. The presence of files in Git has no schema effect.

## Required external proof before owner acceptance

- Independently authenticated worker provider call, registered signing key and verified source-bound receipt.
- Independently authenticated consent provider call, signature/current derivative scope, revocation and expiry rejection.
- Approved 562/564 migrations applied to the correct environment, with schema/RLS/append-only and recovery evidence.
- Verified atomic duplicate replay, conflict rejection and correct server-derived evidence digest.
- Exact GitHub main SHA matched by successful Cloudflare Production deployment and live runtime/business smoke.
- Authenticated operator private-media review, explicit approval and evidence trace.
- Confirm no automatic worker dispatch, publication, export, charge, booking or consent-state mutation.

The provided Build 566 program only returns missing declaration names and *unverified* operator evidence topics. It never outputs runtime READY or clears publishing HOLD. Externally supplied flags/claims are not trusted verification.

## Operator decision packet

**Code/CI READY** requires exact branch tests plus feature preview. **Development READY** requires independently checked `dev` SHA and deployment. **Production code GREEN** requires protected-main PR, required CI, matching Cloudflare deployment and runtime/business checks. **Provider/ledger operational acceptance remains HOLD** until all real external proof and owner approvals above are obtained. Distinguish these outcomes explicitly; a green source/deployment does not mean provider acceptance.

**Next decision:** owner selects trusted worker and consent providers, approves credential scopes and costs, reviews migration application/recovery; otherwise retain HOLD and queue a separately approved integration build. Hybrid pricing/quote-first redesign is excluded from this release.

Regression: `node scripts/daip_provider_readiness_566_test.mjs`. GitHub Issue #359 is the tracked release planning record.
