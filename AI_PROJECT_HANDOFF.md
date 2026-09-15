# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence** is the active bounded release.
- **Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework** is next only after protected `main` and exact Production evidence are GREEN.
- No database migration, Production business-data mutation, R2 destructive mutation, DNS/secret mutation, accounting/inventory posting, customer charge/refund, provider mutation or customer mutation is authorized by this source release.
- `main` remains governed by `rd main protection`; missing/unobservable protection is AMBER, never inferred GREEN.

## Current handoff contract

- `/app/detailer/` remains the canonical field evidence-creation runtime and its server-authoritative start/complete gates remain unchanged.
- Operations gains one additive **Field → office handoff** workstream. It performs a bounded manual read only; opening Operations still loads no dataset and no background polling is created.
- Handoff facts compose existing bookings, field notes/evidence, media, signoff and recorded-time evidence. Free-form notes can communicate context but never create payment, pricing, approval, accounting, inventory or consent authority.
- Ticket/balance/job-cost/margin evidence is shown only when compatible authoritative cents fields exist. Missing fee, tax, cost, payment, balance or reconciliation evidence stays unavailable rather than zero/estimated.
- Add-on attachment is not derived from Detailer notes. Negative/no-result states remain visible.
- Inferred busy time, payouts, hidden debt, forecasts, lifetime-value/customer scoring and automatic outreach remain prohibited.

## Responsive / interaction contract

- Shared phone/tablet/desktop acceptance remains mandatory for materially changed surfaces.
- Handoff retains large touch targets, responsive cards, truthful loading/error/empty states, manual refresh and explicit sleep/suspend behavior.
- Dormant modules remain event-driven; permanent polling requires a separately authorized demonstrated need.

## Accepted operating contract

- `dev` is Development; protected `main` is Production source.
- A feature candidate must pass its focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; do not bypass `rd main protection`. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.
- The resulting `main` head is the exact Production source SHA and must independently pass **Production deployment/runtime/business acceptance**. Missing deployment identity, Functions metadata, required checks or runtime smoke is a blocker.
- Database migrations are separate explicit acceptance boundaries, never runtime side effects.
- Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data and truthful service-area/service claims.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_396_405.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `.github/workflows/job-handoff-commercial-evidence-authority.yml`
- `scripts/build401_job_handoff_commercial_evidence_check.py`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Start from the latest accepted GitHub checkpoint, then read this file, the release queue, forward roadmap, current contract, release governance and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release GREEN.
