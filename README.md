# Rosie Dazzlers

Current source direction: **Build 430 — Fleet & Commercial Operations Learning**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_426_435.md` — active evidence-driven sequence.
4. `BUILD430_FLEET_COMMERCIAL_OPERATIONS_LEARNING.md` — current planned contract.
5. `STARTUP_GO_LIVE_BLOCKERS.md` — single current Production HOLD/evidence backlog.
6. `BUILD429_RETENTION_REBOOKING_LEARNING.md` — retained retention/rebooking predecessor contract.
7. `BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md` — retained service-economics/job-profitability continuity contract.
8. `BUILD427_BOOKING_CONVERSION_QUOTE_CLARITY.md` — retained booking-conversion/quote-clarity continuity contract.

Git history is the release archive. `DOC_INDEX.md` contains specialist references.


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
- `scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py`
- `scripts/build402_admin_operations_cockpit_growth_experiment_check.py`
- `scripts/build396_growth_baseline_forward_roadmap_check.py`

## Current Fleet & Commercial Operations Learning framework

`BUILD430_FLEET_COMMERCIAL_OPERATIONS_LEARNING.md` defines the current bounded autonomous release. The staff-only `/admin-fleet-commercial-learning.html` surface and `/api/admin/fleet_commercial_operations_learning` endpoint aggregate fleet inquiry demand, source rulebook state, fleet account/request/service-history evidence and capacity boundaries without exposing customer identities.

Inquiry, quote and converted-lead counts remain operational evidence only, not signed commercial business. Unresolved fleet minimums, tiers, travel, volume pricing, invoicing and cancellation decisions remain `owner_action`; unsupported live capacity remains `unavailable` rather than assumed.

The retention/rebooking predecessor remains retained through `BUILD429_RETENTION_REBOOKING_LEARNING.md`. The prepared follow-on contracts are `BUILD431_LOCAL_ACQUISITION_CONTENT_PROOF.md` through `BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_426_435.md`.

## Retained operating boundaries

The reliability/capacity snapshot remains bounded, read-only and manual-refresh. It does not infer Cloudflare billing, CPU usage, quotas or future capacity and does not automatically change retries, caching or scaling.

Customer communication remains current-explicit-consent gated at dispatch time. Provider acceptance is not definitive delivery without provider delivery evidence.

Backup/restore and rollback mechanics remain observation-only unless a separate explicitly authorized recovery action is performed. Production mutation is never implied by source/runtime GREEN.

Media/Photo Studio proof operations remain database-first during ordinary loads; bounded R2 listing happens only through explicit sync authority and destructive media changes remain explicit/auditable.

Maintenance/fleet commercial terms remain owner-approved and capacity-aware. `/api/availability` and `/api/checkout` remain authoritative for real booking capacity.

## Current operator surfaces

- `/admin/it.html` — Production support/readiness diagnostics.
- `/admin/security-recovery.html` — bounded security/privacy/recovery snapshot.
- `/admin/reliability-capacity.html` — bounded reliability/performance/capacity snapshot.
- `/admin-launch-readiness.html` — consolidated launch-readiness evidence.
- `/admin-seo-tasks.html` — local-search/provider evidence.
- Photo Studio — managed public media assignments, Before/After proof and bounded sync operations.

All diagnostic surfaces are manual-refresh. No permanent polling, automatic provider test transaction or automatic business-state mutation is introduced by these views.

## Durable validation

The focused implementation checker now participates in the current release authority. Retained durable release authorities include:

```bash
python scripts/retention_rebooking_learning_check.py
node scripts/retention_rebooking_learning_test.mjs
python scripts/fleet_commercial_operations_learning_check.py
node scripts/fleet_commercial_operations_learning_test.mjs
python scripts/build428_service_economics_job_profitability_check.py
node scripts/build428_service_economics_job_profitability_test.mjs
python scripts/build427_booking_conversion_quote_clarity_check.py
python scripts/hold_inventory_authority_cleanup_check.py
python scripts/production_learning_roadmap_renewal_check.py
python scripts/security_privacy_recovery_drill_check.py
node scripts/security_privacy_recovery_drill_test.mjs
python scripts/backup_restore_release_recovery_drill_check.py
python scripts/release_rollback_recovery_check.py
python scripts/performance_accessibility_security_check.py
python scripts/reliability_performance_cost_capacity_check.py
node scripts/reliability_performance_cost_capacity_test.mjs
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by `rd main protection`. Accepted Development is proposed by pull request to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.

After merge, the resulting `main` head is the exact Production SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA. Production is not considered GREEN from source promotion alone. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and business/provider mutations remain separate explicit boundaries.

## Next bounded release

**Build 431 — Local Acquisition & Content Proof** is next only after the current release is independently GREEN on protected `main`.
