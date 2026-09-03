# Build 307 — I.T. Readiness Diagnostics Upgrade

**Development status:** technically accepted before documentation synchronization  
**Accepted pre-documentation Development SHA:** `069bb7d7bff9c1f50974b7018634e16594907c61`  
**Production/main:** unchanged at accepted Build 303 `09442c53d385aca7995150ace4bde55abd51d7df`  
**Production promotion authority:** none

## Scope closed

Build 307 layers evidence-scoped readiness diagnostics over the six isolated Build 306 System Health observations. It does not replace the raw Build 306 observation contract and does not perform provider, database, storage, authentication-configuration, pricing, booking, Finance, or Production mutations.

The new readiness contract is `rosie_it_readiness_diagnostics_v1` and uses three visible states:

- **GREEN** — this diagnostic directly proved the stated runtime condition;
- **AMBER** — configuration/authority is present but live transaction/object/provider acceptance is deliberately separate evidence, or the feature is optional;
- **RED** — a required local authority is missing or the family observation itself failed.

Configuration presence is explicitly **not** transaction acceptance. Supabase/D1 configuration, an R2 binding, Stripe/PayPal/notification/social configuration, or similar provider presence cannot be promoted into a claim that a database transaction, object operation, payment, webhook, delivery, publishing action, or external API transaction succeeded.

## Implementation authority

- `functions/api/_lib/system-health-readiness.js` — Build 307 readiness normalizer, evidence classes, transaction-acceptance field, diagnostic codes and read-only/manual corrective guidance.
- `functions/api/admin/system_health_families.js` — still GET-only, `it.runtime.view` protected, now returns the raw Build 306 observations plus Build 307 diagnostics.
- `admin-system-health.html` — protected GREEN/AMBER/RED System Health surface with the evidence boundary stated directly in the UI.
- `assets/admin-system-health-v307.js` — versioned dashboard runtime showing state, code, evidence class, transaction status and corrective guidance per family.
- `scripts/build306_release_check.py` — forward-compatible retained guard: the raw Build 306 helper must remain semantics-free while the page may consume the Build 307 successor runtime.
- `scripts/build307_readiness_diagnostics_test.mjs` — deterministic semantic/privacy test.
- `scripts/build307_release_check.py` — Build 307 no-schema, no-provider-call, privacy and readiness-contract source guard.
- `scripts/build307_http_smoke.sh` — anonymous/read-only deployed boundary smoke.
- Build 307 feature, Development source and Development runtime workflows protect the new boundary.

## Readiness semantics

- Deployment: GREEN when running Pages identity metadata is directly observed; otherwise AMBER rather than a fabricated failure.
- API: GREEN when the protected Pages Functions route itself executes successfully.
- Database/data plane (`d1` historical family key): AMBER when Supabase or an actual D1 binding is configured because this diagnostic performs no database transaction; RED when no supported database authority is configured.
- Storage: AMBER when the Rosie R2 binding exists because no object read/write/list/delete is performed; RED when the required binding is absent.
- Authentication: GREEN only when the protected request resolves authenticated staff and passes `it.runtime.view`; RED otherwise.
- Providers: AMBER for configuration-only or optional/missing configuration; provider configuration never counts as transaction acceptance.

Corrective actions are guidance only: `automatic: false`. The dashboard does not silently edit Cloudflare, Supabase, R2, Stripe, PayPal, auth, notification, or social configuration.

## Validation evidence

Feature head `7b67f54efdaac27ae06ffab7cf331602168bad0e` passed Build 307 Source Gate run `33701294843` before PR #39 was merged.

PR #39 merged the exact green feature head into `dev`, producing accepted pre-documentation candidate `069bb7d7bff9c1f50974b7018634e16594907c61`.

On that exact SHA:

- Build 307 Development Source Gate run `33701368432`: **SUCCESS**.
- Cloudflare Development Acceptance run `33701368256`: **SUCCESS**.
- Exact Cloudflare deployment: `c6696a18-964d-4f3b-a540-335ff1665b9e`.
- The exact deployment reached `success`, reported `uses_functions=true`, and passed immutable static smoke at `https://c6696a18.rosiedazzlers.pages.dev`.
- The Development alias passed the full static + dynamic/API smoke on convergence attempt 1/12.
- Build 307 Development Runtime Acceptance run `33701368524` initially executed before Cloudflare convergence; exact source validation passed but the new v307 static identity was not yet available. After Cloudflare exact-SHA acceptance, the same job was rerun without source changes and both exact source validation and the deployed read-only readiness smoke passed.
- Final exact-SHA queries returned **0 failed, 0 queued, 0 in-progress** workflow runs.

## Boundaries retained

Build 307 adds no schema/database migration, provider transaction, payment/refund/settlement action, accounting/tax judgment, pricing/booking business rule, external delivery/publishing proof, or Production data mutation. Secrets, staff email/IDs and raw provider credentials remain excluded.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Do not move `main` for Build 307.**

## Next autonomous build

**Build 308 — Cloudflare deployment/recovery consolidation.** Integrate the proven exact-SHA Development deployment/recovery path into normal release tooling and remove redundant recovery mechanics without weakening immutable deployment evidence, mutable alias convergence, rollback/promotion boundaries, or Production safety.

Build 308 remains untouched until the documentation-synchronized Build 307 `dev` head completes final exact-SHA source/runtime/Cloudflare acceptance.
