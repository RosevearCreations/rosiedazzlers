# Rosie Dazzlers Build 825 — Production Handoff Field Acceptance, Role/Device Verification & Evidence-Based Module Readiness

## Release intent
The new /admin-handoff-acceptance.html and /admin-handoff-acceptance/ routes provide a signed-supervisor, read-only operator workspace built over the retained Build 824 private handoff system and existing authenticated-device authority.

**This release is NOT a statement that real physical device tests or business workflows were observed.** The absence of customer worksite follow-ups, private supervisor notes, physical role/device observations or provider receipts stays owner-action/HOLD.

## Source of truth and permission boundaries
- API: GET /api/admin/worksite_field_acceptance_v825. Requires a genuine signed staff session with operations.customer.manage, manage_bookings and an operations_manager/admin role with operations.assignment.manage. Deny unauthenticated and less-privileged roles; no legacy admin fallback.
- Handoff notes source: existing customer_worksite_supervisor_notes_v824, private RLS and service-role SELECT/INSERT only, plus customer_worksite_followups_v814. This build reads **aggregate counts only**; no note contents, customer identifiers, actor names, addresses or booking IDs.
- Device proof: compose the existing GET /api/admin/authenticated_device_visual_acceptance without bypassing its separate it_diagnostics authorization. An Operations supervisor without that permission sees unavailable, not a fabricated pass; admin with both permissions can review the safe, existing authority summary.
- Device matrix explicitly distinguishes four roles (Customer, Detailer, Operations, Admin) and three device classes (phone/tablet/desktop). Current positive, current regression, missing, unavailable and stale evidence must not collapse into one green status.
- Source count registry: bookings, job_updates, job_time_entries, staff_payroll_runs, final_balance_payment_requests, accounting_period_closes, accounting_journal_entries, accounting_tax_year_support, social_dispatch_attempts, catalog_inventory_movements, quote_payment_webhook_events, rosevear_integration_v1_original_receipt_intake, creative_projects, plus real follow-up and private-note counts.
- Count reads use exact server-side PostgREST Content-Range when available; an unavailable header/table is **unknown**, never silently zero. Manual source refresh only; snapshot expires for module decisions after 15 minutes.

## Evidence-based module readiness
- The 45 source module rows and two estimates (Built % / Proven %) remain byte-for-byte derivable from docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md. They are **provisional estimates, not measured coverage** and are never automatically raised by code, CI, a non-zero row count or a Cloudflare release.
- Each module is mapped to a named current source and its relevant acceptance role where applicable.
- No source events, source unavailable, role/device HOLD, and source activity present; owner review required are **review states**, not completion certificates. Even a full device matrix only creates an operator review candidate.
- Where no responsible source is mapped (e.g. recovery/backup proof), the module remains source unavailable until its separate owning evidence and successful witnessed drill are supplied.
- Canonical business HOLDs remain in STARTUP_GO_LIVE_BLOCKERS.md, unaffected by this build.
- Real test flow: manually sign in with the intended role/device, observe the live route and real workflow, submit dated attributable evidence through the existing Launch Readiness authority, refresh this board, investigate failed/missing observations, then request explicit owner review; a source-only pass never replaces these steps.

## UI/accessibility
- Mirrored /admin-handoff-acceptance.html and /admin-handoff-acceptance/ are linked from the existing /admin-today.html supervisor board.
- Manual refresh and focused status feedback, simple role and device tables, module name search and evidence-state filter, full width keyboard-scroll regions, and responsive phone/tablet layout.
- All dynamic source-derived strings are rendered with textContent, without injecting private notes, session data, raw external URLs or untrusted HTML.
- This new view sends no POST/PATCH/DELETE, no email, no social post, no booking, inventory, payroll, accounting, source-HOLD, permission or customer-data mutation, no screenshot/browser farm, and no background polling.

## Acceptance and release gates
1. node scripts/build825_production_field_acceptance_test.mjs — signed supervisor, forbidden detailer, denied IT-device source, missing source vs true zero, no fake device pass, regression HOLD, 45 fixed audit estimates, source/UI/accessibility contracts.
2. bash scripts/current_booking_wizard_regression.sh — retains all prior booking and Build 811–824 authority.
3. python3 scripts/release_check.py, retained staff/device/IT/security checks, and Cloudflare preview/runtime source gates.
4. Protected feature PR → dev, verify exact reviewed source SHA.
5. Separate protected dev → main PR, exact main-SHA Cloudflare deployed artifact, canonical rosiedazzlers.ca static/contextual HTTP smoke and business acceptance.
6. Independently verify the branch inventory and remove only the merged Build 825 source branch. Preserve any unique-history branches.

## Honest readiness status
No real customer, supervisor, staff or device test is created by deployment. Unless the owning live evidence is independently present, the role/device, provider, backup, finance, payroll, marketing, social publishing and Rosevear Comms-Hub acceptance gates remain OPEN/HOLD. The owner may use the new dashboard to plan and check field verification, not to infer completion.
