# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The active forward sequence is `FORWARD_BUILD_ROADMAP_386_395.md`; the prior 378–385 phase remains historical context only.

## Accepted checkpoint

**Build 385 — Backup, Restore & Release Recovery Drill** is the accepted synchronized source and Production deployment boundary before the current release begins. Its observation-only recovery evidence and exact-SHA release protections remain retained authorities, but it is no longer the active planning surface.

## Current release

**Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal** is the active bounded release.

Current scope:

- close the completed 378–385 phase without rewriting its historical evidence;
- resolve the accepted baseline from live synchronized Git refs and exact-SHA workflow evidence rather than embedding a commit identity in living prose;
- move the living handoff, queue, README and release-convergence authority onto a new bounded 386–395 roadmap;
- re-baseline the Development/go-live blocker document so it no longer points to obsolete legacy planning authority;
- retire prior recovery-only workflow coupling from normal `dev`/`main` pushes while preserving the recovery runbook and retained rollback/recovery authorities;
- establish a focused current-release source authority that fails closed if accepted/current/next release state, roadmap ownership or release rules drift;
- keep the release documentation/authority focused with no database migration, Production business-data mutation, R2 write/delete, DNS mutation, secret rotation, customer charge/refund or provider mutation.

The exact candidate SHA must pass the focused current-release authority, Current Source Gate and feature-preview acceptance before Development promotion. Development must pass retained runtime/deployment gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after the exact-SHA Production deployment/runtime authority and retained Production business-path authority pass.

## Next release

**Build 387 — Release Governance & Branch Protection Readiness** is next after the baseline renewal is accepted. It will harden branch/release governance around the proven feature → `dev` → `main` path, verify protection/readiness evidence fail-closed, and avoid introducing business-data or provider mutation merely to enforce release discipline.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.