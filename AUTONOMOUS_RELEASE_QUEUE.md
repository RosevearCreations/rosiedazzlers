# Rosie Dazzlers — Autonomous Development Queue

This living queue records only the current bounded release path. Completed implementation history belongs in Git history and workflow evidence. Active forward authority: `FORWARD_BUILD_ROADMAP_405_415.md`.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. It retains Build 405 authority; resolve exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding commit identities here.

## Current release

**Build 406 — Go-Live Evidence & Provider Readiness Convergence** is the active bounded release.

Scope:

- converge `STARTUP_GO_LIVE_BLOCKERS.md` into the current `/admin/it.html` readiness surface;
- classify evidence as `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, or `unavailable`;
- preserve unavailable ≠ automatic failure and never infer provider success from configuration presence;
- keep `/api/admin/go_live_readiness` authenticated, bounded, GET/HEAD-only and mutation-free;
- retain `/api/admin/production_diagnostics` for deeper troubleshooting;
- preserve exact feature → Development → protected-main PR → exact Production acceptance;
- keep schema, destructive R2, payment/provider, accounting/inventory, customer, outreach and booking mutations outside this release.

Current contract: `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`.
Retained capstone: `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`.

The candidate must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass Development deployment/runtime acceptance. Promotion proceeds through `rd main protection` and a pull request to protected `main`; Production deployment/runtime/business acceptance is independent of source promotion. Missing required checks or exact Production runtime/deployment identity are blockers.

## Next release

**Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** is next only after the current release is independently GREEN on protected `main`. Controlled provider evidence/mutation requires its own explicit authority.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and provider/business mutations remain separate explicit acceptance boundaries.
