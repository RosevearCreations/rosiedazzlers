# Rosie Dazzlers — Build 351 Summary

## Build 351 — Staff Access Matrix

Build 351 adds a bounded, read-only access matrix to **Admin → Staff & Access** so an Administrator can see why each staff profile can or cannot enter each internal Rosie module.

### What changed

- `admin-staff.html` now includes a responsive Staff Access Matrix and a global module-switch snapshot.
- Every staff/module cell shows four facts together: **role ceiling**, **profile grant**, **global switch**, and **effective access**.
- Inactive profiles are explicitly shown as blocked even when the three module checks would otherwise pass.
- The matrix uses the existing canonical Staff response; it does not create a second staff/profile API.
- Role ceilings, profile grants and effective access are calculated with `assets/app-core/module-resolver.js`, the same resolver used by the Rosie application launcher/runtime.
- Global availability is read once from the existing `/api/admin/module_flags` authority. The matrix does not poll.
- The matrix itself is read-only. Profile changes still use **Edit staff** and global availability changes remain in the **I.T. module switches** workspace.
- No booking, inventory, finance, DAIP, analytics or other unrelated business dataset is loaded for the matrix.
- Administrator / Owner full-module authority remains enforced by the existing Staff authority.

### Regression protection

- `scripts/admin_ui_audit.py` now verifies that the matrix consumes the shared module resolver rather than duplicating the role/module ceiling map.
- The audit rejects background timers/polling and unrelated business-data dependencies from the matrix runtime.
- `.github/workflows/staff-access-matrix-authority.yml` validates JavaScript syntax plus the complete Staff/profile/module-switch authority contract.
- Existing Current Source Gate and Cloudflare Development Acceptance remain cumulative release gates.

### Database / business-data boundary

Build 351 introduces **no database migration**, no historical backfill, no payment/provider transaction and no Production business-data mutation.

### Development acceptance

The implementation feature branch passed both the focused Staff Access Matrix Authority and Current Source Gate before documentation synchronization. The documentation-synchronized exact SHA must pass those authorities again, then be fast-forwarded to `dev` and pass exact-SHA Cloudflare Development Acceptance before Build 351 is called Development GREEN.

### Next sequential scope

**Build 352 — DAIP Media Workflow Consolidation.** Connect Creative Project → Media Intake → Review → Content Package → Approved Public Asset as one explicit governed flow while preserving private raw-media boundaries and requiring deliberate approval before any public promotion.
