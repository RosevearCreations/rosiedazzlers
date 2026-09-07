# Build 352 — DAIP Media Workflow Consolidation

## Purpose

Build 352 connects the already-existing Rosie Dazzlers DAIP authorities into one explicit governed media path:

**Creative Project → Private Media Intake → Evidence Review → Content Package → Approved-Public Photo Studio Handoff**

The build deliberately does **not** create another upload system, another permission model, another media database, or an automatic publisher.

## What changed

- Added `functions/api/admin/daip_media_workflow.js` as a **read-only convergence model** over existing Creative Project, DAIP media, processing-job and content-package records.
- Added `admin-daip-media-workflow.html` as the bounded workflow/status workspace.
- Updated the DAIP app shell so the governed workflow is a first-class entry point.
- Added `scripts/daip_media_workflow_audit.py` and the focused **DAIP Media Workflow Authority** GitHub Actions gate.

## Public handoff requirements

Photo Studio handoff is available only when all of these agree:

1. A private uploaded DAIP asset has been explicitly selected.
2. At least one Creative Project session is approved for story/content use.
3. Required before/after evidence exists when the project is a transformation story.
4. Failed, blocked and dead-lettered processing problems are cleared.
5. The Creative Project content package is explicitly `approved`.
6. Project consent is explicitly `approved_public`.
7. `public_publish_allowed` is explicitly enabled on the Creative Project.
8. **Every selected media item** has `approved_public` consent.

Even after those gates pass, the workflow does not publish anything. It only enables navigation to the existing Photo Studio, where an approved public derivative/upload and explicit website placement remain deliberate staff actions.

## Privacy and runtime boundaries

- Raw DAIP media remains private.
- Raw object keys and raw URLs are not included in the handoff manifest.
- The handoff carries private asset identifiers only.
- The workflow endpoint performs reads only.
- Loading or refreshing the workflow does not enqueue processing.
- No polling interval or background retry timer is introduced.
- Photo Studio remains the approved-public image and placement authority.

## Database / Production boundary

- No schema migration.
- No historical backfill.
- No payment/provider mutation.
- No Production business-data mutation.
- `main` remains untouched until Development acceptance and a deliberate Production promotion decision.

## Acceptance

Build 352 must pass:

- `node --check functions/api/admin/daip_media_workflow.js`
- `python scripts/daip_media_workflow_audit.py`
- **DAIP Media Workflow Authority**
- retained Current Source / repository sanity authorities
- Cloudflare Development deployment/acceptance on the exact synchronized `dev` SHA before closure
