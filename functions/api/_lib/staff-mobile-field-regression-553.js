// Build 553 — attributable, like-for-like staff/mobile device regression review. GET-only.
const clean=x=>String(x??"").trim();
const iso=x=>typeof x==="string"&&Number.isFinite(Date.parse(x))?new Date(x).toISOString():null;
const count=x=>x!==""&&x!=null&&Number.isInteger(Number(x))&&Number(x)>=0?Number(x):null;
export function build553StaffMobileFieldRegression({integrity={},field_observations={},source_available=false}={}){
 const source=Array.isArray(integrity?.rows)?integrity.rows:[],observations=field_observations||{};
 const rows=source.map(row=>{
  const key=clean(row.evidence_id),record=observations[key]||{},gaps=[],base=record.before||{},after=record.after||{};
  if(!source_available||row.integrity_state!=="staff_mobile_closure_integrity_current")gaps.push("current_source_owned_staff_mobile_integrity_required");
  if(!iso(record.reviewed_at)||!clean(record.review_reference))gaps.push("dated_operator_review_reference_required");
  for(const field of ["owning_workflow_scope","role_scope","device_browser_context","measure_definition","window_or_sample_definition"]){
   if(!clean(record[field])||!clean(base[field])||!clean(after[field])||record[field]!==base[field]||record[field]!==after[field])
    gaps.push("like_for_like_"+field+"_required");
  }
  const b=count(base.observations),a=count(after.observations),bf=count(base.failures),af=count(after.failures);
  if(b===null||a===null||b<1||a<1||bf===null||af===null||bf>b||af>a)gaps.push("explicit_eligible_failures_and_denominators_required");
  if(record.weather_site_confounds_excluded!==true||record.role_permissions_comparable!==true||record.network_conditions_comparable!==true)
   gaps.push("manual_weather_role_network_confounders_review_required");
  if(record.authenticated_field_device_evidence_observed!==true)gaps.push("observed_authenticated_field_device_required");
  if(record.regression_classification!=="review"&&record.regression_classification!=="no_change")
   gaps.push("explicit_operator_review_classification_required");
  return Object.freeze({key,area:clean(row.area),status:gaps.length?"field_regression_evidence_hold":"bounded_field_comparison_review_ready",
    before_total:b,after_total:a,before_failures:bf,after_failures:af,
    before_failure_rate_pct:b?Math.round(bf/b*10000)/100:null,after_failure_rate_pct:a?Math.round(af/a*10000)/100:null,
    review_reference:clean(record.review_reference)||null,gaps:Object.freeze(gaps),
    staff_fault_inferred:false,device_fault_inferred:false,causal_regression_proven:false,authorization_changed:false});
 });
 const ready=rows.filter(r=>r.status==="bounded_field_comparison_review_ready").length;
 return Object.freeze({build:553,authority:"staff_mobile_field_regression_evidence",status:rows.length&&ready===rows.length?"bounded_field_regression_review_ready":"retain_staff_mobile_regression_hold",
   definitions:rows.length,ready,rows:Object.freeze(rows),staff_fault_declared:false,device_fault_declared:false,
   access_role_changed:false,closure_automatically_performed:false,canonical_hold_mutated:false,read_only:true});
}
