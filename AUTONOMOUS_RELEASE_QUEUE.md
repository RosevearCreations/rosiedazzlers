# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; the prior 378–385 phase remains historical context only.

## Accepted checkpoint

**Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal** is the accepted synchronized source and Production deployment/runtime boundary before the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding it in living prose.

## Current release

**Build 387 — Release Governance & Branch Protection Readiness** is the active bounded release.

Current scope:

- preserve the feature → `dev` → `main` exact-SHA release path and non-force fast-forward promotion rule;
- replace build-number-specific release assumptions with durable release-number-independent governance;
- make stale/advisory checks distinguishable from current blocking release authority;
- make GitHub branch/ruleset posture observable without pretending source documentation itself enforces hosted settings;
- define operator recovery for non-fast-forward, protected-branch, missing-check, stale-check and unobservable-protection conditions;
- keep GitHub-hosted platform protection fail-closed to AMBER when it is absent or cannot be observed;
- preserve schema, Production business data, R2, DNS, secrets and payment/provider mutation boundaries.

The candidate must pass Release Governance Authority, Current Source Gate, feature-preview acceptance and the retained source authorities before `dev` moves. Development must then pass exact-SHA deployment/runtime acceptance before `main` may move. Production promotion remains the same non-force fast-forward of the Development-GREEN SHA and is complete only after exact-SHA Production deployment/runtime/business acceptance.

## Next release

**Build 388 — Service, Add-On & Commercial Accuracy Convergence** is next only after Build 387 acceptance is complete. It will revisit package/add-on content and condition-based commercial language without inventing fixed economics where inspection is required.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success. GitHub-hosted branch/ruleset protection is a separately observable platform state and remains AMBER when absent or unproven.
