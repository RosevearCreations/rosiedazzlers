# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Prior fully accepted/synchronized release: Staff & Access authority resilience at SHA `48815644ed4f296345f995c73d71899b0c5a4fb8`.
- The active release began with `dev == main` on that exact SHA.
- Active work: **Build 350 — Staff API Authority Convergence**.
- Active branch: `build350-staff-api-authority-convergence`.
- This release introduces **no database migration** and no business-data backfill.

## Why this release is active

The prior release made `/api/admin/staff_list` resilient and removed authentication hashes from that response, but the older `/api/staff_list` route still owned a separate direct Staff-table query. That legacy path selected an authentication hash field and treated customer-tier failure as fatal. The current release removes that split authority rather than allowing two Staff-list implementations to drift.

## Operating contract

- `functions/api/_lib/staff-list-handler.js` is the only Staff-list data/query implementation.
- `/api/staff_list` and `/api/admin/staff_list` are thin delegates to the same handler.
- Neither route may directly query Supabase Staff rows.
- Sensitive authentication hashes are never selected or returned by either Staff-list path.
- Optional payroll/profile schema drift may fall back to core Staff profile fields.
- Customer-tier failure remains non-blocking for Staff profile/module administration.
- Administrator / Owner continues to receive all seven internal modules and retained management capabilities.
- Non-admin role ceilings and per-profile narrowing remain unchanged.
- No customer, booking, scheduling, payment, provider, schema, or Production business-data mutation is introduced.

## Durable authorities

- `functions/api/_lib/staff-list-handler.js` — canonical Staff list/profile authority.
- `functions/api/staff_list.js` — legacy compatibility route delegate.
- `functions/api/admin/staff_list.js` — protected Admin route delegate.
- `scripts/admin_ui_audit.py` — shared Admin UI plus Staff route-convergence guard.
- `.github/workflows/staff-api-authority.yml` — focused Staff syntax/security/authority gate.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance after promotion to `dev`.

## Release procedure

1. Require the documentation-synchronized feature SHA to pass Current Source Gate and Staff API Authority plus retained focused authorities.
2. Fast-forward `dev` only if it still descends cleanly from accepted SHA `48815644ed4f296345f995c73d71899b0c5a4fb8`.
3. Require Current Source Gate, Staff API Authority and Cloudflare Development Acceptance on the exact promoted `dev` SHA.
4. Call the active release GREEN for Development only after those checks pass.
5. Keep `main` unchanged unless Production promotion is explicitly authorized.

## Next sequential scope

**Build 351 — Staff Access Matrix.** Add one explicit, bounded view in the I.T./Staff administration experience showing each staff profile's effective role ceiling, granted modules, and global runtime-switch state. It must use the canonical Staff authority, remain read-only unless the user deliberately edits through Staff & Access, load no unrelated business datasets, and introduce no polling.

## Restart point

If interrupted, verify `build350-staff-api-authority-convergence`, compare it to accepted SHA `48815644ed4f296345f995c73d71899b0c5a4fb8`, and inspect the first failing Staff/API/source authority. Do not restore an independent direct query to either Staff-list route and do not expose authentication hashes to the client.
