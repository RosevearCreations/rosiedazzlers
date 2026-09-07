# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Accepted Development and Production checkpoint: **Build 352 — DAIP Media Workflow Consolidation** at exact SHA `db2829fdd8e2d3e0ff8d7c418ad7bec56dd8eede`.
- `dev` and `main` were synchronized on that exact accepted SHA before the current release started.
- Active work: **Build 353 — I.T. Readiness & Release Control**.
- Active branch: `build353-it-readiness-release-control`.
- The current release introduces no database migration, historical backfill or Production business-data mutation.
- Production promotion is explicitly authorized for the current release only after the exact feature SHA is Development GREEN.

## Why this release is active

Rosie already has a mature I.T. shell and bounded System Gate. The current release does not create a second health or deployment system. It extends those existing authorities so one operator-facing workspace can identify the running branch/SHA, classify readiness GREEN / AMBER / RED, distinguish deployment/database/configuration/provider problems, and explain the safe correction without exposing credentials.

## Operating contract

- `app/it/index.html` remains the I.T. control/recovery workspace.
- `functions/api/admin/system_gate.js` remains the canonical bounded runtime readiness endpoint.
- The readiness gate runs only when an authorized operator explicitly selects it.
- Loading the I.T. app starts no readiness request, provider test, deployment action or background monitoring loop.
- Runtime branch and commit SHA come from Cloudflare Pages runtime metadata when available.
- GitHub exact-SHA checks remain the source/release authority. Runtime does not need or expose a GitHub token.
- Supabase and R2 checks are bounded reads only.
- Provider configuration is reduced to safe presence/mode state; secret values are never returned.
- Production business-data mutation, schema mutation, R2 mutation, provider mutation and deployment mutation are closed from the readiness endpoint.
- Existing module switches and notification tests remain explicit operator controls and are not executed by the readiness gate.

## Durable authorities

- `app/it/index.html` — I.T. readiness and release-control workspace.
- `apps/it/it-app.js` — explicit operator-driven rendering and diagnostics.
- `functions/api/admin/system_gate.js` — canonical bounded readiness model.
- `scripts/it_readiness_release_control_audit.py` — source/security/runtime contract guard.
- `.github/workflows/it-readiness-release-control-authority.yml` — focused current authority gate.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Release procedure

1. Require the documentation-synchronized feature SHA to pass the focused I.T. authority plus retained Current Source, Staff API, Staff Access and repository safety authorities.
2. Confirm `dev` still equals the accepted checkpoint and has not moved independently.
3. Fast-forward `dev` only to the exact tested feature SHA, with no merge/squash SHA.
4. Require that exact synchronized `dev` SHA to pass the Development deployment/HTTP acceptance set.
5. Only after Development is GREEN, confirm `main` still cleanly fast-forwards from the accepted checkpoint.
6. Fast-forward `main` to the exact same tested SHA because Production promotion is authorized for this release.
7. Require Production Cloudflare deployment and exact-SHA checks to complete successfully before calling the release Production GREEN.

## Next sequential scope

After the current release closes, use the agreed roadmap sequence and re-read the live source before starting the Customer → Vehicle → Booking → Job → Completed Service → Maintenance-history convergence scope. Do not duplicate existing vehicle-identity or maintenance authorities.

## Restart point

If interrupted, start from `build353-it-readiness-release-control`, compare it against accepted SHA `db2829fdd8e2d3e0ff8d7c418ad7bec56dd8eede`, and inspect **I.T. Readiness & Release Control Authority** first. Do not expose secrets, add runtime GitHub credentials, introduce polling, or mutate Production merely to make a readiness card appear green.
