# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

**Build 410 — Maintenance / Fleet Commercial Acceptance** is the active bounded release.

**Build 411 — Customer Communication, Consent & Delivery Evidence** is next only after the current release is independently GREEN on protected `main`.

Retained go-live readiness authority comes from `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_405_415.md`. Current contract: `BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md`.

This source release authorizes no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, accounting/inventory posting, customer mutation, automatic outreach or automatic booking.

## Current maintenance/fleet commercial contract

- Maintenance commercial authority remains `config/maintenance-plan-business-rulebook.json`; all seven decision domains currently remain explicit owner action.
- Fleet commercial authority remains `config/fleet-business-rulebook.json`; all six decision domains currently remain explicit owner action.
- Source release GREEN is distinct from explicit owner approval of business terms.
- Capacity remains subordinate to `/api/availability` and final `/api/checkout` collision/revalidation.
- Draft/sent fleet quotes are not customer commitments; accepted evidence needs accepted status, timestamp and positive recorded amounts.
- No pricing, customer commitment, capacity reservation, outreach, booking, discount, invoice, recurring billing, renewal or provider result is inferred.
- Current commercial acceptance is schema-neutral and read-only.

## Current payment-provider contract

- `/admin/it.html` remains the single current operator readiness surface.
- `/api/admin/go_live_readiness` is authenticated, bounded and read-only.
- Provider configuration is source evidence only; it never proves a transaction.
- Provider GREEN requires persisted verified webhook evidence with a definitive non-pending `settled`, `replayed`, or `refund_recorded` state.
- Provider-event identity must link to the internal payment-request identity.
- The linked payment must reconcile exact paid amount, valid currency, paid-like status and paid timestamp.
- The readiness endpoint performs no Stripe/PayPal provider contact and never creates, captures, refunds or replays payment activity.
- Missing evidence remains `provider_dependent` or `unavailable`; it is never fabricated as success.
- Source/Production release GREEN remains distinct from live-payment readiness GREEN.

## Retained operating contract

- Readiness classifications remain `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, and `unavailable`.
- Unavailable is not automatically failure. Required missing runtime evidence may remain a HOLD.
- Canonical checkout remains server-authoritative for availability, booking and payment outcomes; business mutations are never queued/replayed automatically on reconnect.
- Authenticated booking history remains linked through exact `customer_profile_id`; current catalog, condition, availability, scope and price are reconfirmed.
- Public SEO remains one meaningful H1 per indexable page with truthful Oxford/Norfolk proof.
- Representative phone/tablet/desktop support remains mandatory; source checks are not independent visual-browser proof.
- Durable field-to-office handoff authority remains `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`.
- Inventory/job-cost evidence remains retained through `BUILD409_INVENTORY_JOB_COST_OPERATIONAL_EVIDENCE.md`.

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
