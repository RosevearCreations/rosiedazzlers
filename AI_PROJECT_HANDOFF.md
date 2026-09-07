# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Prior accepted Development checkpoint: **Build 351 — Staff Access Matrix** at exact SHA `2eb059b42d1097c1ebffa1bf6b1f9217dc9d9020`.
- Production `main`: deliberate **Build 349** promotion at exact SHA `48815644ed4f296345f995c73d71899b0c5a4fb8`.
- Active work: **Build 352 — DAIP Media Workflow Consolidation**.
- Active branch: `build352-daip-media-workflow-consolidation`.
- `main` must remain unchanged unless a later Production promotion is explicitly authorized.
- The current release introduces **no database migration**, no historical backfill and no Production business-data mutation.

## Why this release is active

Rosie already has separate mature authorities for Creative Projects, private DAIP media intake/review, content-package approval and approved-public Photo Studio management. The current release does not replace them. It converges their existing state into one explicit governed flow so we can see exactly why a project is or is not eligible to move from private evidence into deliberate approved-public image work.

The canonical path is:

**Creative Project → Private Media Intake → Evidence Review → Content Package → Approved-Public Photo Studio Handoff**

## Operating contract

- `creative_projects` remains the authority for project purpose, project consent, content-package status and explicit `public_publish_allowed` state.
- Existing DAIP private-media APIs/tables remain the authority for raw uploads, story-evidence selection, asset consent and processing-job health.
- Raw DAIP masters remain private. The current release does not copy raw media to public storage.
- The handoff manifest contains selected private asset IDs only; it contains no private R2 object keys or raw-media URLs.
- Public handoff is blocked unless the content package is `approved`, project consent is `approved_public`, public publishing is explicitly enabled, required before/after evidence is ready, processing problems are resolved, and every selected asset has approved-public consent.
- `admin-photo-studio.html` remains the authority for approved-public image metadata, upload/replacement and explicit website placement.
- Becoming handoff-eligible does **not** upload, publish, assign or replace a public image. It only enables deliberate navigation to Photo Studio.
- `functions/api/admin/daip_media_workflow.js` is read-only. Loading/refreshing it does not enqueue or start media processing.
- The workflow workspace has no polling interval or background retry timer.
- Existing private DAIP processing remains asleep unless an actual media job has already been explicitly created by its owning workflow.

## Durable authorities

- `admin-daip-media-workflow.html` — consolidated governed workflow/status workspace.
- `functions/api/admin/daip_media_workflow.js` — bounded read-only workflow convergence model.
- `admin-creative-projects.html` and Creative Project APIs — project/session/content-package authority.
- `admin-daip-media.html` and existing DAIP media APIs — private raw-media intake/review/processing authority.
- `admin-photo-studio.html` and existing Photo Studio APIs — approved-public image/placement authority.
- `app/daip/index.html` — DAIP module entry point with explicit current workflow link.
- `scripts/daip_media_workflow_audit.py` — privacy, consent, handoff and runtime source guard.
- `.github/workflows/daip-media-workflow-authority.yml` — focused current authority gate.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment and protected-route HTTP acceptance.

## Release procedure

1. Require the documentation-synchronized feature SHA to pass **DAIP Media Workflow Authority** plus retained Current Source/repository sanity authorities.
2. Confirm `dev` still equals or cleanly descends from accepted Development SHA `2eb059b42d1097c1ebffa1bf6b1f9217dc9d9020` and has not moved independently.
3. Fast-forward/synchronize `dev` only from the exact green feature SHA.
4. Require the focused DAIP authority, retained Current Source authority and Cloudflare Development acceptance on that exact synchronized `dev` SHA.
5. Call the current release Development GREEN only after those exact-SHA checks pass.
6. Keep `main` unchanged unless Production promotion is explicitly authorized.

## Next sequential scope

Do not invent the next numbered release from stale roadmap prose. After the current release is Development GREEN, re-read the current roadmap/execution authorities and choose the next bounded release from that live state.

## Restart point

If interrupted, start from `build352-daip-media-workflow-consolidation`, compare it against accepted Development SHA `2eb059b42d1097c1ebffa1bf6b1f9217dc9d9020`, and inspect **DAIP Media Workflow Authority** first. Do not create a second media library, second permission model, raw-public copy path, auto-publisher, polling loop, or background processing trigger to make the workflow appear green.
