# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

**Build 412 — Production Observability, Alerting & Support Diagnostics** is the active bounded release.

**Build 413 — Admin / Detailer / Customer Workflow Efficiency & Accessibility Audit** is next only after the current release is independently GREEN on protected `main`.

Active roadmap: `FORWARD_BUILD_ROADMAP_405_415.md`. Current contract: `BUILD412_PRODUCTION_OBSERVABILITY_ALERTING_SUPPORT_DIAGNOSTICS.md`.

This source release authorizes no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, accounting/inventory posting, automatic alert delivery or background polling.

## Current Production support diagnostics contract

- The I.T. support snapshot composes retained go-live readiness and Production diagnostics rather than creating a competing health authority.
- Exact runtime SHA, branch and host are displayed only when already observed by retained runtime evidence.
- Required runtime failures are `critical`; degraded/optional evidence is `warning`; provider evidence remains `hold`; explicit operator evidence remains `action`.
- Every alert carries corrective mechanics, but the diagnostic workflow never performs the corrective mutation.
- The copyable support packet is whitelisted and excludes arbitrary evidence, secret values, customer records, message contents and provider credentials.
- Refresh is manual and bounded. No permanent polling or automatic email/SMS/push/third-party alert delivery is introduced.
- GitHub/Cloudflare exact-SHA release acceptance remains authoritative for Production GREEN.

## Retained operating contract

- Readiness classifications remain `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, and `unavailable`.
- Unavailable is not automatically failure. Required missing runtime evidence may remain a HOLD.
- Canonical checkout remains server-authoritative for availability, booking and payment outcomes; business mutations are never queued/replayed automatically on reconnect.
- Customer communication remains current-consent gated at dispatch time; stale queued consent/channel/recipient evidence fails closed.
- Public SEO remains one meaningful H1 per indexable page with truthful Oxford/Norfolk proof.
- Representative phone/tablet/desktop support remains mandatory; source checks are not independent visual-browser proof.
- Durable field-to-office handoff authority remains `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`.
- Inventory/job-cost evidence remains retained through `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`.
- Maintenance/fleet commercial evidence remains retained through `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`.
- Communication/consent evidence remains retained through `BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md`.

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
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, active roadmap, current contract and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline.
