# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries.

## Accepted synchronized checkpoint

The prior Staff API authority release is Development GREEN at exact SHA `1b0a77b5fb6775ddc791e721a0335306f3b0aa18`. Production `main` remains at SHA `48815644ed4f296345f995c73d71899b0c5a4fb8` unless a deliberate Production promotion is authorized.

## Active — Build 351

Branch: `build351-staff-access-matrix`

Scope: **Staff Access Matrix / Effective Module Authority Visibility**.

Build 351 adds one read-only Administrator matrix showing why each staff profile can or cannot access each internal Rosie module. It consumes the canonical Staff response and shared application module resolver; it does not create another permission model.

### Acceptance checklist

- Staff Access Matrix is visible in `admin-staff.html`.
- Every staff/module cell shows role ceiling, profile grant, global switch and effective access.
- Inactive profiles are visibly blocked from effective access.
- Shared `assets/app-core/module-resolver.js` calculates role/profile/runtime access.
- The Staff UI does not duplicate the canonical role/module ceiling map.
- Global module availability comes from the existing `/api/admin/module_flags` authority.
- I.T. remains locked on as the recovery/control module.
- Administrator / Owner remains full-authority across all seven internal modules and retained management capabilities.
- Matrix is read-only; Staff profile edits remain in Staff & Access and global switch edits remain in I.T.
- One explicit module-switch snapshot read is permitted; no polling or background timer is introduced.
- No booking, inventory, finance, DAIP, analytics or other unrelated business-data endpoint is introduced by the matrix.
- `scripts/admin_ui_audit.py` guards matrix authority and dependency boundaries.
- Focused Staff Access Matrix Authority validates syntax and source contracts.
- No database migration, historical backfill, payment/provider transaction or Production business-data mutation.
- Documentation-synchronized feature SHA must pass Current Source Gate and Staff Access Matrix Authority plus retained focused authorities.
- Fast-forward `dev` only after feature source-green.
- Require exact-SHA Current Source Gate, Staff Access Matrix Authority, Staff API Authority and Cloudflare Development Acceptance on `dev` before closure.
- Keep `main` unchanged unless Production promotion is explicitly authorized.

## Next — Build 352

Scope: **DAIP Media Workflow Consolidation**.

Connect Creative Project → Media Intake → Review → Content Package → Approved Public Asset as one explicit governed flow. Preserve private raw masters, reuse existing DAIP/Photo Studio authority, require deliberate approval before any public promotion, and keep background processing asleep unless an actual media job requires it.

## Continuing rule

Never start the next Rosie Dazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted Development SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
