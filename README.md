# Rosie Dazzlers

Current source direction: **Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

For a new chat, AI or developer, read:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_396_405.md` — active forward sequence and continuing release rules.
4. `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md` — current field-to-office handoff and commercial-evidence contract.
5. `STARTUP_GO_LIVE_BLOCKERS.md` — current go-live evidence gaps.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Canonical source locations

- Module registry: `data/app_modules.json`
- Navigation: `data/internal_navigation.json`
- Route ownership: `data/route_module_ownership.json`
- Migrations: `sql/` only
- Schema reference: `SUPABASE_SCHEMA.sql`
- Pages Functions: `functions/api/`

## Current handoff and commercial evidence

Operations now includes an additive manual **Field → office handoff** workstream. It composes existing server-authoritative booking/field evidence into one responsive read-only view and does not create a second completion, payment, approval, accounting, inventory or customer-state path.

`/api/admin/job_handoff_evidence` returns a bounded handoff snapshot plus commercial evidence only where compatible authoritative cents fields exist. Missing ticket, balance, job-cost, margin or add-on-ledger evidence stays unavailable. Detailer notes are never converted into sales, payouts, debt, forecasts or customer scores.

Run focused/current authorities with:

```bash
python scripts/build401_job_handoff_commercial_evidence_check.py
python scripts/build400_detailer_mobile_qol_retention_check.py
python scripts/build397_responsive_ux_authority_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Retained customer journey, growth, pricing, responsive and Detailer mobile authorities remain mandatory.

## Release authority

Feature candidates must pass focused source authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by active **`rd main protection`**. Accepted Development is proposed by PR to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so accepted Development ancestry remains explicit.

After merge, the resulting `main` head is the exact Production SHA and must independently pass Cloudflare deployment/runtime/business acceptance. Production is never considered GREEN from source promotion alone. Database migrations and business/provider mutations remain separate explicit boundaries.

Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data and truthful local/service content.
