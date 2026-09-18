# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

**Build 414 — Local SEO Measurement, Search Console & GBP Proof** is the active bounded release.

**Build 415 — Launch Readiness Consolidation & Next-Roadmap Renewal** is next only after the current release is independently GREEN on protected `main`.

Active roadmap: `FORWARD_BUILD_ROADMAP_405_415.md`. Current contract: `BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md`.

This source release authorizes no schema migration, Production business-data mutation during acceptance, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, accounting/inventory posting, automatic provider call, Google credential storage or background polling.

## Current local-search measurement contract

- `/admin-seo-tasks.html` is the operator-facing local-search evidence surface.
- First-party Google referral/local-page analytics and approved local proof are reported separately from Search Console and Google Business Profile.
- Search Console and GBP metrics are retained only as dated operator-observed snapshots with property/location labels and measurement windows.
- Missing provider evidence remains `provider_dependent`; stale/manual provider snapshots remain `owner_action`.
- Markup, canonical tags, structured data, Google referrals and approved proof never imply provider ranking, indexing or Maps/profile success.
- Provider snapshot storage uses the existing `app_management_settings` authority and requires an explicit authorized staff action.
- No Google credentials, OAuth tokens, customer records or automatic Google API calls are introduced.
- The UI remains manual refresh only; no permanent polling is introduced.

## Retained operating contract

- Workflow efficiency/accessibility authority remains active across Admin, Detailer and Customer high-frequency paths.
- Production support diagnostics remain read-only, manual-refresh and support-safe.
- Customer communication remains current-consent gated at dispatch time.
- Readiness classifications remain `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, and `unavailable`.
- Canonical checkout remains server-authoritative for availability, booking and payment outcomes.
- Public SEO remains one meaningful H1 per indexable page with truthful Oxford/Norfolk proof.
- Field-to-office handoff remains retained through `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`.
- Payment provider live-outcome/reconciliation remains retained through `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`.
- Inventory/job-cost evidence remains retained through `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`.
- Maintenance/fleet commercial evidence remains retained through `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`.
- Communication/consent evidence remains retained through `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`.
- Production support diagnostics remain retained through `BUILD412_PRODUCTION_OBSERVABILITY_ALERTING_SUPPORT_DIAGNOSTICS.md`.
- Workflow efficiency/accessibility remains retained through `BUILD413_WORKFLOW_EFFICIENCY_ACCESSIBILITY_AUDIT.md`.

## Release mechanics

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized and evidence-gated.
- Any source write after acceptance invalidates that exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_405_415.md`
- `BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md`
- `BUILD413_WORKFLOW_EFFICIENCY_ACCESSIBILITY_AUDIT.md`
- `BUILD412_PRODUCTION_OBSERVABILITY_ALERTING_SUPPORT_DIAGNOSTICS.md`
- `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`
- `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`
- `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`
- `BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/local_search_measurement_authority_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, active roadmap, current contract and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline.
