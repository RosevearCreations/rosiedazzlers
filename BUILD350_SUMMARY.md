# Rosie Dazzlers — Build 350 Summary

## Build 350 — Staff API Authority Convergence

Build 350 closes the remaining legacy Staff-list authority divergence discovered after Build 349.

### Problem closed

Build 349 hardened `/api/admin/staff_list`, but the older `/api/staff_list` route still owned a separate direct Supabase query. That older route selected an authentication hash field and failed the entire Staff-list response when customer tiers were unavailable. The two routes could therefore drift even though they served the same staff-management domain.

### Build 350 authority

- `functions/api/_lib/staff-list-handler.js` is now the single Staff-list implementation.
- `/api/staff_list` and `/api/admin/staff_list` are thin route delegates to that handler.
- Neither route owns a direct Staff-table query anymore.
- Sensitive authentication hashes are not selected or returned by the canonical handler.
- Optional payroll/profile-column drift still falls back to the core Staff profile.
- Customer-tier read failure remains a warning rather than hiding Staff profiles.
- Administrator / Owner profiles still receive all seven internal modules and all retained management capabilities.
- No role ceiling, module permission, payroll rule, customer record, booking, payment, schema, or business data is changed by this build.

### Regression protection

- `scripts/admin_ui_audit.py` now guards both Staff-list routes plus the shared canonical handler.
- `.github/workflows/staff-api-authority.yml` validates JavaScript syntax and the Staff/API/Admin authority contract on Build 350, `dev`, and `main`.
- The existing Current Source Gate continues to run the protected Admin audit cumulatively.

### Acceptance boundary

The implementation baseline `4c7471c7cbbe097eff2951c78157337f8f9d8ded` passed the new Staff API Authority and Current Source Gate before documentation synchronization. Final Development acceptance must be run on the documentation-synchronized exact SHA before Build 350 is called GREEN.

### Next sequential scope

Build 351 should add an explicit, bounded **Staff Access Matrix** to the I.T. / Staff administration experience so an Administrator can verify each staff profile's effective role ceiling, granted modules, and global runtime-switch state without loading unrelated business datasets or introducing polling. The matrix must consume the canonical Build 350 Staff authority and must not create new permissions merely to make the display pass.
