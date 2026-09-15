# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening** is the active bounded release.
- **Build 405 — Production Hardening, Consolidation & Next-Roadmap Renewal** is next only after protected `main` and exact Production evidence are GREEN.
- No database migration, Production business-data mutation, R2 destructive mutation, DNS/secret mutation, accounting/inventory posting, customer charge/refund, provider mutation, automatic outreach or customer mutation is authorized by this source release.
- `main` remains governed by `rd main protection`; missing/unobservable protection is AMBER, never inferred GREEN.

## Current recovery / weak-connection contract

- The retained Build 380 booking-recovery path remains tab-scoped and canonical checkout remains the server authority for availability, booking and payment outcomes.
- Offline or weak-connection UI must say that local/in-progress state is not accepted business state until the server confirms it.
- Bounded automatic retry is permitted only for safe read methods (`GET`/`HEAD`); business mutations are never queued or replayed automatically on reconnect.
- Protected local draft convenience uses `sessionStorage`, has an expiry, and rejects password, payment, provider-token, secret, authorization and file fields.
- Restored workflows require stale-condition review where availability, scope, pricing or other authoritative evidence may have changed.
- Duplicate-submit protection may lock the initiating control but cannot manufacture a success state; the server response remains authoritative.
- Upload convenience must expose progress, failure and explicit manual retry; upload failure is not represented as accepted server state.
- Partial reads must be visibly labeled as partial and cannot be treated as complete evidence.
- No local/offline artifact, cached response or convenience helper may masquerade as a successful booking, payment, accounting, inventory, provider or customer mutation.

## Retained customer / service contract

- Authenticated booking history for retention guidance remains linked only through exact `customer_profile_id`.
- Prior completed service remains advisory only; current catalog, vehicle condition, availability, scope and price are reconfirmed by the authoritative booking flow.
- Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data, truthful Oxford/Norfolk claims and genuine proof only.

## Responsive / interaction contract

- Shared phone/tablet/desktop acceptance remains mandatory for materially changed surfaces.
- Truthful loading/error/empty/retry states remain visible.
- Dormant modules remain event-driven; permanent polling requires a separately authorized demonstrated need.

## Accepted operating contract

- `dev` is Development; protected `main` is Production source.
- A feature candidate must pass its focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate SHA and must pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; do not bypass `rd main protection`. Prefer a merge commit so the accepted Development SHA remains explicit in Production ancestry.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- The resulting `main` head is the exact Production source SHA and must independently pass **Production deployment/runtime/business acceptance**.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Database migrations remain separate explicit acceptance boundaries.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_396_405.md`
- `BUILD404_ERROR_RECOVERY_WEAK_CONNECTION_RELIABILITY.md`
- `.github/workflows/error-recovery-weak-connection-reliability-authority.yml`
- `scripts/build404_error_recovery_weak_connection_reliability_check.py`
- `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md`
- `.github/workflows/customer-retention-rebooking-service-guidance-seo-growth-authority.yml`
- `scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py`
- `BOOKING_RECOVERY_FAILURE_HANDLING.md`
- `.github/workflows/booking-recovery-failure-handling-authority.yml`
- `scripts/booking_recovery_failure_handling_check.py`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Start from the latest accepted GitHub checkpoint, then read this file, the release queue, forward roadmap, current contract, release governance and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release GREEN.
