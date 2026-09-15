# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

**Build 406 — Go-Live Evidence & Provider Readiness Convergence** is the active bounded release.

**Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** is next only after the current release is independently GREEN on protected `main`.

Retained capstone authority comes from Build 405 through `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_405_415.md`. Current contract: `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`.

This source release authorizes no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, accounting/inventory posting, customer mutation, automatic outreach or automatic booking.

## Current readiness contract

- `/admin/it.html` is the single current operator readiness surface.
- `/api/admin/go_live_readiness` is authenticated, bounded and read-only.
- Readiness classifications are `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, and `unavailable`.
- Unavailable is not automatically failure. Required missing evidence may remain a HOLD, but missing evidence is never converted into invented success/failure.
- Configuration presence may establish source readiness; it does not prove Stripe/PayPal transaction outcomes, message delivery, Search Console/GBP proof, backup/export proof, or independent visual-browser acceptance.
- Current runtime evidence may become `runtime_proven` only through bounded observation of the deployed environment.
- Retained `/api/admin/production_diagnostics` remains deeper troubleshooting evidence and does not replace exact-SHA release acceptance.

## Retained operating contract

- Canonical checkout remains server-authoritative for availability, booking and payment outcomes; business mutations are never queued/replayed automatically on reconnect.
- Authenticated booking history remains linked through exact `customer_profile_id`; current catalog, condition, availability, scope and price are reconfirmed.
- Public SEO remains one meaningful H1 per indexable page with truthful Oxford/Norfolk proof.
- Representative phone/tablet/desktop support remains mandatory; source checks are not independent visual-browser proof.
- Durable field-to-office handoff authority remains `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`.

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
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `.github/workflows/go-live-evidence-provider-readiness-convergence-authority.yml`
- `scripts/build406_go_live_evidence_provider_readiness_convergence_check.py`
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
