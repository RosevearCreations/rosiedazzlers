# Build 546 — Seasonal Owner Evidence Closure & Public Claim Decision Readiness

## Scope
Read-only, service-specific owner evidence/decision workbench within the authenticated Administration service-economics review. Uses retained seasonal evidence and Build 536 public-claim integrity; does not infer new empirical field observations. The report is calculated on GET and is not persisted.

## Readiness requirements
Each package, add-on or service is identified independently. A publication-decision review candidate requires exactly one current attributable owning evidence row, an explicit source type/reference, known service classification, retained Build 536 integrity, dated owner approval/reference (within 30 days), and owner-confirmed service-specific wording. Outdoor temperature-limited claims also require an exact source-owned minimum working temperature and support flag. Controlled-environment service claims require evidenced site/workflow capability. A prior outcome with a lower threshold than the current source is contradictory, never permission to widen the limit.

A dated attributable `hold_public_claim_activation` decision may be summarized as `retain_hold_confirmed_for_manual_review`, but does not narrow the canonical HOLD. A dated owner `approve_public_claim_activation` decision meeting all safeguards is only `publication_decision_ready_for_manual_review`, **not published**. All other records remain owner-evidence review or unavailable. Duplicate identifiers, missing evidence, unsupported generic "all winter" wording, missing dates, future/stale dates, source identity drift and missing Build 536 integrity fail closed to HOLD.

## Staff interface
Authenticated GET `/api/admin/service_economics_commercial_capacity_review` returns `economics.seasonal_owner_public_claim_readiness`. The existing protected review screen shows service-specific classification, cited owning evidence source, source-owned temperature minimum (if recorded), owner action/date/reference, reviewed wording, missing/re-review reasons and safe default. Nothing is automatically saved or published.

## Boundaries
No Supabase table/migration, R2 object, telemetry, pricing, payment/refund, customer messaging, booking/quote/availability, public wording, canonical HOLD, automatic service claim, or Production restore mutation. Provider/business/owner evidence cannot be substituted by source CI, GitHub promotion, or Cloudflare uptime. Operating limits for Southern Ontario mobile detailing remain service/product/equipment/site/process-specific.

## Acceptance
Focused Build 546 JavaScript regression and source-wiring authority; retained Build 536/526/516/506 authorities; Current Source Gate; exact feature/Development checks; protected `main` promotion; then independent exact-main Cloudflare Production deployment/runtime/business acceptance. Source GREEN is not Production GREEN.

## Queue
Next: **Build 547 — Winter Booking Rule Observed Safety & Transparency** after independent Build 546 Production GREEN.
