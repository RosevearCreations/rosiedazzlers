// Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review.
// Read-only freshness reconciliation over retained Build 524 outcomes plus current Build 514/504 evidence.
// Allocation, Southern Ontario seasonal operability, observed capacity and first-party technical reliability
// remain independent. Missing or stale comparable evidence remains insufficient.

const DOMAIN_KEYS=Object.freeze(["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"]);
const OBSERVED_OUTCOMES=new Set(["retain_current_controls_outcome_observed","retain_hold_outcome_observed","bounded_manual_follow_up_outcome_observed"]);
const DEFAULT_FRESHNESS_WINDOW_DAYS=30;

export function buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
  decision_outcome_continuity={},
  decision_readiness={},
  trend_continuity={},
  generated_at=null,
  freshness_window_days=DEFAULT_FRESHNESS_WINDOW_DAYS
}={}) {
  const generatedAt=validDate(generated_at)?new Date(generated_at):new Date();
  const windowDays=normalizeWindow(freshness_window_days);
  const outcome=objectOrEmpty(decision_outcome_continuity);
  const readiness=objectOrEmpty(decision_readiness);
  const trend=objectOrEmpty(trend_continuity);
  const outcomeRecognized=Number(outcome.decision_outcome_build)===524 &&
    clean(outcome.decision_outcome_authority)==="service_economics_seasonal_capacity_reliability_decision_outcome_continuity";
  const readinessRecognized=Number(readiness.decision_readiness_build)===514 &&
    clean(readiness.decision_readiness_authority)==="service_economics_seasonal_capacity_reliability_decision_readiness";
  const trendRecognized=Number(trend.build)===504 &&
    clean(trend.authority)==="service_economics_seasonal_capacity_reliability_trend_continuity";
  const sourceRecognized=outcomeRecognized&&readinessRecognized&&trendRecognized;
  const outcomeRows=new Map(safeArray(outcome.rows).map(row=>[clean(row?.domain),row]));
  const readinessDomains=objectOrEmpty(readiness.domains);
  const trendDomains=objectOrEmpty(trend.domain_continuity);

  const rows=DOMAIN_KEYS.map(domain=>reviewDomain({
    domain,
    outcomeRow:objectOrEmpty(outcomeRows.get(domain)),
    readinessDomain:objectOrEmpty(readinessDomains[domain]),
    trendDomain:objectOrEmpty(trendDomains[domain]),
    trendGeneratedAt:trend.generated_at,
    generatedAt,
    windowDays,
    sourceRecognized
  }));

  return Object.freeze({
    generated_at:generatedAt.toISOString(),
    service_economics_seasonal_capacity_reliability_freshness_build:534,
    service_economics_seasonal_capacity_reliability_freshness_authority:"service_economics_seasonal_capacity_reliability_evidence_freshness_review",
    retained_decision_outcome_build:524,
    retained_decision_readiness_build:514,
    retained_trend_continuity_build:504,
    source_recognized:sourceRecognized,
    freshness_window_days:windowDays,
    domain_count:rows.length,
    current_domain_count:rows.filter(row=>row.freshness_state.endsWith("_evidence_current")).length,
    review_required_count:rows.filter(row=>!row.freshness_state.endsWith("_evidence_current")).length,
    rows:Object.freeze(rows),
    review_contract:Object.freeze({
      retained_build_524_outcome_required:true,
      current_build_514_readiness_required:true,
      current_build_504_same_domain_comparable_evidence_required:true,
      independent_domain_review_required:true,
      missing_comparable_history_remains_insufficient:true,
      source_owned_temperature_thresholds_only:true,
      provider_cost_quota_evidence_remains_adjacent:true,
      recovery_evidence_remains_adjacent:true,
      source_or_runtime_green_proves_fresh_business_evidence:false
    }),
    truth_boundary:Object.freeze({
      price_sensitivity_inferred:false,
      future_capacity_inferred:false,
      working_temperature_threshold_inferred:false,
      broad_winter_availability_inferred:false,
      provider_billing_cpu_or_quota_inferred:false,
      provider_scaling_need_inferred:false,
      recovery_success_inferred:false,
      cross_domain_substitution_allowed:false,
      automatic_allocation_or_margin_change_performed:false,
      automatic_price_or_discount_change_performed:false,
      automatic_booking_or_availability_change_performed:false,
      automatic_public_winter_claim_performed:false,
      automatic_capacity_or_scaling_change_performed:false,
      provider_or_recovery_action_performed:false,
      canonical_hold_mutated:false,
      schema_or_storage_mutation_performed:false,
      background_telemetry_started:false,
      permanent_polling:false
    })
  });
}

