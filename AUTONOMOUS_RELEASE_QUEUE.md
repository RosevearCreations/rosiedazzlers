# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries.

## Accepted synchronized checkpoint

The prior Staff & Access authority release is GREEN and synchronized at exact SHA `48815644ed4f296345f995c73d71899b0c5a4fb8`. The active release started with `dev == main` on that SHA.

## Active — Build 350

Branch: `build350-staff-api-authority-convergence`

Scope: **Staff API Authority Convergence / Legacy Authentication-Hash Closure**.

The active release removes the remaining split between the legacy `/api/staff_list` route and the protected `/api/admin/staff_list` route. Both must use one canonical server handler so Staff profile resilience, Administrator full authority, and sensitive-field exclusion cannot drift independently.

### Acceptance checklist

- One canonical Staff-list handler owns Staff-table reads and client shaping.
- Legacy `/api/staff_list` delegates to the canonical handler.
- `/api/admin/staff_list` delegates to the same canonical handler.
- Neither route directly owns a Supabase Staff query.
- Sensitive authentication hashes are never selected or returned.
- Optional payroll/profile-column drift falls back to core Staff profile fields.
- Customer-tier failure remains non-blocking for Staff profile/module administration.
- Administrator / Owner remains forced to all seven internal modules and retained management capabilities.
- Non-admin role ceilings and profile narrowing remain unchanged.
- `scripts/admin_ui_audit.py` guards both routes and the canonical handler.
- Focused Staff API Authority validates route syntax and convergence.
- No database migration, historical backfill, payment/provider transaction, or Production business-data mutation.
- Documentation-synchronized feature SHA must pass Current Source Gate, Staff API Authority and retained focused authorities.
- Fast-forward `dev` only after feature source-green.
- Require exact-SHA Current Source Gate, Staff API Authority and Cloudflare Development Acceptance on `dev` before closure.
- Keep `main` at accepted SHA `48815644ed4f296345f995c73d71899b0c5a4fb8` unless Production promotion is explicitly authorized.

## Next — Build 351

Scope: **Staff Access Matrix**.

Add an explicit, bounded Administrator view that shows each staff profile's effective role ceiling, granted modules, and current global module-switch state. The matrix should make access problems visible without loading unrelated business datasets or introducing polling. It must consume the canonical Staff authority and must not broaden permissions merely to make the matrix appear green.

## Continuing rule

Never start the next Rosie Dazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
