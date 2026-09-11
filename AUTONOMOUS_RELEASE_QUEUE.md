# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 377 — Production Business Acceptance / Launch Readiness** is the accepted synchronized source and Production deployment boundary before the current release begins. The accepted path proved the coherent acquisition-to-retention business authority plus read-only Cloudflare exact-SHA Production deployment identity, immutable deployment smoke and canonical Production runtime smoke. Missing deployment identity remains fail-closed rather than inferred.

## Current release

**Build 378 — Release Authority & Documentation Convergence** is the active bounded release.

Current scope:

- converge `AI_PROJECT_HANDOFF.md`, this queue, README and branch/release guidance to the actual accepted Production boundary;
- convert the Production business/exact-SHA workflow from a one-release launcher into a durable release-number-independent authority;
- require living release documents to agree on accepted/current/next state without embedding stale commit SHAs;
- retain read-only exact-SHA Cloudflare Production identity, Functions metadata, immutable deployment smoke and canonical runtime smoke;
- add a durable convergence guard to the Current Source Gate;
- remain schema-neutral and perform no provider, customer, accounting or Production business-data mutation.

The exact candidate SHA must pass the focused convergence authority, Current Source Gate and feature preview before Development promotion. Development must pass retained runtime gates on the same SHA before `main` may move. A `main` push is complete only when the durable exact-SHA Production deployment/runtime authority also passes.

## Next release

**Build 379 — Production Observability & Self-Diagnostics** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.
