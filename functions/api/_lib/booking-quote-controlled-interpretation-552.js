// Build 552 — bounded booking/quote follow-up interpretation. Source-only and fail closed.
// A current retained experiment is not evidence of a winner, price change or season effect.
const clean=v=>String(v??"").trim();
const whole=v=>v!==""&&v!==null&&Number.isInteger(Number(v))&&Number(v)>=0?Number(v):null;
export function build552BookingQuoteControlledInterpretation({integrity={},operator_measurements={},source_available=false}={}){
 const data=Array.isArray(integrity?.rows)?integrity.rows:[],inputs=operator_measurements||{};
 const rows=data.map(row=>{
  const key=clean(row?.key),sample=inputs[key]||{},gaps=[];
  const id=row?.measurement_allocation_duration_identity||{},season=row?.seasonal_and_stop_evidence||{};
  if(!source_available||row.integrity_state!=="booking_quote_follow_up_integrity_current")gaps.push("current_source_identity_and_owner_trace_required");
  if(!id.exact||!id.revision||!clean(id.primary_metric))gaps.push("locked_primary_metric_revision_required");
  if(!season.weather_eligibility_and_exclusion_complete)gaps.push("explicit_southern_ontario_weather_exclusions_required");
  if(!season.no_triggered_stop_condition)gaps.push("triggered_stop_condition_requires_owner_review");
  const expected=Array.isArray(id.allocation_arms)?id.allocation_arms:[];
  const declared=Array.isArray(sample.arms)?sample.arms:[],names=declared.map(a=>clean(a.name));
  if(expected.length<2||declared.length!==expected.length||new Set(names).size!==expected.length||expected.some(x=>!names.includes(x)))gaps.push("exact_comparable_allocation_arm_population_required");
  if(sample.measurement_lock_revision!==id.revision||clean(sample.primary_metric)!==clean(id.primary_metric))gaps.push("measurement_contract_identity_mismatch");
  const parsed=declared.map(a=>({name:clean(a.name),eligible:whole(a.eligible_sessions),weather_excluded:whole(a.weather_excluded_sessions),conversions:whole(a.conversions),window:clean(a.window_id)}));
  if(parsed.some(a=>a.eligible===null||a.weather_excluded===null||a.conversions===null||a.conversions>a.eligible||!a.window))gaps.push("attributable_eligible_denominator_and_weather_exclusion_counts_required");
  if(new Set(parsed.map(a=>a.window)).size!==1)gaps.push("same_measurement_window_required");
  const totalWeather=parsed.reduce((sum,a)=>sum+(a.weather_excluded||0),0);
  if(sample.weather_exclusion_audited!==true||sample.capacity_confounds_reviewed!==true||sample.booking_collision_reviewed!==true)
    gaps.push("manual_weather_capacity_collision_confounder_review_required");
  const comparison=gaps.length===0?parsed.map(a=>Object.freeze({arm:a.name,eligible:a.eligible,weather_excluded:a.weather_excluded,
     observed_conversions:a.conversions,observed_rate_pct:Math.round(a.conversions/a.eligible*10000)/100})):[]; 
  if(!gaps.length&&parsed.some(a=>a.eligible===0)){gaps.push("zero_eligible_population_cannot_compare");comparison.length=0;}
  return Object.freeze({key,area:clean(row.area),status:gaps.length?"retain_follow_up_interpretation_hold":"bounded_descriptive_comparison_ready",
   arms:Object.freeze(comparison),total_weather_excluded:totalWeather,gaps:Object.freeze(gaps),
   statistical_significance_established:false,randomized_causal_effect_established:false,winner_declared:false,price_change_authorized:false});
 });
 const ready=rows.filter(r=>r.status==="bounded_descriptive_comparison_ready").length;
 return Object.freeze({build:552,authority:"booking_quote_controlled_follow_up_interpretation",status:ready&&ready===rows.length?"descriptive_follow_up_review_ready":"retain_booking_quote_follow_up_hold",
  definitions:rows.length,review_ready:ready,rows:Object.freeze(rows),weather_ineligible_sessions_excluded:true,
  current_source_required:true,causal_winner_or_superiority_inferred:false,price_or_discount_changed:false,
  booking_or_quote_changed:false,customer_outreach_sent:false,canonical_hold_mutated:false,read_only:true});
}
