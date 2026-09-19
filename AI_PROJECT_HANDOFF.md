# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

Build 428 — Service Economics & Job Profitability is the synchronized Production predecessor.

**Build 429 — Retention & Rebooking Learning** is the active bounded release.

**Build 430 — Fleet & Commercial Operations Learning** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD429_RETENTION_REBOOKING_LEARNING.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_426_435.md`. Canonical HOLD backlog: `STARTUP_GO_LIVE_BLOCKERS.md`. Retained predecessor contract: `BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md`. Retained continuity also includes Build 427 — Booking Conversion & Quote Clarity (`BUILD427_BOOKING_CONVERSION_QUOTE_CLARITY.md`).

This release authorizes no schema migration, secret rotation, Production restore, customer/booking mutation, staff role/capability change, consent mutation, provider contact, accounting/inventory posting, destructive R2 mutation, DNS mutation, automatic outreach or permanent polling.


## Retained contract index

These completed authorities remain continuity inputs for current acceptance:

- `FORWARD_BUILD_ROADMAP_405_415.md`
- `BUILD423_RELIABILITY_PERFORMANCE_COST_CAPACITY.md`
- `BUILD422_MEDIA_PHOTO_STUDIO_PROOF_OPERATIONS.md`
- `BUILD421_RETENTION_MAINTENANCE_FLEET_OPERATIONAL_PILOT.md`
- `BUILD420_SEARCH_CONSOLE_GBP_LOCAL_ACQUISITION_EVIDENCE_CLOSURE.md`
- `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md`
- `BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md`
- `BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md`
- `BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md`
- `BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md`
- `BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md`
- `BUILD413_WORKFLOW_EFFICIENCY_ACCESSIBILITY_AUDIT.md`
- `BUILD412_PRODUCTION_OBSERVABILITY_ALERTING_SUPPORT_DIAGNOSTICS.md`
- `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`
- `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`
- `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`
- `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`
- `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md`
- `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`

## Current Retention & Rebooking Learning contract

- Completed-job → later booking evidence uses exact canonical customer-profile linkage only.
- Repeat counts, elapsed time and package transitions are observational correlation, not causal proof.
- Maintenance-interest evidence remains aggregate when exact identity linkage is unavailable.
- Current explicit customer communication consent remains authoritative at dispatch time.
- Provider acceptance is not definitive delivery without provider delivery evidence.
- The operator surface is read-only and exposes no customer identities.
- No automatic outreach, segmentation, booking, maintenance enrollment, discount, payment/provider, accounting, inventory or schema mutation is authorized.
- Build 428 — Service Economics & Job Profitability remains retained through `BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md`.

## Retained HOLD inventory & authority-cleanup contract

- `STARTUP_GO_LIVE_BLOCKERS.md` is the single current HOLD/evidence backlog.
- Provider-dependent, owner-action and unavailable evidence remain distinct and fail-closed.
- Completed source/runtime authorities stay in retained contracts/workflow evidence instead of being duplicated as blocker checklists.
- Stale launch-era wording may be removed only without erasing unresolved external or owner dependencies.
- Source/runtime GREEN never fabricates closure of provider or owner evidence.
- This release is read-only governance cleanup and authorizes no schema, customer/booking, provider, accounting, inventory, secret, DNS, restore or destructive R2 mutation.

## Retained reliability contract

The retained reliability/capacity view stays staff-only, manual-refresh and read-only. Its first-party traffic and diagnostics evidence does not infer Cloudflare billing, CPU usage, provider quotas or future capacity, and it performs no automatic retry, cache, scaling or provider mutation.

## Retained operating contract

- Protected `main` PR and exact Cloudflare Production acceptance remain mandatory.
- Production support diagnostics remain read-only and manual-refresh.
- Public SEO remains one meaningful H1 per indexable page with truthful local proof.
- Role/capability boundaries remain fail-closed.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Release mechanics

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_426_435.md`
- `BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md`
- `BUILD429_RETENTION_REBOOKING_LEARNING.md`
- `BUILD430_FLEET_COMMERCIAL_OPERATIONS_LEARNING.md`
- `BUILD431_LOCAL_ACQUISITION_CONTENT_PROOF.md`
- `BUILD432_DETAILER_STAFF_WORKFLOW_REFINEMENT.md`
- `BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md`
- `BUILD434_RELIABILITY_SECURITY_COST_REASSESSMENT.md`
- `BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`
- `BUILD427_BOOKING_CONVERSION_QUOTE_CLARITY.md`
- `BUILD426_HOLD_INVENTORY_AUTHORITY_CLEANUP.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `BUILD425_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `BUILD424_SECURITY_PRIVACY_RECOVERY_DRILL.md`
- `BUILD423_RELIABILITY_PERFORMANCE_COST_CAPACITY.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/service-economics-job-profitability-authority.yml`
- `.github/workflows/security-privacy-recovery-drill-authority.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/build428_service_economics_job_profitability_check.py`
- `scripts/build428_service_economics_job_profitability_test.mjs`
- `scripts/build427_booking_conversion_quote_clarity_check.py`
- `scripts/hold_inventory_authority_cleanup_check.py`
- `scripts/production_learning_roadmap_renewal_check.py`
- `scripts/security_privacy_recovery_drill_check.py`
- `scripts/backup_restore_release_recovery_drill_check.py`
- `scripts/release_rollback_recovery_check.py`
- `scripts/performance_accessibility_security_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, `BUILD429_RETENTION_REBOOKING_LEARNING.md`, the active roadmap and go-live blockers. Begin current implementation only from that verified Production boundary and preserve feature → Development → protected-main PR → exact Production acceptance discipline.
