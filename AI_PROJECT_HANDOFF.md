# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Prior fully accepted Development checkpoint: Staff API authority convergence at SHA `1b0a77b5fb6775ddc791e721a0335306f3b0aa18`.
- Production `main` remains at SHA `48815644ed4f296345f995c73d71899b0c5a4fb8` unless a deliberate Production promotion is authorized.
- Active work: **Build 351 — Staff Access Matrix**.
- Active branch: `build351-staff-access-matrix`.
- This release introduces **no database migration** and no business-data backfill.

## Why this release is active

Staff profile authority is now resilient and centralized, but an Administrator still needs one explicit view explaining effective module access. Build 351 adds that view without creating another permission system: each staff/module result is derived from the existing role ceiling, normalized profile grant, global runtime switch, profile active state and shared module resolver.

## Operating contract

- `functions/api/_lib/staff-list-handler.js` remains the canonical Staff profile/list authority.
- `assets/app-core/module-resolver.js` remains the canonical client-side role/profile/runtime resolver.
- `/api/admin/module_flags` remains the lightweight global module-switch authority.
- `admin-staff.html` and `assets/admin-staff-v309.js` render the read-only matrix from those authorities.
- Every internal module cell shows role ceiling, profile grant, global switch and effective access.
- Inactive staff profiles are shown as blocked.
- Administrator / Owner remains full-authority across all seven internal modules and retained management capabilities.
- Profile changes continue through Staff & Access; global switch changes continue through the I.T. module workspace.
- The matrix performs one explicit module-switch snapshot read and introduces no polling or background timers.
- The matrix loads no booking, inventory, finance, DAIP, analytics or other unrelated business dataset.
- No customer, booking, payment, provider, schema or Production business-data mutation is introduced.

## Durable authorities

- `admin-staff.html` — Staff workspace and matrix markup.
- `assets/admin-staff-v309.js` — Staff UI plus Build 351 effective-access matrix runtime.
- `assets/app-core/module-resolver.js` — shared role/profile/runtime access resolver.
- `functions/api/admin/module_flags.js` — global runtime module-switch authority.
- `scripts/admin_ui_audit.py` — protected Admin plus Staff/matrix source guard.
- `.github/workflows/staff-access-matrix-authority.yml` — focused Build 351 matrix authority gate.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment and protected-route HTTP acceptance.

## Release procedure

1. Require the documentation-synchronized feature SHA to pass Current Source Gate and Staff Access Matrix Authority plus retained focused authorities.
2. Fast-forward `dev` only if it still descends cleanly from accepted Development SHA `1b0a77b5fb6775ddc791e721a0335306f3b0aa18`.
3. Require Current Source Gate, Staff Access Matrix Authority, Staff API Authority and Cloudflare Development Acceptance on the exact promoted `dev` SHA.
4. Call Build 351 GREEN for Development only after those checks pass.
5. Keep `main` unchanged unless Production promotion is explicitly authorized.

## Next sequential scope

**Build 352 — DAIP Media Workflow Consolidation.** Connect Creative Project → Media Intake → Review → Content Package → Approved Public Asset as one explicit governed flow. Preserve private raw-media boundaries, require deliberate approval before public promotion, reuse existing DAIP/Photo Studio authorities, and avoid background processing unless a job actually requires it.

## Restart point

If interrupted, verify `build351-staff-access-matrix`, compare it to accepted Development SHA `1b0a77b5fb6775ddc791e721a0335306f3b0aa18`, and inspect the first failing matrix/source authority. Do not duplicate the module role-ceiling map inside Staff UI, do not introduce polling, and do not broaden a staff profile merely to make the matrix appear green.
