// Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review.
// Read-only freshness review over retained Build 516 outcome continuity and current service-specific owning evidence.
import { buildControlledEnvironmentRoutingOutcomeEvidenceContinuity } from "./controlled-environment-routing-outcome-evidence-continuity.js";

const CURRENT_STATES = new Set(["publication_current","retain_hold_current","no_action_current"]);

export function buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const base = buildControlledEnvironmentRoutingOutcomeEvidenceContinuity({ economics, fleet, pricing, source_status, generated_at });
  const continuity = base?.economics?.seasonal_public_claim_outcome_continuity || {};
  const retainedRows = Array.isArray(continuity.rows) ? continuity.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows) ? economics.seasonal_operability_evidence.rows : [];
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = Math.max(1, Math.min(365, Number(freshness_window_days) || 30));
  const rows = [], gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || null;
    const currentOutcome = clean(source?.public_claim_outcome || retained.public_claim_outcome).toLowerCase() || null;
    const observedAt = validDate(source?.public_claim_outcome_observed_at) ? clean(source.public_claim_outcome_observed_at) : (validDate(retained.public_claim_outcome_observed_at) ? clean(retained.public_claim_outcome_observed_at) : null);
    const publishedAt = validDate(source?.public_claim_published_at) ? clean(source.public_claim_published_at) : (validDate(retained.public_claim_published_at) ? clean(retained.public_claim_published_at) : null);
    const outcomeAgeDays = ageDays(observedAt, generatedAt), publicationAgeDays = ageDays(publishedAt, generatedAt);
    const currentClassification = clean(source?.classification || retained.classification) || null;
    const snapshotClassification = clean(source?.public_claim_outcome_capability_classification) || null;
    const classificationChanged = Boolean(snapshotClassification && currentClassification && snapshotClassification !== currentClassification);
    const currentTemperature = currentMinimumTemperature(source);
    const snapshotTemperature = finiteNumber(source?.public_claim_outcome_minimum_working_temperature_c);
    const thresholdChanged = snapshotTemperature !== null && currentTemperature !== null && snapshotTemperature !== currentTemperature;
    const currentPublishedWording = clean(source?.published_public_claim_wording || retained.published_public_claim_wording) || null;
    const snapshotPublishedWording = clean(source?.public_claim_outcome_published_wording) || null;
    const wordingDrift = Boolean(snapshotPublishedWording && currentPublishedWording && normalizeText(snapshotPublishedWording) !== normalizeText(currentPublishedWording));
    const outcomeChanged = Boolean(source && clean(retained.public_claim_outcome) && currentOutcome && clean(retained.public_claim_outcome).toLowerCase() !== currentOutcome);
    const capabilityEvidenceCurrent = source ? source.capability_evidence_current === true : retained.capability_evidence_current === true;
    const staleOutcome = outcomeAgeDays === null || outcomeAgeDays > windowDays;
    const stalePublication = currentOutcome === "published" && (publicationAgeDays === null || publicationAgeDays > windowDays);

    let freshnessState = "predecessor_outcome_review_required";
    if (!source) freshnessState = "freshness_source_unavailable";
    else if (thresholdChanged) freshnessState = "source_owned_threshold_change_review_required";
    else if (wordingDrift) freshnessState = "public_wording_drift_review_required";
    else if (!capabilityEvidenceCurrent || classificationChanged) freshnessState = "capability_evidence_drift_review_required";
    else if (outcomeChanged) freshnessState = "outcome_evidence_drift_review_required";
    else if (staleOutcome || stalePublication) freshnessState = "stale_outcome_review_required";
    else if (retained.outcome_state === "publication_observed") freshnessState = "publication_current";
    else if (retained.outcome_state === "retain_hold_observed") freshnessState = "retain_hold_current";
    else if (retained.outcome_state === "no_action_observed") freshnessState = "no_action_current";

    const reviewReady = CURRENT_STATES.has(freshnessState);
    const missing = [];
    if (!source) missing.push("current_service_specific_owning_evidence");
    if (!capabilityEvidenceCurrent) missing.push("current_service_specific_capability_evidence");
    if (!observedAt) missing.push("dated_public_claim_outcome_observation");
    if (staleOutcome && observedAt) missing.push("fresh_public_claim_outcome_observation");
    if (currentOutcome === "published" && stalePublication) missing.push("fresh_manual_publication_observation");
    if (classificationChanged) missing.push("unchanged_capability_classification");
    if (thresholdChanged) missing.push("source_owned_temperature_threshold_re_review");
    if (wordingDrift) missing.push("published_wording_re_review");
    if (outcomeChanged) missing.push("public_claim_outcome_re_review");
    if (!reviewReady && retained.outcome_state && !String(retained.outcome_state).endsWith("_observed")) missing.push("retained_build516_outcome_continuity");

    rows.push(Object.freeze({
      entity_type: retained.entity_type, code: retained.code, retained_outcome_state: retained.outcome_state,
      current_public_claim_outcome: currentOutcome, outcome_observed_at: observedAt, outcome_age_days: outcomeAgeDays,
      publication_observed_at: publishedAt, publication_age_days: publicationAgeDays, freshness_window_days: windowDays,
      current_classification: currentClassification, outcome_snapshot_classification: snapshotClassification,
      capability_classification_changed: classificationChanged, current_minimum_working_temperature_c: currentTemperature,
      outcome_snapshot_minimum_working_temperature_c: snapshotTemperature, source_owned_temperature_threshold_changed: thresholdChanged,
      current_published_public_claim_wording: currentPublishedWording, outcome_snapshot_published_wording: snapshotPublishedWording,
      published_wording_drift_detected: wordingDrift, capability_evidence_current: capabilityEvidenceCurrent,
      public_claim_outcome_changed: outcomeChanged, freshness_state: freshnessState, freshness_review_current: reviewReady,
      manual_review_required: !reviewReady, broad_winter_availability_authorized: false,
      source_owned_temperature_limit_may_be_widened: false, automatic_publication_authorized: false,
      automatic_booking_or_quote_change_authorized: false, automatic_hold_narrowing_authorized: false
    }));
    if (!reviewReady) gaps.push(Object.freeze({ entity_type: retained.entity_type, code: retained.code, state: freshnessState, missing: Object.freeze([...new Set(missing)]), safe_default: "retain_public_claim_hold" }));
  }

  const counts = Object.freeze({
    total: rows.length, current: rows.filter((row) => row.freshness_review_current).length,
    publication_current: rows.filter((row) => row.freshness_state === "publication_current").length,
    retain_hold_current: rows.filter((row) => row.freshness_state === "retain_hold_current").length,
    no_action_current: rows.filter((row) => row.freshness_state === "no_action_current").length,
    stale: rows.filter((row) => row.freshness_state === "stale_outcome_review_required").length,
    drift: rows.filter((row) => ["source_owned_threshold_change_review_required","public_wording_drift_review_required","capability_evidence_drift_review_required","outcome_evidence_drift_review_required"].includes(row.freshness_state)).length,
    review_required: rows.filter((row) => row.manual_review_required).length
  });

  return Object.freeze({
    ...base,
    seasonal_public_claim_freshness_build: 526,
    seasonal_public_claim_freshness_authority: "seasonal_capability_public_claim_outcome_freshness_review",
    retained_seasonal_public_claim_outcome_authority: "seasonal_capability_public_claim_decision_outcome_continuity",
    retained_controlled_environment_routing_outcome_authority: "controlled_environment_routing_outcome_evidence_continuity",
    economics: Object.freeze({ ...(base.economics || {}), seasonal_public_claim_outcome_freshness_review: Object.freeze({
      status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "current", row_count: rows.length, gap_count: gaps.length,
      freshness_window_days: windowDays, counts, rows: Object.freeze(rows), gaps: Object.freeze(gaps),
      publication_state_observed_not_inferred: true, stale_evidence_never_extends_a_public_claim: true,
      broad_winter_availability_authorized: false, source_owned_temperature_limits_must_be_preserved: true,
      automatic_publication_authorized: false, booking_quote_rule_mutation_authorized: false, canonical_hold_mutation_authorized: false
    })}),
    truth_boundary: Object.freeze({ ...(base.truth_boundary || {}), freshness_may_be_inferred_from_source_or_runtime_green: false,
      stale_outcome_may_be_treated_as_current: false, changed_source_owned_temperature_limit_may_be_widened: false,
      public_wording_drift_may_be_published_automatically: false, broad_winter_availability_may_be_inferred: false }),
    boundaries: Object.freeze({ ...(base.boundaries || {}), read_only: true, automatic_publication_allowed: false,
      automatic_booking_availability_change_allowed: false, automatic_quote_rule_change_allowed: false,
      automatic_customer_message_allowed: false, canonical_hold_mutation_allowed: false, schema_mutation_allowed: false,
      storage_mutation_allowed: false, permanent_polling: false })
  });
}

function currentMinimumTemperature(source) { if (!source || source.exact_temperature_claim_supported !== true) return null; return finiteNumber(source.minimum_working_temperature_c); }
function finiteNumber(value) { if (value === null || value === undefined || value === "") return null; const number = Number(value); return Number.isFinite(number) ? number : null; }
function ageDays(value, generatedAt) { if (!validDate(value)) return null; const ms = generatedAt.getTime() - new Date(value).getTime(); if (!Number.isFinite(ms)) return null; return Math.max(0, Math.floor(ms / 86400000)); }
function sameEntity(source = {}, target = {}) { const type=clean(target.entity_type).toLowerCase(), code=clean(target.code); if(!code)return false; const st=clean(source.entity_type).toLowerCase(), sc=clean(source.code); if(st&&sc)return st===type&&sc===code; if(type==="add_on")return clean(source.add_on_code)===code; if(type==="package")return clean(source.package_code)===code; if(type==="service")return clean(source.service_code)===code; return false; }
function validDate(value) { const raw=clean(value); return Boolean(raw)&&Number.isFinite(Date.parse(raw)); }
function normalizeText(value) { return clean(value).replace(/\s+/g," ").toLowerCase(); }
function clean(value) { return String(value ?? "").trim(); }
