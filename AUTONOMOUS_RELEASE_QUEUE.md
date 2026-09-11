# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 378 — Release Authority & Documentation Convergence** is the accepted synchronized source and Production deployment boundary before the current release begins. Its durable release-number-independent exact-SHA authority keeps the living release documents aligned with the actual Production boundary and preserves read-only Cloudflare deployment/runtime proof.

## Current release

**Build 379 — Production Observability & Self-Diagnostics** is the active bounded release.

Current scope:

- make `/admin/it.html` the definitive authenticated operator view for deployment and runtime health;
- classify failures as `source`, `build`, `deploy`, `configuration`, or `runtime` instead of collapsing them into a generic failure;
- expose bounded read-only checks for Pages deployment/build identity, Supabase, R2/media, staff authorization and critical API runtime;
- report Stripe and PayPal configuration presence/readiness without revealing sensitive values or creating provider transactions;
- show corrective instructions for degraded/failed checks;
- prohibit permanent polling, subrequest storms, schema changes and business/provider mutation.

The exact candidate SHA must pass the focused observability authority and retained source/feature gates before Development promotion. Development must pass retained runtime gates on the same SHA before `main` may move. A `main` push is complete only when the durable exact-SHA Production deployment/runtime authority passes on that same SHA.

## Next release

**Build 380 — Booking Recovery & Failure Handling** is next after the current release. Its durable scope and the subsequent approved sequence are preserved in `FORWARD_BUILD_ROADMAP_378_385.md`.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.
