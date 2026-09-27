// Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity.
// Read-only outcome continuity over retained Build 506 activation decisions and Build 508 seasonal/routing evidence.
import { buildControlledEnvironmentOperationalReadinessRoutingContinuity } from "./controlled-environment-operational-readiness-routing-continuity.js";

const OUTCOMES = new Set(["published","retain_hold","no_action"]);

export function buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildControlledEnvironmentOperationalReadinessRoutingContinuity({
    economics, fleet, pricing, source_status, generated_at
  });
  const activation = base?.economics?.seasonal_public_claim_activation_decision || {};
  const retainedRows = Array.isArray(activation.rows) ? activation.rows : [];
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const rows = [];
  const gaps = [];

  for (const retained of retainedRows) {
    const source = sourceRows.find((candidate) => sameEntity(candidate, retained)) || {};
    const currentEvidence = retained.capability_evidence_current === true;
    const retainedReady = retained.public_claim_activation_decision_ready === true;
    const outcome = outcomeEvidence(source);
    const published = publicationEvidence(source);
    const wording = clean(retained.proposed_service_specific_public_wording) || null;
    const wordingMatches = Boolean(
      wording &&
      published.wording &&
      normalizeText(writing(published.wording)) === normalizeText(writing(wording))
    );

    let outcomeState = "outcome_owner_action_required";
    let outcomeObserved = false;

    if (outcome.valid && currentEvidence && outcome.kind === "retain_hold") {
      outcomeState = "retain_hold_observed";
      outcomeObserved = true;
    } else if (outcome.valid && currentEvidence && outcome.kind === "no_action") {
      outcomeState = "no_action_observed";
      outcomeObserved = true;
    } else if (
      outcome.valid &&
      outcome.kind === "published" &&
      currentEvidence &&
      retainedReady &&
      published.valid &&
      wordingMatches
    ) {
      outcomeState = "publication_observed";
      outcomeObserved = true;
    } else if (outcome.kind === "published" && outcome.valid) {
      outcomeState = "publication_evidence_conflict";
    }

    const missing = [];
    if (!currentEvidence) missing.push("current_service_specific_capability_evidence");
    if (!outcome.kind) missing.push("explicit_public_claim_outcome");
    if (!outcome.observed_at) missing.push("dated_public_claim_outcome_observation");
    if (!outcome.reference) missing.push("attributable_public_claim_outcome_reference");
    if (outcome.kind === "published") {
      if (!retainedReady) missing.push("build506_public_claim_activation_decision_ready");
      if (!wording) missing.push("retained_service_specific_reviewed_wording");
      if (!published.wording) missing.push("observed_published_wording");
      if (!published.published_at) missing.push("dated_manual_publication_observation");
      if (!published.reference) missing.push("attributable_manual_publication_reference");
      if (published.wording && wording && !wordingMatches) missing.push("published_wording_matches_reviewed_service_specific_wording");
    }

    rows.push(Object.freeze({
      entity_type: retained.entity_type,
      code: retained.code,
      classification: retained.classification,
      retained_activation_decision_state: retained.activation_decision_state,
      retained_public_claim_activation_decision_ready: retainedReady,
      capability_evidence_current: currentEvidence,
      source_owned_temperature_limit_text: retained.source_owned_temperature_limit_text || null,
      reviewed_service_specific_public_wording: wording,
      public_claim_outcome: outcome.kind,
      public_claim_outcome_observed_at: outcome.observed_at,
      public_claim_outcome_reference: outcome.reference,
      published_public_claim_wording: published.wording,
      public_claim_published_at: published.published_at,
      public_claim_publication_reference: published.reference,
      published_wording_matches_reviewed_wording: wordingMatches,
      outcome_state: outcomeState,
      public_claim_outcome_observed: outcomeObserved,
      publication_observed: outcomeState === "publication_observed",
      retain_hold_observed: outcomeState === "retain_hold_observed",
      no_action_observed: outcomeState === "no_action_observed",
      manual_publication_only: true,
      publication_state_observed_not_inferred: true,
      automatic_publication_authorized: false,
      broad_winter_availability_authorized: false,
      automatic_booking_or_quote_change_authorized: false,
      source_owned_temperature_limit_may_be_widened: false
    }));

    if (!outcomeObserved) {
      gaps.push(Object.freeze({
        entity_type: retained.entity_type,
        code: retained.code,
        state: outcomeState,
        missing: Object.freeze([...new Set(missing)]),
        safe_default: "retain_public_claim_hold"
      }));
    }
  }

  const counts = Object.freeze({
    total: rows.length,
    publication_observed: rows.filter((row) => row.publication_observed).length,
    retain_hold_observed: rows.filter((row) => row.retain_hold_observed).length,
    no_action_observed: rows.filter((row) => row.no_action_observed).length,
    publication_evidence_conflict: rows.filter((row) => row.outcome_state === "publication_evidence_conflict").length,
    owner_action_required: rows.filter((row) => row.outcome_state === "outcome_owner_action_required").length
  });

  return Object.freeze({
    ...base,
    seasonal_public_claim_outcome_build: 516,
    seasonal_public_claim_outcome_authority: "seasonal_capability_public_claim_decision_outcome_continuity",
    retained_public_claim_activation_authority: "seasonal_capability_public_claim_activation_decision",
    retained_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity",
    economics: Object.freeze({
      ...(base.economics || {}),
      seasonal_public_claim_outcome_continuity: Object.freeze({
        status: rows.length === 0 ? "unavailable" : gaps.length ? "review" : "observed",
        row_count: rows.length,
        gap_count: gaps.length,
        counts,
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_outcomes: Object.freeze([...OUTCOMES]),
        publication_must_be_observed: true,
        manual_publication_only: true,
        broad_winter_availability_authorized: false,
        source_owned_temperature_limits_must_be_preserved: true,
        booking_quote_rule_mutation_authorized: false
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      activation_decision_ready_is_publication: false,
      publication_state_may_be_inferred_from_decision_readiness: false,
      publication_state_may_be_inferred_from_source_or_runtime_green: false,
      no_action_may_be_inferred_from_missing_publication_evidence: false,
      broad_winter_availability_may_be_inferred: false,
      source_owned_temperature_limit_may_be_widened: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_publication_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_quote_rule_change_allowed: false,
      automatic_customer_message_allowed: false,
      canonical_hold_mutation_allowed: false,
      schema_mutation_allowed: false,
      storage_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function outcomeEvidence(source = {}) {
  const kind = clean(source.public_claim_outcome).toLowerCase();
  const observedAt = validDate(source.public_claim_outcome_observed_at)
    ? clean(source.public_claim_outcome_observed_at)
    : null;
  const reference = clean(source.public_claim_outcome_reference) || null;
  const validKind = OUTCOMES.has(kind);
  return Object.freeze({
    kind: validKind ? kind : null,
    observed_at: observedAt,
    reference,
    valid: validKind && Boolean(observedAt) && Boolean(reference)
  });
}

function publicationEvidence(source = {}) {
  const wording = clean(source.published_public_claim_wording) || null;
  const publishedAt = validDate(source.public_claim_published_at)
    ? clean(source.public_claim_published_at)
    : null;
  const reference = clean(source.public_claim_publication_reference) || null;
  return Object.freeze({
    wording,
    published_at: publishedAt,
    reference,
    valid: Boolean(wording && publishedAt && reference)
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
function writing(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function normalizeText(value) { return writing(value).toLowerCase(); }
function clean(value) { return String(value ?? "").trim(); }
