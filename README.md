# Rosie Dazzlers

Current source direction: **Build 410 — Maintenance / Fleet Commercial Acceptance**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_405_415.md` — active evidence-driven sequence.
4. `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md` — current maintenance/fleet commercial acceptance contract.
5. `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md` — retained inventory/job-cost evidence contract.
6. `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md` — retained payment-provider acceptance contract.
7. `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md` — retained go-live readiness framework.
8. `STARTUP_GO_LIVE_BLOCKERS.md` — current evidence/HOLD inventory.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current maintenance/fleet commercial framework

The current acceptance model is intentionally fail-closed. `config/maintenance-plan-business-rulebook.json` and `config/fleet-business-rulebook.json` remain the canonical business-term authorities. Both currently require explicit owner approval and therefore remain `owner_action`; source release GREEN must not be mistaken for approval of pricing, cadence, inclusions, fleet minimums, tiers, travel, volume pricing, invoicing or cancellation terms.

Capacity remains server-authoritative through `/api/availability` with final collision/revalidation at `/api/checkout`. Draft or sent fleet quotes are not customer commitments. Explicit accepted-quote evidence requires an accepted status, acceptance timestamp and recorded positive quoted/accepted amounts. Automatic outreach, enrolment, booking, discounts, invoice creation, recurring billing, renewal and provider mutation remain separately authorized.

## Current payment-provider framework

`/admin/it.html` remains the single operator-facing readiness surface. It renders authenticated read-only `/api/admin/go_live_readiness` evidence together with retained `/api/admin/production_diagnostics` troubleshooting.

Provider configuration can establish `source_ready`, but live-payment readiness becomes `runtime_proven` only from persisted verified provider evidence. The current endpoint requires a definitive `settled`, `replayed`, or `refund_recorded` webhook, stable provider-event → internal payment-request identity, and exact paid-amount/currency reconciliation. It does not contact Stripe/PayPal, create/capture/refund a payment, replay a webhook, write business data, mutate R2 or run background work.

Readiness classifications remain `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, or `unavailable`. Unavailable evidence is not automatically failure. Source/Production release GREEN remains distinct from provider live-payment readiness GREEN.

## Retained platform contract

The retained capstone still governs visitor → booking/checkout → Customer → Detailer → Operations → payment/accounting → exact Production runtime. Reliability recovery remains read-safe and non-authoritative; canonical checkout/server state owns business outcomes. Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data and truthful Oxford/Norfolk proof.

Durable retained authorities include:

- `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md`
- `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md`
- `scripts/build396_growth_baseline_forward_roadmap_check.py`
- `scripts/build402_admin_operations_cockpit_growth_experiment_check.py`
- `scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py`

Run current/durable release authorities with:

```bash
python scripts/build410_maintenance_fleet_commercial_acceptance_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by `rd main protection`. Accepted Development is proposed by pull request to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.

After merge, the resulting `main` head is the exact Production SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA. Production is not considered GREEN from source promotion alone. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and business/provider mutations remain separate explicit boundaries.

## Next bounded release

Build 411 — Customer Communication, Consent & Delivery Evidence follows only after the current release is independently GREEN on protected `main`.
