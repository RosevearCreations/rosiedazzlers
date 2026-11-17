# Rosie Dazzlers Build 900 — Workforce, Equipment Safety & Job Preparation

## Scope and original owners

This build extends original Build 899 (catalog inventory, equipment service, physical count proposals), the original \`bookings\`, \`booking_staff_assignments\`, \`staff_users\` and signed staff session system. It adds a private workforce/crew job-readiness screen at \`/admin-workforce-safety.html\`, a server-only API \`/api/admin/workforce_safety_v900\`, a pure projection/validation module and three append-only tables.

1. Supervisor records active original tool assignment or return to an **already assigned crew member**, without transferring catalog stock.
2. Signed assigned staff record actual checklist outcomes for PPE, chemical labels/SDS, power/water, worksite hazards, weather and their assigned tool condition. Issues block READY; new observations preserve history.
3. Only a signed \`admin\` or \`operations_manager\` with \`operations.assignment.manage\` can record supervisor READY/HOLD. READY is rejected if checklist or equipment conditions are missing/failed or the assigned equipment has overdue planned service. New check or assignment rows invalidate a prior READY snapshot. A staff check is not legal third-party or independent physical certification.

No user-supplied staff signer IDs, legacy password bridge, public anonymous endpoint or customer-data frontend access is allowed. Detailer views are scoped by original booking/crew assignment. Requests require same-origin JSON and UUID-based retry keys. \`POST\` writes the original signed staff ID; privileged booleans are database constrained. All three tables have RLS, anon/authenticated grants revoked, service-role read/insert and UPDATE/DELETE/TRUNCATE rejection triggers. Database migrations depend on the confirmed Build 899 immutability trigger.

The screen includes actual work-order selection, equipment/crew selectors, preparation check forms, role-isolated supervisor decision and source receipts. Server data windows are bounded and fail closed on truncation. The frontend uses \`textContent\`, not HTML injection.

## Limits and mandatory business acceptance

The server does **not** adjust stock, issue purchase orders, certify real-world equipment, control payroll, start or finish a booking, send customer messages, process payments or synchronize other applications. Tool checks and signoffs are named staff reports and attestations, not external inspection certificates. Original on-site observation and owner/operations acceptance remain BUSINESS HOLD until actually performed. The source projection indicates SUPERVISOR_RECORDED_READY only with current original signed supervisor attestation and complete staff-reported prep evidence, not an unconditional GREEN safety certification.

## Release gates

- \`node --check functions/api/admin/workforce_safety_v900.js\`
- \`node --test tests/build900_workforce_safety.test.mjs\`
- Retained Build 899 and 895 regression tests; protected source checks
- Apply \`20261117001000_build900_workforce_equipment_safety.sql\` to original Rosie Supabase; verify RLS, no anonymous grants, append-only triggers, source readback
- Source via \`dev\`; exact Cloudflare Development and protected \`main\` review, exact-SHA Production Pages/Functions + signed/on-site HOLD checks, release-health and queue within budget

No simulated physical owner/safety approval, test rows, other-application production pushes or fabricated Vercel success.
**Next proposed Build 901 — Job-Day Dispatch, Safety Escalations & Equipment Return Reconciliation**, expanding failure-safe dispatch gates and original field custody without lockstep cross-app releases.
