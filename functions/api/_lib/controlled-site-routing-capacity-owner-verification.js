// Build 548 — owner verification of controlled-site routing and observed bounded capacity, read-only.
const clean=x=>String(x??"").trim();
const token=x=>clean(x).toLowerCase().replace(/[\s-]+/g,"_");
const id=x=>[token(x?.entity_type||(x?.package_code?"package":x?.add_on_code?"add_on":"service")),clean(x?.code||x?.package_code||x?.add_on_code||x?.service_code).toLowerCase()].join("|");
const recent=(d,now,days=30)=>{const t=Date.parse(clean(d));return Number.isFinite(t)&&t<=now&&now-t<=days*86400000};
const whole=x=>x!==null&&x!==undefined&&x!==""&&Number.isInteger(Number(x))&&Number(x)>=0?Number(x):null;
export function buildControlledSiteCapacityOwnerVerification({report={},economics={},generated_at=null}={}){
 const rows=Array.isArray(report?.economics?.controlled_environment_routing_capacity_evidence_integrity_review?.rows)?report.economics.controlled_environment_routing_capacity_evidence_integrity_review.rows:[];
 const sources=Array.isArray(economics?.seasonal_operability_evidence?.rows)?economics.seasonal_operability_evidence.rows:[];
 const now=Date.parse(clean(generated_at))||Date.now(),output=[];
 for(const row of rows.filter(x=>x.controlled_environment_candidate_present===true)){
   const matches=sources.filter(s=>id(s)===id(row)),s=matches.length===1?matches[0]:null,gaps=[];
   if(matches.length!==1)gaps.push(matches.length?"duplicate_service_specific_source":"source_owned_service_specific_route_unavailable");
   if(!row.evidence_integrity_current)gaps.push("build538_route_capacity_integrity_not_current");
   if(!row.service_site_workflow_identity_matches_outcome_snapshot)gaps.push("site_workflow_identity_or_snapshot_drift");
   if(!row.routing_outcome_identity_matches_outcome_snapshot)gaps.push("route_outcome_not_verified");
   const outcome=token(row.current_routing_outcome);
   if(outcome==="routed_to_confirmed_site"&&!row.site_confirmation_identity_matches_outcome_snapshot)gaps.push("site_confirmation_identity_missing");
   if(outcome==="safe_rescheduled"&&!row.safe_reschedule_identity_matches_outcome_snapshot)gaps.push("safe_reschedule_identity_missing");
   if(!["routed_to_confirmed_site","safe_rescheduled"].includes(outcome))gaps.push("service_specific_manual_routing_outcome_missing");
   const ownerRef=clean(s?.controlled_environment_owner_verification_reference);
   const ownerAt=clean(s?.controlled_environment_owner_verified_at);
   const ownerSite=clean(s?.controlled_environment_owner_verified_site_reference);
   const ownerWorkflow=clean(s?.controlled_environment_owner_verified_workflow_reference);
   if(!ownerRef||!recent(ownerAt,now))gaps.push("dated_attributable_owner_verification_missing_or_stale");
   if(!ownerSite||ownerSite!==clean(row.current_site_reference)||!ownerWorkflow||ownerWorkflow!==clean(row.current_workflow_reference))gaps.push("owner_site_workflow_verification_mismatch");
   if(outcome==="routed_to_confirmed_site"&&clean(row.current_site_confirmation_reference)==="")gaps.push("current_site_confirmation_missing");
   const jobs=whole(row.observed_capacity_jobs),window=whole(row.capacity_observation_window_days);
   const capState=token(row.current_capacity_state);
   if(capState==="bounded_observed_capacity_current"){
      if(!row.bounded_capacity_context_identity_matches_outcome_snapshot||jobs===null||window===null||window===0||
      clean(row.capacity_observation_site_reference)!==clean(row.current_site_reference)||
      !clean(row.capacity_observation_reference))gaps.push("bounded_site_capacity_evidence_mismatch");
   }else gaps.push("bounded_observed_capacity_unavailable");
   const isReady=gaps.length===0;
   output.push(Object.freeze({entity_type:row.entity_type,code:row.code,classification:row.current_service_classification||null,
      site_reference:row.current_site_reference||null,workflow_reference:row.current_workflow_reference||null,
      routing_outcome:row.current_routing_outcome||null,capacity_state:capState,observed_capacity_jobs:jobs,
      observation_window_days:window,owner_verification_reference:ownerRef||null,owner_verified_at:ownerAt||null,
      status:isReady?"owner_verified_bounded_observation_for_manual_review":"owner_or_site_capacity_review_required",
      missing:Object.freeze([...new Set(gaps)]),safe_default:"retain_manual_site_confirmation_safe_reschedule_or_capacity_review",
      automatic_routing_authorized:false,automatic_booking_change_authorized:false,future_capacity_claim_authorized:false}));
 }
 output.sort((a,b)=>id(a).localeCompare(id(b)));
 return Object.freeze({build:548,authority:"controlled_site_routing_capacity_owner_verification",
    status:!output.length?"unavailable":output.some(x=>x.missing.length)?"review_required":"manual_review_ready",
    row_count:output.length,manual_review_ready_count:output.filter(x=>!x.missing.length).length,
    rows:Object.freeze(output),source_read_only:true,owner_signoff_does_not_create_booking:true,
    all_site_claims_authorized:false,future_capacity_authorized:false,automatic_appointment_move_allowed:false,
    automatic_routing_allowed:false,booking_availability_change_allowed:false,customer_messaging_allowed:false,
    canonical_hold_narrowing_allowed:false,schema_or_r2_mutation_allowed:false});
}
