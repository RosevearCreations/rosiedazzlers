# Rosie Dazzlers — Forward Build Roadmap 378–385

**Planning boundary:** Builds 376–377 remain the official completion sequence of `FORWARD_BUILD_ROADMAP_356_377.md`. This document preserves the agreed autonomous phase that follows them so future work is not lost between chat/release handoffs.

## Sequence

### Build 378 — Release Authority & Documentation Convergence
Bring `AI_PROJECT_HANDOFF.md`, `AUTONOMOUS_RELEASE_QUEUE.md`, the active forward roadmap and release references up to the actual Build 377 boundary. Add dependable Production exact-SHA identity/proof where the platform permits it; never infer Production runtime identity from source promotion alone.

### Build 379 — Production Observability & Self-Diagnostics
Strengthen the I.T. cockpit around deployment identity, Supabase connectivity, R2/media health, authentication, critical API availability, payment configuration state, failing dependencies and corrective instructions. Keep checks operator-driven or appropriately event-driven rather than permanent polling.

### Build 380 — Booking Recovery & Failure Handling
Harden interrupted booking sessions, stale availability, duplicate submission, 409 collisions, deposit/payment recovery, refresh/back-button behavior and customer-safe retry paths while keeping server-authoritative booking, availability and payment rules intact.

### Build 381 — Operations Daily Command Centre
Consolidate today's appointments, readiness, travel/site conditions, customer/vehicle context, outstanding balance, required equipment/products, staff assignment, completion and follow-up into one practical Operations read/work surface without creating duplicate ledgers.

### Build 382 — Customer Account & Retention UX Convergence
Converge My Account, vehicle timelines, completed services, rebooking, quotes, maintenance enrollment, communication preferences/consent and genuine review status into one coherent customer experience using existing authorities.

### Build 383 — Mobile Detailer Field Workflow Hardening
Make the Detailer Mobile workflow field-ready across arrival/readiness, keys/access, before photos, checklist execution, approved add-ons, product usage, completion evidence, after photos and customer/final-balance handoff. Preserve staff authorization and customer privacy boundaries.

### Build 384 — Finance Cockpit & Month-End UX
Present the retained financial authorities as a clear operator workflow from quote and deposit through approved changes, final balance, refunds/tips, settlement reconciliation, HST support, month-end close and accountant package. Keep posting/provider mutation/manual approval boundaries fail-closed.

### Build 385 — Backup, Restore & Release Recovery Drill
Prove rollback and recovery readiness from a bad deployment or operational failure: application SHA rollback evidence, database-boundary verification, media preservation, configuration/DNS/provider recovery ownership and a documented operator recovery path. The drill is observation-only and does not mutate Production business data merely to demonstrate readiness.

## Continuation

### Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal
Close the 378–385 phase after exact-SHA Production acceptance, record the newly accepted synchronized baseline through live Git/workflow evidence rather than stale prose, retire temporary recovery-only references where appropriate, and establish the next bounded forward roadmap. Keep this release documentation/authority focused and avoid business-data mutation merely to advance planning.

## Continuing release rules

- One bounded authority improvement per build.
- Start from the latest exact synchronized `dev`/`main` release boundary.
- Exact Development SHA must be GREEN before Production promotion.
- Promote the exact tested SHA to `main` by non-force fast-forward unless an explicitly documented exception is authorized.
- Database migrations remain explicit acceptance boundaries, never incidental runtime side effects.
- Preserve customer/staff privacy, server-authoritative access, one meaningful H1 per indexable public page and current catalog/pricing/booking/payment authority.
- Never fabricate provider, payment, consent, review, SEO-verification, accounting, tax, deployment, backup or recovery evidence.
- Keep dormant modules event-driven and avoid permanent polling unless a demonstrated operational need justifies it.