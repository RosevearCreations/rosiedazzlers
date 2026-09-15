# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_396_405.md`; prior phases remain historical context only.

## Accepted checkpoint

The accepted synchronized source and Production deployment/runtime checkpoint immediately precedes the current release. Resolve its exact identity from live `dev`/`main` refs and exact-SHA workflow evidence rather than embedding historical release identities in living prose.

## Current release

**Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening** is the active bounded release.

Current scope:

- preserve the retained Build 380 tab-scoped booking recovery contract and canonical checkout authority;
- expose honest offline/weak-connection status without presenting local state as accepted server state;
- allow bounded retry only for safe read methods (`GET`/`HEAD`), never automatic replay of business mutations;
- provide protected `sessionStorage` draft helpers that reject password, payment, provider-token, secret, authorization and file fields;
- expose explicit duplicate-submit locking for caller-owned mutation controls without creating a second mutation authority;
- expose upload progress/failure/manual-retry state without background upload replay;
- label partial-result views when complete evidence is unavailable;
- require restored workflows to surface stale-condition review before proceeding when authoritative evidence may have changed;
- remain schema-neutral and source-only with no Production business-data, payment/provider, accounting/inventory, consent, customer, or destructive R2 mutation.

The candidate must pass the focused Error Recovery/Weak-Connection/Reliability authority, retained authorities, Current Source Gate and feature-preview acceptance before `dev` moves. `dev` then advances by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance. Production promotion must proceed by pull request into protected `main`, satisfy `rd main protection` including `source checks`, and then receive exact-SHA **Production deployment/runtime/business acceptance** on the resulting `main` head. Missing required checks or exact Production runtime/deployment identity are blockers rather than permission to infer success.

## Next release

**Build 405 — Production Hardening, Consolidation & Next-Roadmap Renewal** is next only after the current release is fully accepted on protected `main` and exact Production evidence is GREEN.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested candidate through a non-force fast-forward to Development, respect protected-main pull-request requirements, and treat the resulting `main` head as the exact Production SHA to be independently accepted. Database migrations remain separate acceptance boundaries.