function reviewDomain({domain,outcomeRow,readinessDomain,trendDomain,trendGeneratedAt,generatedAt,windowDays,sourceRecognized}) {
  const human=objectOrEmpty(outcomeRow.human_decision_outcome);
  const retained=objectOrEmpty(outcomeRow.retained_decision_readiness);
  const outcomeObserved=OBSERVED_OUTCOMES.has(clean(outcomeRow.status)) &&
    human.outcome_observed===true && human.attributable===true && human.trace_matches===true && human.review_complete===true;
  const readinessCurrent=readinessDomain.decision_review_ready===true &&
    readinessDomain.comparable_window_evidence===true &&
    clean(readinessDomain.status)==="bounded_domain_decision_review_ready";
  const readinessTraceCurrent=readinessCurrent &&
    retained.decision_review_ready===true &&
    retained.comparable_window_evidence===true &&
    clean(retained.status)==="bounded_domain_decision_review_ready" &&
    clean(retained.owning_status)===clean(readinessDomain.owning_status) &&
    nonnegativeWhole(retained.comparison_count)===nonnegativeWhole(readinessDomain.comparison_count) &&
    Boolean(clean(retained.expected_readiness_trace_key));

  const comparableCurrent=trendDomain.comparable_window_evidence===true;
  const latestEvidenceAt=latestDomainEvidenceAt(domain,trendDomain,trendGeneratedAt);
  const evidenceAgeDays=ageDays(latestEvidenceAt,generatedAt);
  const evidenceCurrent=Boolean(latestEvidenceAt)&&evidenceAgeDays!==null&&evidenceAgeDays<=windowDays;
  const reviewedAt=iso(human.reviewed_at);
  const reviewAgeDays=ageDays(reviewedAt,generatedAt);
  const ownerReviewCurrent=Boolean(reviewedAt)&&reviewAgeDays!==null&&reviewAgeDays<=windowDays;

  let freshnessState="service_economics_freshness_source_unavailable";
  if(sourceRecognized&&!outcomeObserved) freshnessState="retained_decision_outcome_review_required";
  else if(sourceRecognized&&outcomeObserved&&!readinessTraceCurrent) freshnessState="decision_readiness_trace_drift_review_required";
  else if(sourceRecognized&&outcomeObserved&&!comparableCurrent) freshnessState="insufficient_comparable_history_review_required";
  else if(sourceRecognized&&outcomeObserved&&!latestEvidenceAt) freshnessState="current_evidence_timestamp_review_required";
  else if(sourceRecognized&&outcomeObserved&&!evidenceCurrent) freshnessState="retained_same_domain_evidence_freshness_review_required";
  else if(sourceRecognized&&outcomeObserved&&!ownerReviewCurrent) freshnessState="owner_decision_outcome_freshness_review_required";
  else if(sourceRecognized&&outcomeObserved&&clean(human.outcome)==="retain_current_controls") freshnessState="retain_current_controls_evidence_current";
  else if(sourceRecognized&&outcomeObserved&&clean(human.outcome)==="retain_hold") freshnessState="retain_hold_evidence_current";
  else if(sourceRecognized&&outcomeObserved&&clean(human.outcome)==="bounded_manual_follow_up") freshnessState="bounded_manual_follow_up_evidence_current";

  return Object.freeze({
    domain,
    retained_outcome_status:clean(outcomeRow.status)||"unavailable",
    freshness_state:freshnessState,
    current_readiness:Object.freeze({
      status:clean(readinessDomain.status)||"unavailable",
      owning_status:clean(readinessDomain.owning_status)||"unavailable",
      comparison_count:nonnegativeWhole(readinessDomain.comparison_count),
      decision_review_ready:readinessCurrent,
      trace_current:readinessTraceCurrent
    }),
    current_same_domain_evidence:Object.freeze({
      status:clean(trendDomain.status)||"unavailable",
      comparable_window_evidence:comparableCurrent,
      latest_observed_at:latestEvidenceAt,
      evidence_age_days:evidenceAgeDays,
      evidence_current:evidenceCurrent
    }),
    owner_decision:Object.freeze({
      outcome:clean(human.outcome)||"not_recorded",
      reviewed_at:reviewedAt,
      review_age_days:reviewAgeDays,
      review_current:ownerReviewCurrent,
      outcome_reference:clean(human.outcome_reference)||null,
      outcome_observed:outcomeObserved
    }),
    truth_boundary:Object.freeze({
      another_domain_used_as_substitute:false,
      margin_or_price_sensitivity_inferred:false,
      working_temperature_threshold_inferred:false,
      broad_winter_availability_inferred:false,
      future_capacity_inferred:false,
      provider_billing_cpu_or_quota_inferred:false,
      provider_scaling_need_inferred:false,
      recovery_success_inferred:false,
      field_restriction_treated_as_application_reliability_failure:false,
      automatic_business_or_provider_action_performed:false,
      canonical_hold_mutated:false
    })
  });
}

function latestDomainEvidenceAt(domain,source,trendGeneratedAt){
  const comparisonDates=safeArray(source.comparisons)
    .map(row=>iso(row?.current_observed_at))
    .filter(Boolean)
    .sort((a,b)=>Date.parse(b)-Date.parse(a));
  if(comparisonDates.length) return comparisonDates[0];
  if(domain==="technical_reliability" && source.comparable_window_evidence===true &&
     clean(source.current_window) && clean(source.comparison_window)) return iso(trendGeneratedAt);
  return null;
}
function normalizeWindow(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=180?Math.floor(n):DEFAULT_FRESHNESS_WINDOW_DAYS;}
function ageDays(value,generatedAt){if(!validDate(value))return null;const ms=generatedAt.getTime()-new Date(value).getTime();return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null;}
function objectOrEmpty(value){return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
function safeArray(value){return Array.isArray(value)?value:[];}
function clean(value){return String(value??"").trim();}
function validDate(value){const text=clean(value);return Boolean(text)&&Number.isFinite(Date.parse(text));}
function iso(value){return validDate(value)?new Date(value).toISOString():null;}
function nonnegativeWhole(value){if(value===null||value===undefined||value==="")return 0;const n=Number(value);return Number.isFinite(n)&&n>=0?Math.floor(n):0;}
