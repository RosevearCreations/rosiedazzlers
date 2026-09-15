# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities must be resolved from live refs and exact-SHA evidence.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth** is the active bounded release.
- **Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening** is next only after protected `main` and exact Production evidence are GREEN.
- No database migration, Production business-data mutation, R2 destructive mutation, DNS/secret mutation, accounting/inventory posting, customer charge/refund, provider mutation, automatic outreach or customer mutation is authorized by this source release.
- `main` remains governed by `rd main protection`; missing/unobservable protection is AMBER, never inferred GREEN.

## Current retention / service guidance contract

- Authenticated booking history for retention guidance is linked only through exact `customer_profile_id`; fuzzy identity and email-based booking matching are not accepted for this projection.
- Rebooking guidance is available only when exact completed-service package code, vehicle size and service date evidence exists.
- A prior completed service is an advisory starting point only. The existing booking flow must reconfirm current catalog, vehicle condition, availability, scope and price before a booking is created.
- No persistent customer scoring, inferred outreach consent, automatic outreach, booking write or automatic service substitution is authorized.
- Missing completed-service evidence remains `unavailable` or `insufficient` rather than guessed.

## Public service / SEO contract

- Every current public add-on/specialty landing route receives a professional condition-aware process breakdown, assessment factors, timing limits and customer approval path through the shared landing authority.
- Paint correction covers assessment, decontamination, test-spot/correction planning, correction/refinement and protection.
- Odor remediation distinguishes source removal, cleaning/extraction, drying/reinspection and final neutralizing treatment.
- Water extraction / flooded-floor restoration has a dedicated public page covering extraction, seat/trim/carpet access where required, trapped-moisture inspection, drying, cleaning, mold/rust-risk mitigation and deodorization.
- Light cases may be comparatively simple; severe contamination, correction, saturation or embedded material may require several hours. Fixed repair time or guaranteed outcome is not promised before inspection.
- Products, equipment, labour and duration depend on actual condition/severity; materially expanded work requires customer approval before proceeding.
- Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data, truthful Oxford/Norfolk claims and genuine proof only.

## Responsive / interaction contract

- Shared phone/tablet/desktop acceptance remains mandatory for materially changed surfaces.
- Account guidance and public service sections retain usable touch targets and responsive layouts.
- Truthful loading/error/empty states remain visible.
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
- `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md`
- `.github/workflows/customer-retention-rebooking-service-guidance-seo-growth-authority.yml`
- `scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py`
- `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md`
- `.github/workflows/admin-operations-cockpit-growth-experiment-authority.yml`
- `scripts/build402_admin_operations_cockpit_growth_experiment_check.py`
- `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md`
- `.github/workflows/job-handoff-commercial-evidence-authority.yml`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/cloudflare-development-acceptance.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Start from the latest accepted GitHub checkpoint, then read this file, the release queue, forward roadmap, current contract, release governance and go-live blockers. Preserve exact feature → Development → protected-main PR → exact Production acceptance discipline and require observed Production runtime proof before calling a release GREEN.
