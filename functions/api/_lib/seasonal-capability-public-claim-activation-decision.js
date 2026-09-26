// Build 506 — Seasonal Capability & Public Claim Activation Decision.
// Read-only final owner activation-decision preparation over the retained Build 498 seasonal chain.
import { buildControlledEnvironmentSiteQualificationServiceRoutingEvidence } from "./controlled-environment-site-qualification-service-routing-evidence.js";

const ACTIVATION_DECISIONS = new Set(["approve_public_claim_activation","hold_public_claim_activation"]);

export function buildSeasonalCapabilityPublicClaimActivationDecision({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildControlledEnvironmentSiteQualificationServiceRoutingEvidence({
    economics, fleet, pricing, source_status, generated_at
  });
  const retained = base?.economics?.seasonal_owner_review_public_claim || {};
  const retainedRows = Array.isArray(retained.rows) ? retained.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const rows = [];
  const gaps = [];

  for (const row of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, row)) || {};
    const activation = activationReview(source);
    const wordingConfirmed = source.public_claim_activation_wording_confirmed === true;
    const retainedReady = row.publication_review_ready === true;
    const proposedWording = clean(row.proposed_service_specific_public_wording) || null;
    const currentEvidence = row.capability_evidence_current === true;

    const decisionReady =
      retainedReady &&
      currentEvidence &&
      Boolean(proposedWording) &&
      wordingConfirmed &&
      activation.valid &&
      activation.decision === "approve_public_claim_activation";

    let decisionState = "activation_owner_review_required";
    if (activation.valid && activation.decision === "hold_public_claim_activation") {
      decisionState = "owner_hold";
    } else if (decisionReady) {
      decisionState = "public_claim_activation_decision_ready";
    }

    const missing = [];
    if (!retainedReady) missing.push("build496_publication_review_ready");
    if (!currentEvidence) missing.push("current_capability_evidence");
    if (!proposedWording) missing.push("service_specific_public_wording");
    if (!wordingConfirmed) missing.push("final_service_specific_wording_confirmation");
    if (!activation.valid) {
      if (!activation.decision) missing.push("explicit_public_claim_activation_decision");
      if (!activation.reviewed_at) missing.push("dated_public_claim_activation_review");
      if (!activation.reference) missing.push("attributable_public_claim_activation_reference");
    }

    rows.push(Object.freeze({
      entity_type: row.entity_type,
      code: row.code,
      classification: row.classification,
      retained_public_claim_decision_state: row.decision_state,
      retained_publication_review_ready: retainedReady,
      capability_evidence_current: currentEvidence,
      source_owned_temperature_limit_text: row.source_owned_temperature_limit_text || null,
      proposed_service_specific_public_wording: proposedWording,
      public_claim_activation_decision: activation.decision,
      public_claim_activation_reviewed_at: activation.reviewed_at,
      public_claim_activation_reference: activation.reference,
      public_claim_activation_wording_confirmed: wordingConfirmed,
      activation_decision_state: decisionState,
      public_claim_activation_decision_ready: decisionReady,
      public_claim_scope: "service_specific_only",
      manual_publication_required: true,
      automatic_publication_authorized: false,
      broad_winter_availability_authorized: false,
      automatic_booking_or_quote_change_authorized: false,
      customer_facing_promise_beyond_reviewed_wording_authorized: false
    }));

    if (missing.length) {
      gaps.push(Object.freeze({
        entity_type: row.entity_type,
        code: row.code,
        missing: Object.freeze(missing),
        safe_default: decisionState === "owner_hold"
          ? "retain_owner_hold"
          : "retain_public_claim_activation_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    public_claim_activation_decision_ready: rows.filter((row) => row.public_claim_activation_decision_ready).length,
    owner_hold: rows.filter((row) => row.activation_decision_state === "owner_hold").length,
    activation_owner_review_required: rows.filter((row) => row.activation_decision_state === "activation_owner_review_required").length
  });

  return Object.freeze({
    ...base,
    seasonal_public_claim_activation_build: 506,
    seasonal_public_claim_activation_authority: "seasonal_capability_public_claim_activation_decision",
    retained_owner_public_claim_authority: "seasonal_capability_owner_review_public_claim_decision",
    retained_site_qualification_authority: "controlled_environment_site_qualification_service_routing_evidence",
    economics: Object.freeze({
      ...(base.economics || {}),
      seasonal_public_claim_activation_decision: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "prepared",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_owner_decisions: Object.freeze([...ACTIVATION_DECISIONS]),
        manual_publication_required: true,
        automatic_publication_authorized: false,
        broad_winter_availability_authorized: false,
        source_owned_temperature_limits_must_be_preserved: true,
        service_specific_claim_only: true
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      activation_decision_ready_is_publication: false,
      activation_decision_ready_authorizes_broad_winter_claim: false,
      final_owner_decision_may_widen_source_owned_temperature_limit: false,
      customer_wording_may_be_inferred: false,
      weather_demand_margin_search_or_uptime_authorizes_activation: false,
      missing_activation_decision_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_publication_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_customer_message_allowed: false,
      automatic_outreach_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function activationReview(source = {}) {
  const decision = clean(source.public_claim_activation_decision).toLowerCase();
  const reviewedAt = validDate(source.public_claim_activation_reviewed_at)
    ? clean(source.public_claim_activation_reviewed_at)
    : null;
  const reference = clean(source.public_claim_activation_reference) || null;
  const validDecision = ACTIVATION_DECISIONS.has(decision);
  return Object.freeze({
    decision: validDecision ? decision : null,
    reviewed_at: reviewedAt,
    reference,
    valid: validDecision && Boolean(reviewedAt) && Boolean(reference)
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase();
  const code = clean(target.code);
  if (!code) return false;
  const normalizedSourceType = clean(source.entity_type).toLowerCase();
  const normalizedSourceCode = clean(source.code);
  if (normalizedSourceType && normalizedSourceCode) return normalizedSourceType === type && normalizedSourceCode === code;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function validDate(value) {
  const raw = clean(value);
  return Boolean(raw) && Number.isFinite(Date.parse(raw));
}
function clean(value) { return String(value ?? "").trim(); }
