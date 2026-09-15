# Rosie Dazzlers

Current source direction: **Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

For a new chat, AI or developer, read:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
4. `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md` — current Operations cockpit and growth-experiment contract.
5. `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md` — retained field-to-office handoff and commercial-evidence contract.
6. `STARTUP_GO_LIVE_BLOCKERS.md` — current go-live evidence gaps.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current cockpit and growth framework

`admin-today.html` is the responsive owner/Operations cockpit. It composes the existing `/api/admin/today_needs_attention_report`, separates urgent/high exceptions from normal/low due work, keeps explicit owner-task controls and manual refresh, and offers fast drill-downs into existing authoritative workstreams.

`data/growth_experiment_framework.json` defines bounded evidence-only hypotheses for booking abandonment, reminder timing, rebooking, referrals and review-request timing. It creates no automatic outreach, pricing/booking/payment/consent mutation, customer scoring, accounting/inventory posting, provider mutation or schema authority.

Run focused/current authorities with:

```bash
python scripts/build402_admin_operations_cockpit_growth_experiment_check.py
python scripts/build401_job_handoff_commercial_evidence_check.py
python scripts/build400_detailer_mobile_qol_retention_check.py
python scripts/build397_responsive_ux_authority_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Retained customer journey, growth, pricing, responsive, Detailer mobile and field-handoff authorities remain mandatory. Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused source authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by active **`rd main protection`**. Accepted Development is proposed by PR to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so accepted Development ancestry remains explicit.

After merge, the resulting `main` head is the exact Production SHA and must independently pass Cloudflare deployment/runtime/business acceptance. Production is not considered GREEN from source promotion alone. Database migrations and business/provider mutations remain separate explicit boundaries.

Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data and truthful local/service content.
