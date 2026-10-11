// Build 547. Observation-only winter rule reconciliation. NEVER changes availability, bookings, quotes, customer content, or holds.
const token=x=>String(x??"").trim().toLowerCase().replace(/[\s-]+/g,"_");
const key=x=>token(x?.entity_type)+"|"+String(x?.code??"").trim().toLowerCase();
const text=x=>String(x??"").trim();
const broad=/\b(all winter|any temperature|year.round|always available|no weather limits|guaranteed winter)\b/i;
const validRef=x=>text(x).length>2;
export function buildWinterBookingObservedSafetyTransparency({report={},economics={},pricing={}}={}){
  const retained=Array.isArray(report?.economics?.winter_booking_quote_rule_evidence_integrity_review?.rows)?report.economics.winter_booking_quote_rule_evidence_integrity_review.rows:[];
  const eligibility=Array.isArray(report?.economics?.winter_booking_eligibility?.rows)?report.economics.winter_booking_eligibility.rows:[];
  const sources=Array.isArray(economics?.seasonal_operability_evidence?.rows)?economics.seasonal_operability_evidence.rows:[];
  const weather=Array.isArray(pricing?.booking?.weather_eligibility_evidence?.rows)?pricing.booking.weather_eligibility_evidence.rows:[];
  const weatherCount={eligible:0,ineligible:0,unknown:0};
  for(const event of weather){const n=Number(event?.session_count);if(!Number.isInteger(n)||n<0)continue;
    const state=token(event?.eligibility_state);if(state==="weather_eligible")weatherCount.eligible+=n;else if(state==="weather_ineligible")weatherCount.ineligible+=n;else weatherCount.unknown+=n;
  }
  const allKeys=new Set([...retained,...eligibility,...sources.map(s=>({entity_type:s.package_code?"package":s.add_on_code?"add_on":"service",code:s.package_code||s.add_on_code||s.service_code||s.code}))].map(key));
  const rows=[];
  for(const k of allKeys){if(!k.split("|")[1])continue;
    const rs=retained.filter(x=>key(x)===k),es=eligibility.filter(x=>key(x)===k);
    const ss=sources.filter(s=>key({entity_type:s.package_code?"package":s.add_on_code?"add_on":"service",code:s.package_code||s.add_on_code||s.service_code||s.code})===k);
    const r=rs.length===1?rs[0]:null,e=es.length===1?es[0]:null,s=ss.length===1?ss[0]:null;
    const gaps=[];
    if(!r||r.evidence_integrity_current!==true)gaps.push("current_winter_rule_integrity");
    if(!s||s.capability_evidence_current!==true)gaps.push("source_owned_current_service_evidence");
    if(!e||e.owner_review_required!==true)gaps.push("customer_eligibility_and_disclosure_review");
    if(rs.length>1||es.length>1||ss.length>1)gaps.push("duplicate_service_identity");
    if(!r?.decision_trace_identity_matches_outcome_snapshot)gaps.push("owner_decision_identity_not_verified");
    if(!r?.booking_quote_rule_integrity_current)gaps.push("booking_quote_rule_snapshot_not_verified");
    if(!r?.customer_transparency_integrity_current||!validRef(r?.current_customer_transparency_wording)||broad.test(r?.current_customer_transparency_wording))gaps.push("supported_customer_disclosure_not_verified");
    if(r?.availability_revalidated!==true||r?.checkout_collision_revalidated!==true||!r?.runtime_safety_identity_matches_outcome_snapshot)gaps.push("availability_and_checkout_revalidation_not_verified");
    if(weatherCount.eligible+weatherCount.ineligible+weatherCount.unknown===0)gaps.push("observed_weather_exclusion_sample_unavailable");
    if(weatherCount.unknown>0)gaps.push("unknown_weather_sessions_need_separate_review");
    // Explicit observed collision outcomes are distinct from the rule's revalidation assertion.
    if(!Number.isInteger(Number(s?.winter_rule_observed_collision_count))||!validRef(s?.winter_rule_observed_collision_reference)||!validRef(s?.winter_rule_observed_collision_observed_at))gaps.push("observed_reservation_collision_outcome_unavailable");
    if(token(s?.classification)==="temperature_limited_outdoor"&&(!Number.isFinite(Number(s?.minimum_working_temperature_c))||s?.exact_temperature_claim_supported!==true))gaps.push("source_owned_temperature_limit_unverified");
    if(token(s?.classification)==="controlled_environment_required"&&s?.indoor_capable_workflow_supported!==true)gaps.push("qualified_controlled_site_missing");
    const [entity_type,code]=k.split("|");
    rows.push(Object.freeze({entity_type,code,service_classification:token(s?.classification)||null,
      recorded_owner_outcome:r?.current_controlled_activation_outcome||null,
      source_owned_disclosure:r?.current_customer_transparency_wording||null,
      booking_rule:r?.retained_booking_rule_candidate||null,quote_rule:r?.retained_quote_rule_candidate||null,
      eligibility_state:e?.eligibility_state||"unavailable",
      observed_collision_count:Number.isInteger(Number(s?.winter_rule_observed_collision_count))&&s?.winter_rule_observed_collision_count!==null&&s?.winter_rule_observed_collision_count!==undefined?Number(s.winter_rule_observed_collision_count):null,
      observed_collision_reference:text(s?.winter_rule_observed_collision_reference)||null,
      review_state:gaps.length?"observed_safety_review_required":"observed_evidence_ready_for_manual_review",
      gaps:Object.freeze([...new Set(gaps)]),safe_default:"retain_winter_booking_quote_hold",
      automatic_rule_activation:false,automatic_booking_change:false,automatic_quote_change:false,automatic_public_disclosure:false}));
  }
  rows.sort((a,b)=>key(a).localeCompare(key(b)));
  return Object.freeze({build:547,authority:"winter_booking_rule_observed_safety_transparency",status:rows.length?(rows.some(x=>x.gaps.length)?"review_required":"manual_review_ready"):"unavailable",
    row_count:rows.length,review_required_count:rows.filter(x=>x.gaps.length).length,weather_evidence:Object.freeze({...weatherCount,
      adjusted_conversion_rate_available:false,weather_ineligible_is_conversion_failure:false}),
    observed_collision_count_authoritative_only_with_attributable_source:true,
    rows:Object.freeze(rows),safe_default:"retain_winter_booking_quote_hold",
    source_read_only:true,booking_mutation_allowed:false,quote_mutation_allowed:false,availability_mutation_allowed:false,hold_narrowing_allowed:false,auto_publication_allowed:false,customer_message_allowed:false,
    privacy_or_billing_mutation_allowed:false,storage_mutation_allowed:false,telemetry_persisted:false});
}
