// Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity.
// Read-only explicit human decision outcomes over retained Build 514 decision-readiness evidence.
// Final candidate touch keeps exact Cloudflare feature-preview identity aligned with release authority.

const DOMAIN_KEYS=Object.freeze(["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"]);
const ALLOWED_OUTCOMES=Object.freeze(["retain_current_controls","retain_hold","bounded_manual_follow_up"]);

export function buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({
  decision_readiness={}, decision_outcome_records={}, generated_at=new Date().toISOString()
}={}) {
  const sourceRecognized=
    Number(decision_readiness?.decision_readiness_build)===514 &&
    clean(decision_readiness?.decision_readiness_authority)==="service_economics_seasonal_capacity_reliability_decision_readiness";
  const sourceDomains=objectOrEmpty(decision_readiness?.domains);
  const records=objectOrEmpty(decision_outcome_records?.records||decision_outcome_records);

  const rows=DOMAIN_KEYS.map((domain)=>{
    const source=objectOrEmpty(sourceDomains[domain]);
    const sourceReady=sourceRecognized &&
      clean(source?.status)==="bounded_domain_decision_review_ready" &&
      source?.decision_review_ready===true &&
      source?.comparable_window_evidence===true;
    const traceKey=buildReadinessTraceKey(decision_readiness,domain,source);
    const record=objectOrEmpty(records[domain]);
    const hasRecord=Object.keys(record).length>0;
    const outcome=normalizeOutcome(record.outcome);
    const reviewedBy=clean(record.reviewed_by);
    const reviewedAt=validIso(record.reviewed_at);
    const outcomeReference=clean(record.outcome_reference);
    const recordTraceKey=clean(record.readiness_trace_key);
    const outcomeObserved=record.outcome_observed===true;
    const attributable=Boolean(outcome&&reviewedBy&&reviewedAt&&outcomeReference&&recordTraceKey&&outcomeObserved);
    const traceMatches=Boolean(traceKey)&&recordTraceKey===traceKey;
    const independentDomainEvidenceReviewed=record.independent_domain_evidence_reviewed===true;
    const crossDomainSubstitutionRejected=record.cross_domain_substitution_rejected===true;
    const missingComparableHistoryNotOverridden=record.missing_comparable_history_not_overridden===true;
    const truthBoundariesReviewed=record.truth_boundaries_reviewed===true;
    const reviewComplete=independentDomainEvidenceReviewed&&crossDomainSubstitutionRejected&&missingComparableHistoryNotOverridden&&truthBoundariesReviewed;

    let status="decision_readiness_source_unavailable";
    if(sourceRecognized&&!sourceReady) status="decision_readiness_not_review_ready";
    else if(sourceReady&&!hasRecord) status="decision_outcome_required";
    else if(sourceReady&&!attributable) status="decision_outcome_unattributable";
    else if(sourceReady&&!traceMatches) status="decision_outcome_evidence_conflict";
    else if(sourceReady&&!reviewComplete) status="decision_outcome_review_incomplete";
    else if(sourceReady&&outcome==="retain_current_controls") status="retain_current_controls_outcome_observed";
    else if(sourceReady&&outcome==="retain_hold") status="retain_hold_outcome_observed";
    else if(sourceReady&&outcome==="bounded_manual_follow_up") status="bounded_manual_follow_up_outcome_observed";

    const observed=["retain_current_controls_outcome_observed","retain_hold_outcome_observed","bounded_manual_follow_up_outcome_observed"].includes(status);
    return Object.freeze({
      domain,status,
      retained_decision_readiness:Object.freeze({
        build:514,source_recognized:sourceRecognized,status:clean(source?.status)||"unavailable",
        decision_review_ready:source?.decision_review_ready===true,
        comparable_window_evidence:source?.comparable_window_evidence===true,
        owning_status:clean(source?.owning_status)||"unavailable",
        comparison_count:nonnegativeWhole(source?.comparison_count),
        expected_readiness_trace_key:traceKey
      }),
      human_decision_outcome:Object.freeze({
        outcome:outcome||"not_recorded",reviewed_by:reviewedBy||null,reviewed_at:reviewedAt,
        outcome_reference:outcomeReference||null,readiness_trace_key:recordTraceKey||null,
        outcome_observed:outcomeObserved,attributable,trace_matches:traceMatches,
        independent_domain_evidence_reviewed:independentDomainEvidenceReviewed,
        cross_domain_substitution_rejected:crossDomainSubstitutionRejected,
        missing_comparable_history_not_overridden:missingComparableHistoryNotOverridden,
        truth_boundaries_reviewed:truthBoundariesReviewed,review_complete:reviewComplete
      }),
      outcome_boundary:Object.freeze({decision_outcome_observed:observed,automatic_action_performed:false,next_step:nextStep(status)}),
      truth_boundary:Object.freeze({
        allocation_outcome_proves_margin_or_price_sensitivity:false,
        seasonal_outcome_proves_broad_winter_availability:false,
        working_temperature_threshold_inferred:false,
        observed_capacity_outcome_proves_future_capacity:false,
        provider_billing_cpu_or_quota_inferred:false,
        provider_scaling_need_inferred:false,
        recovery_success_inferred:false,
        field_restriction_treated_as_application_reliability_failure:false,
        cross_domain_evidence_used_to_close_gap:false,
        canonical_hold_mutated:false
      })
    });
  });

  const observedCount=rows.filter(r=>r.outcome_boundary.decision_outcome_observed).length;
  const readyCount=rows.filter(r=>r.retained_decision_readiness.decision_review_ready).length;
  const allObserved=sourceRecognized&&rows.length===DOMAIN_KEYS.length&&observedCount===DOMAIN_KEYS.length;
  const adjacent=objectOrEmpty(decision_readiness?.adjacent_external_evidence);

  return Object.freeze({
    generated_at:validIso(generated_at)||new Date().toISOString(),
    decision_outcome_build:524,
    decision_outcome_authority:"service_economics_seasonal_capacity_reliability_decision_outcome_continuity",
    retained_decision_readiness_build:514,retained_trend_continuity_build:504,source_recognized:sourceRecognized,
    status:!sourceRecognized?"evidence_sources_unavailable":allObserved?"bounded_decision_outcome_continuity_observed":"bounded_decision_outcome_continuity_review_required",
    domain_count:rows.length,review_ready_domain_count:readyCount,observed_decision_outcome_count:observedCount,
    allowed_outcomes:ALLOWED_OUTCOMES,rows:Object.freeze(rows),
    adjacent_external_evidence:Object.freeze({
      provider_cost_quota_status:clean(adjacent?.provider_cost_quota_status)||"unavailable",
      recovery_status:clean(adjacent?.recovery_status)||"unavailable",
      provider_cost_quota_used_to_infer_decision_outcome:false,
      recovery_success_used_to_infer_decision_outcome:false
    }),
    truth_boundary:Object.freeze({
      independent_domain_evidence_required:true,missing_comparable_history_remains_insufficient:true,
      price_sensitivity_inferred:false,future_capacity_inferred:false,working_temperature_threshold_inferred:false,
      broad_winter_availability_inferred:false,provider_billing_cpu_or_quota_inferred:false,
      provider_scaling_need_inferred:false,recovery_success_inferred:false,cross_domain_substitution_allowed:false
    }),
    boundaries:Object.freeze({
      read_only:true,manual_refresh_only:true,human_decision_record_required:true,
      automatic_allocation_or_margin_change_allowed:false,automatic_price_or_discount_change_allowed:false,
      automatic_booking_or_availability_change_allowed:false,automatic_public_winter_claim_allowed:false,
      automatic_capacity_or_scaling_change_allowed:false,automatic_provider_action_allowed:false,
      automatic_production_restore_allowed:false,accounting_or_inventory_posting_allowed:false,
      canonical_hold_mutation_allowed:false,schema_or_storage_mutation_allowed:false,
      outreach_allowed:false,permanent_polling_allowed:false
    })
  });
}

