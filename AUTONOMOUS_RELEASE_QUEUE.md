# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 387 — Release Governance & Branch Protection Readiness** is the active bounded release.

Current scope:

- preserve exact-SHA candidate validation and non-force fast-forward promotion to `dev`;
- use the active `rd main protection` pull-request boundary for Production source promotion;
- distinguish the exact accepted Development SHA from the resulting exact protected-`main` Production SHA while retaining clear ancestry between them;
- replace build-number-specific release assumptions with durable release-number-independent governance;
- make stale/advisory checks distinguishable from current blocking release authority;
- define operator recovery for non-fast-forward, protected-branch, missing-check, stale-check and unobservable-protection conditions;
- preserve schema, Production business data, R2, DNS, secrets and payment/provider mutation boundaries.

The candidate must pass Release Governance Authority, Current Source Gate, feature-preview acceptance and retained source authorities before `dev` moves. Development must then pass exact-SHA deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head.

## Next release

**Build 388 — Service, Add-On & Commercial Accuracy Convergence** is next only after current-release acceptance is complete. It will revisit package/add-on content and condition-based commercial language without inventing fixed economics where inspection is required.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.
