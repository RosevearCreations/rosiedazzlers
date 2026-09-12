# Rosie Dazzlers — Forward Build Roadmap 386–395

**Planning boundary:** Build 385 is the accepted synchronized recovery/readiness boundary. Build 386 renews the living release authority after the completed 378–385 phase. Exact identities are resolved from live Git refs and workflow evidence rather than pinned into this roadmap.

## Sequence

### Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal
Close the completed 378–385 phase, move the living handoff/queue/README/convergence guard onto this roadmap, re-baseline the Development/go-live blocker surface, retire temporary recovery-only workflow coupling from ordinary release pushes, and preserve recovery material as retained specialist authority. Keep the release schema-neutral and mutation-free.

### Build 387 — Release Governance & Branch Protection Readiness
Harden the proven feature → `dev` → protected `main` release path around non-force Development promotion, the active `rd main protection` pull-request boundary, stage-specific exact-SHA gate evidence, stale-check discrimination and operator recovery. Fail closed when protection or required status evidence cannot be observed; do not weaken gates merely to make a promotion pass.

### Build 388 — Service, Add-On & Commercial Accuracy Convergence
Revisit packages and every customer-facing add-on against the current business model. Expand variable-scope services such as headlights, extraction/restoration, odor, pet hair, paint correction and protection so pricing language, condition factors, inclusions/exclusions, duration expectations and quote/escalation rules are commercially realistic without inventing fixed economics where inspection is required.

### Build 389 — Local SEO, Service Landing & Proof Convergence
Bring service and town-focused pages onto one coherent public authority: one meaningful H1, unique metadata/canonical/structured data, truthful Oxford/Norfolk coverage, current pricing/catalog references, genuine review/proof evidence and privacy-approved before/after media. Eliminate stale/fallback content rather than duplicating near-identical pages.

### Build 390 — Booking, Quote & Condition-Based Estimate Hardening
Improve booking and quote flows for work whose scope changes materially with vehicle condition. Preserve server-authoritative availability, package/add-on compatibility, current pricing and deposit rules while making inspection-required ranges, escalation, customer approval and retry/recovery behavior explicit.

### Build 391 — Photo Studio & R2 Media Reliability
Converge public/admin media assignment, before/after sets, multi-placement, assignment visibility, unassign/reset, delete-unassigned safeguards and bounded R2 synchronization. Prevent enumeration storms, duplicate work and fallback-image drift; keep private DAIP media isolated from public manifests.

### Build 392 — Retention, Maintenance & Fleet Commercial Activation
Turn the already-established retention, maintenance and fleet authorities into practical operator/customer workflows using approved business rules only. Keep recurring billing, discounts, route economics, fleet pricing and automated outreach evidence-gated rather than inferred.

### Build 393 — Operations, Inventory & Job-Cost Evidence
Converge job readiness, consumable/product usage, inventory depletion, reorder evidence, approved substitutions and per-job cost capture without creating a second inventory ledger. Preserve idempotency, reversal, shortage and staff-authorization boundaries.

Implementation authority for Build 393 is schema-neutral and read-only: `catalog_inventory_movements` remains the canonical movement ledger, `catalog_inventory_items` remains inventory/cost authority, and `catalog_purchase_orders` remains reorder authority. Booking-scoped evidence nets reversal/adjustment movements against depletion, ignores duplicate replay evidence, exposes reorder/substitution provenance when recorded, and calculates material costs only from recorded inventory costs. Missing movement evidence is `unavailable`; missing recorded cost, low stock without reorder evidence, or incomplete substitution provenance fails closed to `review`. Build 393 does not mutate inventory, purchase orders, accounting, payments, providers, R2 or Production business data.

Acceptance requires the focused `Build 393 — Operations, Inventory & Job-Cost Evidence Authority` plus the normal exact-SHA feature, Development, protected-main and Production gates.

### Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance
Drive the existing Finance cockpit through evidence-backed deposit/final balance/refund/fee/HST/reconciliation/month-end/export scenarios. Missing financial evidence remains review/unavailable; accounting posting and provider mutation stay behind explicit authorization.

### Build 395 — Production Business Acceptance & Growth Readiness
Run a whole-platform acceptance pass across anonymous acquisition, service discovery, booking, customer account, field execution, proof/media, payment/finance, retention, maintenance/fleet, admin/I.T. diagnostics, performance/accessibility/security and recovery. Production is GREEN only with exact Production-SHA deployment/runtime proof plus retained business-path acceptance and protected-main release evidence.

## Continuing release rules

- One bounded authority improvement per build.
- Start from the latest accepted `dev` boundary and the latest accepted protected `main` Production boundary.
- Feature candidates must pass focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- Exact Development SHA must be GREEN before Production promotion.
- Advance `dev` only by non-force fast-forward to the accepted candidate SHA.
- Promote Development-GREEN source to `main` through the active `rd main protection` pull-request path; do not bypass protection to preserve an obsolete direct-push workflow.
- Prefer a merge commit for protected-main promotion so the accepted Development SHA remains explicit in Production ancestry.
- After merge, the resulting `main` head is the exact Production SHA and must receive its own Cloudflare deployment/runtime/business acceptance.
- Database migrations remain explicit acceptance boundaries, never incidental runtime side effects.
- Preserve customer/staff privacy, server-authoritative permissions and genuine provider/payment/consent/review/accounting/tax evidence.
- Preserve one meaningful H1 per indexable public page and truthful local/service content.
- Current catalog, pricing, availability, booking and payment rules override stale historical commercial data.
- Keep dormant modules event-driven and avoid permanent polling unless a demonstrated operational need justifies it.
- Never fabricate deployment, backup, recovery, SEO-verification, provider or business evidence.