function buildReadinessTraceKey(readiness,domain,source){
  const retained=clean(readiness?.retained_build504_status);
  const status=clean(source?.status), owning=clean(source?.owning_status);
  const count=nonnegativeWhole(source?.comparison_count);
  if(Number(readiness?.decision_readiness_build)!==514 ||
     clean(readiness?.decision_readiness_authority)!=="service_economics_seasonal_capacity_reliability_decision_readiness" ||
     !DOMAIN_KEYS.includes(domain) || status!=="bounded_domain_decision_review_ready" ||
     source?.comparable_window_evidence!==true || source?.decision_review_ready!==true) return null;
  return ["service-economics-524",domain,retained||"unavailable",status,owning||"unavailable",count].join("|");
}
function nextStep(status){
  if(status==="retain_current_controls_outcome_observed") return "Retain the explicit trace-matched human decision to keep current controls; do not infer margin, price sensitivity, future capacity, winter availability, provider cost or recovery success.";
  if(status==="retain_hold_outcome_observed") return "Retain the explicit trace-matched HOLD outcome; source/runtime GREEN and another evidence domain do not narrow it.";
  if(status==="bounded_manual_follow_up_outcome_observed") return "Retain the explicit bounded manual follow-up decision as non-executing review evidence; any business/provider action requires separate authorization.";
  if(status==="decision_outcome_review_incomplete") return "Confirm independent-domain review, rejection of cross-domain substitution, missing-history handling and truth-boundary review before accepting the human outcome.";
  if(status==="decision_outcome_evidence_conflict") return "Reconcile the human outcome with the exact current Build 514 domain readiness trace.";
  if(status==="decision_outcome_unattributable") return "Record an explicit observed human outcome with reviewer, review time, reference and exact Build 514 readiness trace.";
  if(status==="decision_outcome_required") return "Record an explicit human decision outcome against the exact current Build 514 domain readiness trace.";
  if(status==="decision_readiness_not_review_ready") return "Retain insufficient comparable history or the owning domain blocker; another evidence domain cannot substitute.";
  return "Restore the retained Build 514 decision-readiness source before decision-outcome continuity review.";
}
function normalizeOutcome(v){const n=clean(v).toLowerCase();return ALLOWED_OUTCOMES.includes(n)?n:null;}
function objectOrEmpty(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function clean(v){return String(v??"").trim();}
function validIso(v){const t=clean(v);return t&&Number.isFinite(Date.parse(t))?new Date(t).toISOString():null;}
function nonnegativeWhole(v){if(v===null||v===undefined||v==="")return 0;const n=Number(v);return Number.isFinite(n)&&n>=0?Math.floor(n):0;}
