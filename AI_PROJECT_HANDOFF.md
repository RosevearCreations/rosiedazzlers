# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

**Build 411 — Customer Communication, Consent & Delivery Evidence** is the active bounded release.

**Build 412 — Production Observability, Alerting & Support Diagnostics** is next only after the current release is independently GREEN on protected `main`.

Active roadmap: `FORWARD_BUILD_ROADMAP_405_415.md`. Current contract: `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`.

This source release authorizes no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, accounting/inventory posting, fabricated consent, automatic outreach or automatic booking.

## Current communication contract

- Authenticated customer profiles own customer communication consent.
- A queued message is not durable future permission to send.
- Customer-directed dispatch revalidates current opt-in, current channel, canonical recipient and, for push, current owned subscription/event preference.
- Stale or revoked consent cancels the queued event before provider contact.
- Abandoned-checkout recovery requires canonical customer ownership and explicit current consent.
- Provider-accepted/sent evidence is not definitive delivery; final delivery remains provider-dependent until separately observed.
- Customer unsubscribe and preference changes remain owner-authenticated.
- Staff-owned push remains governed by staff ownership/capability boundaries.
- No inferred consent or automatic outreach is enabled by source acceptance.

## Retained operating contract

- Readiness classifications remain `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, and `unavailable`.
- Unavailable is not automatically failure. Required missing runtime evidence may remain a HOLD.
- Canonical checkout remains server-authoritative for availability, booking and payment outcomes; business mutations are never queued/replayed automatically on reconnect.
- Authenticated booking history remains linked through exact `customer_profile_id`; current catalog, condition, availability, scope and price are reconfirmed.
- Public SEO remains one meaningful H1 per indexable page with truthful Oxford/Norfolk proof.
- Representative phone/tablet/desktop support remains mandatory; source checks are not independent visual-browser proof.
- Durable field-to-office handoff authority remains `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`.
- Inventory/job-cost evidence remains retained through `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`.
- Maintenance/fleet commercial evidence remains retained through `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`.

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
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, active roadmap, current contract and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline.
