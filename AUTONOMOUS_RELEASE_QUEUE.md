# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and release summaries. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 376 — Performance, Accessibility & Security Hardening** is the accepted synchronized source and Production deployment boundary before the current release begins. It preserved public cache performance, added accessibility and response-hardening baselines, kept private/cookie-bearing responses fail-closed, and retained the exact-SHA Development-before-main release discipline.

## Current release

**Build 377 — Production Business Acceptance / Launch Readiness** is the active bounded release.

Current scope:

- converge the existing acquisition, booking, payment, customer/vehicle, staff-work, completion/proof, final-finance, genuine-review, rebook/retention, maintenance and fleet authorities into one launch-readiness matrix;
- require rollback/recovery and performance/accessibility/security authorities as launch conditions;
- add read-only Cloudflare Production acceptance that requires the exact `main` SHA, Production environment, successful deployment and Functions metadata;
- smoke the immutable exact deployment and canonical Production runtime without deploying, retrying, deleting, rolling back or mutating business/provider data;
- keep real customer, provider, consent, review and accounting evidence distinct from software acceptance evidence;
- remain schema-neutral.

The exact candidate SHA must pass the focused business-acceptance authority, Current Source Gate and feature preview before Development promotion. Development must pass its retained runtime gates on the same SHA before `main` may move. The `main` push is complete only when the exact Production deployment/runtime authority also passes.

## Next release

**Build 378 — Release Authority & Documentation Convergence** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.
