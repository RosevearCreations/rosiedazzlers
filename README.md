# Rosie Dazzlers

Current source direction: **Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

For a new chat, AI or developer, read:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
4. `BUILD404_ERROR_RECOVERY_WEAK_CONNECTION_RELIABILITY.md` — current recovery, weak-connection and reliability contract.
5. `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md` — retained customer retention, service-guidance and public service-depth contract.
6. `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md` — retained Operations cockpit and growth-experiment contract.
7. `STARTUP_GO_LIVE_BLOCKERS.md` — current go-live evidence gaps.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current recovery and weak-connection framework

`/assets/reliability-recovery-v404.js` supplies a shared non-authoritative reliability layer: honest offline/weak-network messaging, bounded retry for GET/HEAD reads only, expiring tab-scoped protected drafts, explicit duplicate-submit locking, upload progress/failure/manual retry states, and partial-result labeling.

The layer never queues or automatically replays business mutations. Local/offline state is never accepted server state. Sensitive/payment/provider-secret fields and file objects are excluded from protected drafts, and restored drafts require stale-condition review before the user proceeds when authoritative evidence may have changed.

Build 380 booking recovery remains authoritative for booking/payment recovery and canonical checkout remains the source of truth. Build 404 adds convenience and visibility without replacing server-side idempotency, booking, payment, provider, accounting, inventory or customer authority.

## Retained retention, rebooking and service-guidance framework

`/api/client/retention` resolves completed booking history through exact `customer_profile_id` and fails closed when exact package, vehicle-size or service-date evidence is missing. `/assets/my-account-v382.js` presents a prior completed service only as an explainable advisory starting point into the existing booking flow; current catalog, vehicle condition, availability, scope and price remain server-authoritative and must be reconfirmed before booking.

`/assets/build403-service-depth.js` retains condition-aware professional process, scope, timing and approval guidance across public add-on/specialty routes, including dedicated `/water-extraction/` flooded-floor restoration guidance.

Run focused/current authorities with:

```bash
python scripts/build404_error_recovery_weak_connection_reliability_check.py
python scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py
python scripts/booking_recovery_failure_handling_check.py
python scripts/build402_admin_operations_cockpit_growth_experiment_check.py
python scripts/build401_job_handoff_commercial_evidence_check.py
python scripts/build400_detailer_mobile_qol_retention_check.py
python scripts/build397_responsive_ux_authority_check.py
python scripts/build396_growth_baseline_forward_roadmap_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Retained customer journey, growth, pricing, responsive, Detailer mobile, Operations and field-handoff authorities remain mandatory. Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused source authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by active **`rd main protection`**. Accepted Development is proposed by PR to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so accepted Development ancestry remains explicit.

After merge, the resulting `main` head is the exact Production SHA and **Production deployment/runtime/business acceptance must independently prove that exact SHA**. Production is not considered GREEN from source promotion alone. Database migrations and business/provider mutations remain separate explicit boundaries.

Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data, truthful Oxford/Norfolk service content and genuine proof only.
