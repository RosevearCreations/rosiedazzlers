# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries.

## Accepted Development checkpoint

Build 351 is the prior accepted Development source checkpoint at exact SHA `2eb059b42d1097c1ebffa1bf6b1f9217dc9d9020`.

Production `main` remains the deliberately promoted Build 349 package at exact SHA `48815644ed4f296345f995c73d71899b0c5a4fb8` and must remain unchanged unless a later Production promotion is explicitly authorized.

## Active — Build 352

Branch: `build352-daip-media-workflow-consolidation`

Scope: **DAIP Media Workflow Consolidation**.

Connect **Creative Project → Private Media Intake → Evidence Review → Content Package → Approved-Public Photo Studio Handoff** as one explicit governed flow. Reuse the existing DAIP and Photo Studio authorities instead of creating another upload, permission, storage, or publishing system.

### Acceptance checklist

- A single read-only Build 352 workflow model derives state from existing Creative Project, DAIP media, processing-job and content-package records.
- DAIP App exposes the consolidated governed workflow as a first-class entry point.
- Raw DAIP masters remain private and are never copied to a public destination by Build 352.
- Raw R2 object keys and raw URLs are excluded from the public-handoff manifest.
- At least one uploaded private asset must be explicitly selected before handoff can become eligible.
- At least one Creative Project session must be approved for story/content use.
- Required before/after evidence must be present when the project is a transformation story.
- Failed, blocked and dead-lettered media processing problems block public handoff.
- Creative Project content-package status must be explicitly `approved`.
- Project consent must be explicitly `approved_public`.
- `public_publish_allowed` must be explicitly enabled on the Creative Project.
- Every selected private asset must itself have `approved_public` consent.
- Photo Studio remains the approved-public image/placement authority.
- Passing the handoff gate only enables deliberate navigation to Photo Studio; it does not publish or assign anything automatically.
- Loading/refreshing the workflow starts no media processing job.
- No polling interval or automatic retry timer is introduced.
- `scripts/daip_media_workflow_audit.py` protects the authority/privacy/runtime boundaries.
- Focused **DAIP Media Workflow Authority** validates source syntax and convergence contracts.
- No database migration, historical backfill, payment/provider transaction, or Production business-data mutation.
- Feature branch must pass focused authority plus retained source/sanity gates before synchronizing `dev`.
- Exact synchronized `dev` SHA must pass retained current-source/DAIP authority and Cloudflare Development acceptance before Build 352 closes.
- Keep `main` unchanged unless Production promotion is explicitly authorized.

## Next

Do not assign Build 353 from stale roadmap text. After Build 352 is Development GREEN, re-read the current roadmap/execution authorities and choose the next bounded release from that live state.

## Continuing rule

Never start the next Rosie Dazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted Development SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
