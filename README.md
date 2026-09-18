# Rosie Dazzlers

Current source direction: **Build 411 — Customer Communication, Consent & Delivery Evidence**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_405_415.md` — active evidence-driven sequence.
4. `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md` — current communication/consent/delivery contract.
5. `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md` — retained maintenance/fleet commercial contract.
6. `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md` — retained inventory/job-cost evidence contract.
7. `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md` — retained payment-provider acceptance contract.
8. `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md` — retained go-live readiness framework.
9. `STARTUP_GO_LIVE_BLOCKERS.md` — current evidence/HOLD inventory.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current customer-communication framework

Customer-directed email/SMS/push is fail-closed against the customer’s current authenticated profile. Queue creation is not permanent consent: current opt-in, channel, canonical recipient and push ownership/preferences are revalidated before provider dispatch. Stale queued outreach is cancelled before provider contact.

Abandoned-checkout recovery requires canonical customer ownership and current explicit consent; an email or phone value alone never establishes permission. Provider-accepted/sent evidence is not definitive delivery and remains provider-dependent until a separate delivery outcome is observed.

Acceptance does not send a real message, enable automatic outreach, mutate a provider, introduce a schema migration or write Production business data.

## Retained platform contract

The retained platform contract still governs visitor → booking/checkout → Customer → Detailer → Operations → payment/accounting → exact Production runtime. Reliability recovery remains read-safe and non-authoritative; canonical checkout/server state owns business outcomes. Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data and truthful Oxford/Norfolk proof.

Run current/durable release authorities with:

```bash
python scripts/customer_communication_consent_delivery_check.py
node scripts/customer_communication_consent_delivery_test.mjs
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by `rd main protection`. Accepted Development is proposed by pull request to protected `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.

After merge, the resulting `main` head is the exact Production SHA. Production deployment/runtime/business acceptance must independently prove that exact SHA. Production is not considered GREEN from source promotion alone. Any post-acceptance source write requires exact-SHA revalidation. Database migrations and business/provider mutations remain separate explicit boundaries.

## Next bounded release

Build 412 — Production Observability, Alerting & Support Diagnostics follows only after the current release is independently GREEN on protected `main`.
