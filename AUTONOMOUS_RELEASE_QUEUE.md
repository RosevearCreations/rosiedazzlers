# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 391 — Photo Studio & R2 Media Reliability** is the active bounded release.

Current scope:

- keep the existing managed photo library as the single public media authority rather than creating a parallel image store;
- allow one approved public image to serve multiple placements while keeping each target assignment independently resettable;
- model Before/After placement metadata explicitly and reject the same managed photo on both sides of a pair;
- make remove/reset/unassign deactivate the placement without deleting the underlying R2 asset;
- permit destructive Photo Studio deletion only through the explicit delete route after active assignments and Gallery Before/After references are proven absent;
- restrict public Photo Studio listing, assignment and manifests to approved public R2 prefixes so private DAIP/customer/job evidence cannot enter public placements;
- keep ordinary admin/public reads database-backed and mutation-free; R2 enumeration occurs only through explicit prefix-bounded sync with cursor continuation;
- fail safely when the public R2 binding or media schema is unavailable rather than scanning, deleting or inventing fallback state;
- remain schema-neutral and avoid database migration, Production R2 mutation, DNS/secrets changes, customer charging/refunding, provider mutation or Production business-data mutation during source release.

The candidate must pass the focused Photo Studio R2 Reliability Authority, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by **non-force fast-forward** to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA Production deployment/runtime/business acceptance on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 392 — Retention, Maintenance & Fleet Commercial Activation** is next only after current-release acceptance is complete. It will activate the already-established retention, maintenance and fleet authorities using approved business rules while keeping recurring billing, discounts, route economics, fleet pricing and automated outreach evidence-gated.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production identity to be independently accepted. Database migrations remain separate acceptance boundaries.
