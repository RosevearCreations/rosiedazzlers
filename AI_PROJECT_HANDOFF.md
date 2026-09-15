# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 406 — Go-Live Evidence & Provider Readiness Convergence** is the active bounded release.
- **Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** is next only after protected `main` and exact Production evidence for Build 406 are GREEN.
- Active forward authority: `FORWARD_BUILD_ROADMAP_405_415.md`.
- Current Build 406 contract: `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`.
- Retained Build 405 capstone: `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`.
- No database migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, accounting/inventory posting, customer charge/refund, provider mutation, automatic outreach or customer mutation is authorized by Build 406.
- `main` remains governed by protected-main pull-request release mechanics; protection must not be bypassed or inferred GREEN.

## Current go-live readiness contract

- `/admin/it.html` is the current operator-facing readiness surface.
- `/api/admin/go_live_readiness` is authenticated, bounded and read-only; it supports current evidence collection without provider/business mutation.
- Every readiness item is classified as `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, or `unavailable`.
- Unavailable is not failure. Missing evidence may still be a launch HOLD when required, but it is never converted into fabricated success or fabricated failure.
- Configuration presence may be `source_ready`; it does not prove a Stripe/PayPal transaction, webhook/refund, message delivery or other provider outcome.
- Runtime evidence may be `runtime_proven` only when the current deployed environment is actually observed through a bounded read-only check.
- Search Console/Google Business Profile proof, backup/export proof and independent representative phone/tablet/desktop visual-browser evidence remain owner/provider evidence where automation cannot truthfully establish them.
- Retained `/api/admin/production_diagnostics` remains deeper troubleshooting evidence and does not replace exact-SHA release acceptance.

## Retained capstone / recovery / customer contract

- Build 405 remains the retained capstone authority across visitor/public discovery → booking/checkout → Customer → Detailer → Operations → payment/accounting → exact Production runtime.
- Canonical checkout remains the server authority for availability, booking and payment outcomes; business mutations are never queued or replayed automatically on reconnect.
- Authenticated booking history remains linked only through exact `customer_profile_id`; prior service is advisory and current catalog, condition, availability, scope and price are reconfirmed.
- Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data, truthful Oxford/Norfolk claims and genuine proof only.
- Truthful loading/error/empty/retry states remain visible and dormant modules remain event-driven.

## Accepted operating contract

- `dev` is Development; protected `main` is Production source.
- A feature candidate must pass its focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; do not bypass release protection. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.
- The resulting `main` head is the exact Production source SHA and must independently pass Production deployment/runtime/business acceptance.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any source write after exact-SHA acceptance invalidates that acceptance and requires revalidation.
- Database migrations and provider/business mutations remain separate explicit acceptance boundaries.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_405_415.md`
- `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md`
- `.github/workflows/go-live-evidence-provider-readiness-convergence-authority.yml`
- `scripts/build406_go_live_evidence_provider_readiness_convergence_check.py`
- `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md`
- `.github/workflows/full-responsive-production-acceptance-roadmap-renewal-authority.yml`
- `scripts/build405_full_responsive_production_acceptance_roadmap_renewal_check.py`
- `BUILD404_ERROR_RECOVERY_WEAK_CONNECTION_RELIABILITY.md`
- `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `BOOKING_RECOVERY_FAILURE_HANDLING.md`
- `STARTUP_GO_LIVE_BLOCKERS.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Start from the latest accepted GitHub checkpoint, then read this file, the release queue, active roadmap, Build 406 contract, retained Build 405 capstone, release governance and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release GREEN.
