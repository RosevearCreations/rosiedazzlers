// Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review.
// Read-only integrity verification over Build 526 freshness review and current service-specific owning evidence.
import { buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview } from "./controlled-environment-routing-outcome-freshness-capacity-review.js";

const CURRENT_STATES = new Set(["publication_current","retain_hold_current","no_action_current"]);

export function buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview({
    economics, fleet, pricing, source_status, generated_at, freshness_window_days
  });
  const freshness = base?.economics?.seasonal_public_claim_outcome_freshness_review || {};
  const freshnessRows = Array.isArray(freshness.rows) ? freshness.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows : [];
  const windowDays = Math.max(1, Math.min(365, Number(freshness_window_days) || Number(freshness.freshness_window_days) || 30));
  const rows = [], gaps = [];

  for (const retained of freshnessRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const currentSourceType = clean(source?.evidence_source_type) || null;
    const currentSourceReference = clean(source?.evidence_source) || null;
    const snapshotSourceType = clean(source?.public_claim_outcome_owning_evidence_source_type) || null;
    const snapshotSourceReference = clean(source?.public_claim_outcome_owning_evidence_source) || null;
    const sourceIdentityRecorded = Boolean(currentSourceType && currentSourceReference && snapshotSourceType && snapshotSourceReference);
    const sourceIdentityMatches = sourceIdentityRecorded &&
      normalizeToken(currentSourceType) === normalizeToken(snapshotSourceType) &&
      currentSourceReference === snapshotSourceReference;

    const currentOwnerActionReference = clean(source?.public_claim_outcome_reference) || null;
    const snapshotOwnerActionReference = clean(source?.public_claim_outcome_owner_action_reference) || null;
    const ownerActionIdentityRecorded = Boolean(currentOwnerActionReference && snapshotOwnerActionReference);
    const ownerActionIdentityMatches = ownerActionIdentityRecorded && currentOwnerActionReference === snapshotOwnerActionReference;

    const published = retained.current_public_claim_outcome === "published";
    const currentPublicationReference = clean(source?.public_claim_publication_reference) || null;
    const snapshotPublicationReference = clean(source?.public_claim_outcome_publication_reference) || null;
    const publicationIdentityRecorded = !published || Boolean(currentPublicationReference && snapshotPublicationReference);
    const publicationIdentityMatches = !published || (publicationIdentityRecorded && currentPublicationReference === snapshotPublicationReference);

    const freshnessState = clean(retained.freshness_state) || "predecessor_outcome_review_required";
    const freshnessCurrent = retained.freshness_review_current === true && CURRENT_STATES.has(freshnessState);
    const ageCurrent = retained.outcome_age_days !== null && Number(retained.outcome_age_days) <= windowDays &&
      (!published || (retained.publication_age_days !== null && Number(retained.publication_age_days) <= windowDays));
    const sourceOwnedLimitsCurrent = retained.source_owned_temperature_threshold_changed !== true &&
      retained.capability_classification_changed !== true;
    const wordingCurrent = retained.published_wording_drift_detected !== true;
    const outcomeCurrent = retained.public_claim_outcome_changed !== true;
    const serviceSpecificIdentity = Boolean(clean(retained.entity_type) && clean(retained.code));

    let integrityState = "integrity_current";
    if (!source) integrityState = "integrity_source_unavailable";
    else if (!serviceSpecificIdentity) integrityState = "service_specific_identity_review_required";
    else if (!sourceIdentityRecorded) integrityState = "owning_evidence_identity_review_required";
    else if (!sourceIdentityMatches) integrityState = "owning_evidence_identity_drift_review_required";
    else if (!ownerActionIdentityRecorded || !publicationIdentityRecorded) integrityState = "owner_action_identity_review_required";
    else if (!ownerActionIdentityMatches || !publicationIdentityMatches) integrityState = "owner_action_identity_drift_review_required";
    else if (!sourceOwnedLimitsCurrent) integrityState = "source_owned_limit_integrity_review_required";
    else if (!wordingCurrent) integrityState = "public_claim_wording_integrity_review_required";
    else if (!outcomeCurrent) integrityState = "public_claim_outcome_integrity_review_required";
    else if (!freshnessCurrent || !ageCurrent) integrityState = "freshness_window_integrity_review_required";

    const integrityCurrent = integrityState === "integrity_current";
    const missing = [];
    if (!source) missing.push("current_service_specific_owning_evidence");
    if (!serviceSpecificIdentity) missing.push("service_specific_entity_identity");
    if (!currentSourceType || !currentSourceReference) missing.push("current_owning_evidence_identity");
    if (!snapshotSourceType || !snapshotSourceReference) missing.push("outcome_time_owning_evidence_identity_snapshot");
    if (sourceIdentityRecorded && !sourceIdentityMatches) missing.push("owning_evidence_identity_matches_outcome_snapshot");
    if (!currentOwnerActionReference) missing.push("current_owner_action_reference");
    if (!snapshotOwnerActionReference) missing.push("outcome_time_owner_action_reference_snapshot");
    if (ownerActionIdentityRecorded && !ownerActionIdentityMatches) missing.push("owner_action_identity_matches_outcome_snapshot");
    if (published && !currentPublicationReference) missing.push("current_manual_publication_reference");
    if (published && !snapshotPublicationReference) missing.push("outcome_time_manual_publication_reference_snapshot");
    if (published && publicationIdentityRecorded && !publicationIdentityMatches) missing.push("manual_publication_reference_matches_outcome_snapshot");
    if (!freshnessCurrent || !ageCurrent) missing.push("current_build526_freshness_window_evidence");
    if (!sourceOwnedLimitsCurrent) missing.push("source_owned_limit_or_classification_re_review");
    if (!wordingCurrent) missing.push("published_wording_re_review");
    if (!outcomeCurrent) missing.push("public_claim_outcome_re_review");

    rows.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code,
      retained_build526_freshness_state: freshnessState,
      retained_build526_freshness_review_current: freshnessCurrent,
      outcome_age_days: retained.outcome_age_days, publication_age_days: retained.publication_age_days,
      freshness_window_days: windowDays,
      current_public_claim_outcome: retained.current_public_claim_outcome,
      current_classification: retained.current_classification,
      current_owning_evidence_source_type: currentSourceType,
      current_owning_evidence_source: currentSourceReference,
      outcome_snapshot_owning_evidence_source_type: snapshotSourceType,
      outcome_snapshot_owning_evidence_source: snapshotSourceReference,
      owning_evidence_identity_recorded: sourceIdentityRecorded,
      owning_evidence_identity_matches_outcome_snapshot: sourceIdentityMatches,
      current_owner_action_reference: currentOwnerActionReference,
      outcome_snapshot_owner_action_reference: snapshotOwnerActionReference,
      owner_action_identity_recorded: ownerActionIdentityRecorded,
      owner_action_identity_matches_outcome_snapshot: ownerActionIdentityMatches,
      current_publication_reference: currentPublicationReference,
      outcome_snapshot_publication_reference: snapshotPublicationReference,
      publication_identity_recorded: publicationIdentityRecorded,
      publication_identity_matches_outcome_snapshot: publicationIdentityMatches,
      source_owned_limits_integrity_current: sourceOwnedLimitsCurrent,
      public_claim_wording_integrity_current: wordingCurrent,
      public_claim_outcome_integrity_current: outcomeCurrent,
      freshness_window_integrity_current: freshnessCurrent && ageCurrent,
      integrity_state: integrityState,
      evidence_integrity_current: integrityCurrent,
      manual_review_required: !integrityCurrent,
      broad_winter_availability_authorized: false,
      source_owned_temperature_limit_may_be_widened: false,
      automatic_publication_authorized: false,
      automatic_booking_or_quote_change_authorized: false,
      automatic_hold_narrowing_authorized: false
    }));
    if (!integrityCurrent) gaps.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code, state: integrityState,
      missing: Object.freeze([...new Set(missing)]), safe_default: "retain_public_claim_hold"
    }));
  }

  const counts = Object.freeze({
    total: rows.length,
    integrity_current: rows.filter((row) => row.evidence_integrity_current).length,
    owning_evidence_identity_review: rows.filter((row) => row.integrity_state.startsWith("owning_evidence_identity_")).length,
    owner_action_identity_review: rows.filter((row) => row.integrity_state.startsWith("owner_action_identity_")).length,
    freshness_window_review: rows.filter((row) => row.integrity_state === "freshness_window_integrity_review_required").length,
    source_owned_limit_review: rows.filter((row) => row.integrity_state === "source_owned_limit_integrity_review_required").length,
    wording_review: rows.filter((row) => row.integrity_state === "public_claim_wording_integrity_review_required").length,
    review_required: rows.filter((row) => row.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    seasonal_public_claim_integrity_build: 536,
    seasonal_public_claim_integrity_authority: "seasonal_capability_public_claim_evidence_integrity_review",
    retained_seasonal_public_claim_freshness_authority: "seasonal_capability_public_claim_outcome_freshness_review",
    retained_seasonal_public_claim_outcome_authority: "seasonal_capability_public_claim_decision_outcome_continuity",
    economics: Object.freeze({ ...(base.economics || {}), seasonal_public_claim_evidence_integrity_review: Object.freeze({
      status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "current",
      row_count: rows.length, gap_count: gaps.length, freshness_window_days: windowDays,
      counts, rows: Object.freeze(rows), gaps: Object.freeze(gaps),
      service_specific_owning_evidence_identity_required: true,
      explicit_owner_action_identity_required: true,
      freshness_window_integrity_required: true,
      source_owned_limits_must_be_preserved: true,
      publication_state_observed_not_inferred: true,
      broad_winter_availability_authorized: false,
      automatic_publication_authorized: false,
      booking_quote_rule_mutation_authorized: false,
      canonical_hold_mutation_authorized: false
    })}),
    truth_boundary: Object.freeze({ ...(base.truth_boundary || {}),
      evidence_identity_may_be_inferred_from_source_or_runtime_green: false,
      missing_identity_snapshot_may_be_treated_as_current: false,
      stale_evidence_may_extend_public_claim: false,
      source_owned_temperature_limit_may_be_widened: false,
      broad_winter_availability_may_be_inferred: false
    }),
    boundaries: Object.freeze({ ...(base.boundaries || {}), read_only: true,
      automatic_publication_allowed: false, automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false, automatic_customer_message_allowed: false,
      canonical_hold_mutation_allowed: false, schema_mutation_allowed: false, storage_mutation_allowed: false,
      persistent_telemetry_allowed: false, permanent_polling: false
    })
  });
}

function sameEntity(source = {}, target = {}) {
  const type = clean(target.entity_type).toLowerCase(), code = clean(target.code);
  if (!code) return false;
  const sourceType = clean(source.entity_type).toLowerCase(), sourceCode = clean(source.code);
  if (sourceType && sourceCode) return sourceType === type && sourceCode === code;
  if (type === "add_on") return clean(source.add_on_code) === code;
  if (type === "package") return clean(source.package_code) === code;
  if (type === "service") return clean(source.service_code) === code;
  return false;
}
function normalizeToken(value) { return clean(value).replace(/[\s-]+/g,"_").toLowerCase(); }
function clean(value) { return String(value ?? "").trim(); }
