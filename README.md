# Rosie Dazzlers

Current source direction: **Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

For a new chat, AI or developer, read:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
4. `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md` — current customer retention, service-guidance and public service-depth contract.
5. `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md` — retained Operations cockpit and growth-experiment contract.
6. `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md` — retained field-to-office handoff and commercial-evidence contract.
7. `STARTUP_GO_LIVE_BLOCKERS.md` — current go-live evidence gaps.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current retention, rebooking and service-guidance framework

`/api/client/retention` now resolves completed booking history through exact `customer_profile_id` and fails closed when exact package, vehicle-size or service-date evidence is missing. `/assets/my-account-v382.js` presents a prior completed service only as an explainable advisory starting point into the existing booking flow; current catalog, vehicle condition, availability, scope and price remain server-authoritative and must be reconfirmed before booking.

No fuzzy identity matching, inferred outreach consent, persistent customer scoring, automatic outreach, automatic booking write or silent service substitution is authorized.

`/assets/build403-service-depth.js` adds condition-aware professional process, scope, timing and approval guidance to every current public add-on/specialty landing route while retaining the accepted Build 388 renderer and Build 389 local SEO/proof authority. `/water-extraction/` adds dedicated flooded-floor restoration guidance without hard-coded pricing or guaranteed outcomes.

## Retained cockpit and growth framework

`admin-today.html` remains the responsive owner/Operations cockpit over `/api/admin/today_needs_attention_report`, with urgent/high separation, explicit owner-task controls, manual refresh and fast drill-downs into existing authoritative workstreams.

`data/growth_experiment_framework.json` remains evidence-only and creates no automatic outreach, pricing/booking/payment/consent mutation, customer scoring, accounting/inventory posting, provider mutation or schema authority.

Run focused/current authorities with:

```bash
python scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py
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
