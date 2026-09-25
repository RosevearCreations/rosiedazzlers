// Build 496 — Seasonal Capability Owner Review & Public Claim Decision.
// Read-only owner/public-claim decision preparation over the retained Build 488 routing authority.
import { buildControlledEnvironmentWeatherSafeRouting } from "./controlled-environment-weather-safe-routing.js";

const OWNER_DECISIONS = new Set(["approve_public_claim_review","hold_public_claim"]);

export function buildSeasonalCapabilityOwnerReviewPublicClaimDecision({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildControlledEnvironmentWeatherSafeRouting({ economics, fleet, pricing, source_status, generated_at });
  const routing = base?.economics?.weather_safe_routing || {};
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const routingRows = Array.isArray(routing.rows) ? routing.rows : [];
  const rows = [];
  const gaps = [];

  for (const route of routingRows) {
    const source = sourceRows.find((row) => sameEntity(row, route)) || {};
    const review = ownerReview(source);
    const evidenceCurrent = source.capability_evidence_current === true || source.evidence_current === true;
    const proposed = clean(route.customer_guidance_draft);
    const routeSupported = clean(route.routing_state) !== "owner_review_required";
    const reviewReady =
      review.decision === "approve_public_claim_review" &&
      review.valid &&
      evidenceCurrent &&
      routeSupported &&
      Boolean(proposed);

    let decisionState = "owner_review_required";
    if (review.decision === "hold_public_claim" && review.valid) decisionState = "owner_hold";
    else if (reviewReady) decisionState = "publication_review_ready";

    const missing = [];
    if (!evidenceCurrent) missing.push("current_capability_evidence_confirmation");
    if (!review.valid) {
      if (!review.decision) missing.push("explicit_owner_review_decision");
      if (!review.reviewed_at) missing.push("dated_owner_review");
      if (!review.reference) missing.push("attributable_owner_review_reference");
    }
    if (!routeSupported) missing.push("supported_weather_safe_route");
    if (!proposed) missing.push("proposed_service_specific_public_wording");

    rows.push(Object.freeze({
      entity_type: route.entity_type,
      code: route.code,
      classification: route.classification,
      retained_routing_state: route.routing_state,
      source_owned_temperature_limit_text: route.source_owned_temperature_limit_text || null,
      proposed_service_specific_public_wording: proposed || null,
      capability_evidence_current: evidenceCurrent,
      owner_review_decision: review.decision || null,
      owner_reviewed_at: review.reviewed_at,
      owner_review_reference: review.reference,
      decision_state: decisionState,
      publication_review_ready: reviewReady,
      public_claim_scope: "service_specific_only",
      automatic_publication_authorized: false,
      automatic_booking_change_authorized: false,
      broad_winter_availability_claim_authorized: false
    }));

    if (missing.length) {
      gaps.push(Object.freeze({
        entity_type: route.entity_type,
        code: route.code,
        missing: Object.freeze(missing),
        safe_default: decisionState === "owner_hold" ? "retain_owner_hold" : "retain_public_claim_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    publication_review_ready: rows.filter((row) => row.publication_review_ready).length,
    owner_hold: rows.filter((row) => row.decision_state === "owner_hold").length,
    owner_review_required: rows.filter((row) => row.decision_state === "owner_review_required").length,
    current_capability_evidence: rows.filter((row) => row.capability_evidence_current).length
  });
  const status = rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared";

  return Object.freeze({
    ...base,
    seasonal_owner_review_enrichment_build: 496,
    seasonal_owner_review_authority: "seasonal_capability_owner_review_public_claim_decision",
    retained_weather_safe_routing_authority: "controlled_environment_alternatives_weather_safe_routing",
    economics: Object.freeze({
      ...(base.economics || {}),
      seasonal_owner_review_public_claim: Object.freeze({
        status,
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_owner_decisions: Object.freeze([...OWNER_DECISIONS]),
        broad_winter_availability_claim_authorized: false,
        automatic_publication_authorized: false,
        automatic_booking_or_quote_rule_change_authorized: false,
        owner_review_required_before_publication: true,
        service_specific_claim_only: true
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      owner_review_without_current_capability_evidence_authorizes_claim: false,
      source_runtime_green_authorizes_public_claim: false,
      service_specific_review_ready_authorizes_broad_winter_claim: false,
      weather_or_demand_creates_owner_approval: false,
      missing_owner_review_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_publication_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_eligibility_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      schema_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function ownerReview(source = {}) {
  const decision = clean(source.owner_review_decision).toLowerCase();
  const reviewedAt = validDate(source.owner_reviewed_at) ? clean(source.owner_reviewed_at) : null;
  const reference = clean(source.owner_review_reference) || null;
  const decisionValid = OWNER_DECISIONS.has(decision);
  return Object.freeze({
    decision: decisionValid ? decision : null,
    reviewed_at: reviewedAt,
    reference,
    valid: decisionValid && Boolean(reviewedAt) && Boolean(reference)
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase();
  const code = clean(target.code);
  if (!code) return false;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function validDate(value) {
  const raw = clean(value);
  return Boolean(raw) && Number.isFinite(Date.parse(raw));
}
function clean(value){ return String(value ?? "").trim(); }
