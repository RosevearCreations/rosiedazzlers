// Build 544 — read-only same-domain evidence integrity over Build 534/524/514/504.
const DOMAINS=Object.freeze(["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"]);
const VALID_OUTCOMES=new Set(["retain_current_controls","retain_hold","bounded_manual_follow_up"]);
const STATES=new Set(["retain_current_controls_evidence_current","retain_hold_evidence_current","bounded_manual_follow_up_evidence_current"]);
const SEASONAL=new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);
const WINDOW_MS=600000;
function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function list(v){return Array.isArray(v)?v:[];}
function str(v){return String(v??"").trim();}
function iso(v){const t=Date.parse(str(v));return Number.isFinite(t)?new Date(t).toISOString():null;}
function count(v){return Number.isInteger(v)&&v>=0?v:null;}
function finite(v){return typeof v==="number"&&Number.isFinite(v)&&v>=0;}
function uniqueRows(rows){const m=new Map();for(const r of list(rows)){const k=str(r?.domain);if(!DOMAINS.includes(k)||m.has(k))return null;m.set(k,r);}return m.size===DOMAINS.length?m:null;}
function exactKeys(v){const keys=Object.keys(obj(v));return keys.length===DOMAINS.length&&DOMAINS.every(k=>keys.includes(k));}
function latest(rows){const dates=list(rows).map(x=>iso(x?.current_observed_at));return dates.length&&dates.every(Boolean)?dates.sort((a,b)=>Date.parse(b)-Date.parse(a))[0]:null;}
function sameDomain(domain,t,ready,f){
  if(t.comparable_window_evidence!==true||ready.comparable_window_evidence!==true||
     ready.decision_review_ready!==true||ready.status!=="bounded_domain_decision_review_ready"||
     f.current_same_domain_evidence?.comparable_window_evidence!==true ||
     f.current_same_domain_evidence?.evidence_current!==true) return false;
  if(domain==="technical_reliability"){
    return t.first_party_only===true && t.status==="bounded_first_party_technical_continuity_observed" &&
      Boolean(str(t.current_window)&&str(t.comparison_window)) &&
      finite(t.current_events_24h)&&finite(t.prior_six_day_average)&&
      (t.recent_to_prior_ratio===null||finite(t.recent_to_prior_ratio)) &&
      count(ready.comparison_count)===1 &&
      f.current_same_domain_evidence?.latest_observed_at!==null;
  }
  const comparisons=list(t.comparisons);
  if(!comparisons.length||count(ready.comparison_count)!==comparisons.length||
     count(f.current_readiness?.comparison_count)!==comparisons.length||
     f.current_same_domain_evidence?.latest_observed_at!==latest(comparisons))return false;
  const fields=domain==="explicit_allocation"?["cohort","prior_observed_at","current_observed_at","prior_explicit_linkage_complete","current_explicit_linkage_complete"]:
    domain==="seasonal_operability"?["service_code","prior_observed_at","current_observed_at","prior_classification","current_classification"]:
    ["metric","prior_observed_at","current_observed_at","prior_value","current_value"];
  const unique=new Set();
  for(const row of comparisons){
    if(!fields.every(key=>row[key]!==undefined&&row[key]!==null))return false;
    if(!iso(row.prior_observed_at)||!iso(row.current_observed_at)||
       Date.parse(row.prior_observed_at)>=Date.parse(row.current_observed_at))return false;
    const key=str(row[fields[0]]);
    if(!key||unique.has(key))return false;
    unique.add(key);
    if(domain==="explicit_allocation"&&(!["true","false"].includes(String(row.prior_explicit_linkage_complete))||
       !["true","false"].includes(String(row.current_explicit_linkage_complete))))return false;
    if(domain==="seasonal_operability"&&(!SEASONAL.has(row.prior_classification)||!SEASONAL.has(row.current_classification)))return false;
    if(domain==="observed_capacity"&&(!finite(row.prior_value)||!finite(row.current_value)))return false;
  }
  return true;
}
export function buildServiceEconomicsSeasonalCapacityReliabilityEvidenceIntegrityReview({
  freshness_review={},decision_outcome_continuity={},decision_readiness={},trend_continuity={},generated_at=null
}={}){
  const now=iso(generated_at)||new Date().toISOString();
  const fresh=obj(freshness_review),out=obj(decision_outcome_continuity),ready=obj(decision_readiness),trend=obj(trend_continuity);
  const recognized=fresh.service_economics_seasonal_capacity_reliability_freshness_build===534 &&
    fresh.service_economics_seasonal_capacity_reliability_freshness_authority==="service_economics_seasonal_capacity_reliability_evidence_freshness_review" &&
    fresh.source_recognized===true && out.decision_outcome_build===524 &&
    out.decision_outcome_authority==="service_economics_seasonal_capacity_reliability_decision_outcome_continuity" &&
    out.source_recognized===true &&ready.decision_readiness_build===514 &&
    ready.decision_readiness_authority==="service_economics_seasonal_capacity_reliability_decision_readiness" &&
    trend.build===504&&trend.authority==="service_economics_seasonal_capacity_reliability_trend_continuity";
  const age=Date.parse(now)-Date.parse(str(fresh.generated_at));
  const snapshotCurrent=Number.isFinite(age)&&age>=-60000&&age<=WINDOW_MS;
  const fm=uniqueRows(fresh.rows),om=uniqueRows(out.rows);
  const domainSetExact=Boolean(fm&&om&&exactKeys(ready.domains)&&exactKeys(trend.domain_continuity));
  const rows=DOMAINS.map(domain=>{
    const f=obj(fm?.get(domain)),o=obj(om?.get(domain));
    const r=obj(ready.domains?.[domain]),t=obj(trend.domain_continuity?.[domain]);
    const human=obj(o.human_decision_outcome),retained=obj(o.retained_decision_readiness);
    const owner=obj(f.owner_decision),fd=obj(f.current_readiness);
    const matchingOutcome=VALID_OUTCOMES.has(human.outcome)&&
      o.status===human.outcome+"_outcome_observed"&&f.retained_outcome_status===o.status &&
      f.freshness_state===human.outcome+"_evidence_current"&&STATES.has(f.freshness_state);
    const traceExact=matchingOutcome&&human.outcome_observed===true&&human.attributable===true&&
      human.trace_matches===true&&human.review_complete===true &&
      human.independent_domain_evidence_reviewed===true &&
      human.cross_domain_substitution_rejected===true &&
      human.missing_comparable_history_not_overridden===true &&
      human.truth_boundaries_reviewed===true &&
      Boolean(str(human.readiness_trace_key))&&human.readiness_trace_key===retained.expected_readiness_trace_key &&
      retained.status===r.status&&retained.owning_status===r.owning_status &&
      retained.comparable_window_evidence===r.comparable_window_evidence &&
      retained.decision_review_ready===r.decision_review_ready &&
      count(retained.comparison_count)===count(r.comparison_count)&&
      fd.status===r.status&&fd.owning_status===r.owning_status &&
      fd.trace_current===true&&fd.decision_review_ready===true&&
      owner.outcome===human.outcome&&owner.outcome_observed===true &&
      owner.review_current===true&&Boolean(str(human.outcome_reference)) &&
      owner.outcome_reference===human.outcome_reference &&
      Boolean(iso(human.reviewed_at))&&owner.reviewed_at===iso(human.reviewed_at);
    const domainExact=sameDomain(domain,t,r,f)&&traceExact;
    const state=!recognized?"service_economics_integrity_source_unavailable":
      !snapshotCurrent?"service_economics_freshness_snapshot_review_required":
      !domainSetExact?"service_economics_domain_set_identity_review_required":
      !traceExact?"service_economics_outcome_readiness_trace_review_required":
      !domainExact?"service_economics_same_domain_comparison_review_required":
      "service_economics_domain_integrity_current";
    return Object.freeze({domain,integrity_state:state,retained_outcome:human.outcome||null,
      owner_trace_identity_exact:traceExact,same_domain_evidence_exact:domainExact,
      cross_domain_substitution_used:false,automatic_action_performed:false});
  });
  const failed=rows.find(x=>x.integrity_state!=="service_economics_domain_integrity_current");
  const status=failed?.integrity_state||"service_economics_integrity_current";
  return Object.freeze({generated_at:now,
    service_economics_seasonal_capacity_reliability_integrity_build:544,
    service_economics_seasonal_capacity_reliability_integrity_authority:"service_economics_seasonal_capacity_reliability_evidence_integrity_review",
    retained_freshness_build:534,retained_decision_outcome_build:524,retained_readiness_build:514,retained_trend_build:504,
    source_recognized:recognized,freshness_snapshot_current:snapshotCurrent,domain_set_identity_exact:domainSetExact,
    status,domain_count:rows.length,review_required_count:rows.filter(x=>x.integrity_state!=="service_economics_domain_integrity_current").length,
    rows:Object.freeze(rows),
    truth_boundary:Object.freeze({allocation_proves_margin_or_price_sensitivity:false,
      broad_winter_availability_inferred:false,working_temperature_threshold_inferred:false,
      observed_capacity_proves_future_capacity:false,provider_billing_cpu_quota_inferred:false,
      recovery_success_inferred:false,field_weather_restriction_treated_as_technical_failure:false,
      cross_domain_substitution_allowed:false,booking_availability_or_price_mutated:false,
      provider_or_recovery_action_performed:false,canonical_hold_mutated:false,
      schema_or_storage_mutated:false,permanent_polling:false})});
}
