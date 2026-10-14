// Build 556: unverified local-only HOLD intake. No automatic closure.
export const HOLD_DEFINITIONS_556=Object.freeze([
{id:"provider_outcomes_communications",kind:"provider_dependent",needs:["stripe_payment","paypal_payment","provider_refund","message_delivery"]},
{id:"local_search_provider_evidence",kind:"provider_dependent",needs:["search_console_property","google_business_profile_location"]},
{id:"recovery_backup_evidence",kind:"owner_action",needs:["backup_artifact","retention_location","nonproduction_drill_observation"]},
{id:"independent_device_visual_evidence",kind:"owner_action",needs:["customer_observation","detailer_observation","operations_observation","admin_observation"]},
{id:"maintenance_fleet_business_approval",kind:"owner_action",needs:["commercial_terms","bounded_pilot_outcome","capacity_travel_invoicing","stop_conditions"]},
{id:"seasonal_service_capability",kind:"owner_action",needs:["service_classification","equipment_temperature_limit","site_process_observation","public_wording_decision"]},
{id:"evidence_source_unavailable",kind:"unavailable",needs:["source_restoration_observation"]}
]);
const obj=x=>Boolean(x&&typeof x==="object"&&!Array.isArray(x));
const allowed=(x,keys)=>obj(x)&&Object.keys(x).every(k=>keys.includes(k));
const safe=x=>typeof x==="string"&&/^[A-Za-z0-9/][A-Za-z0-9_.:/#-]{2,95}$/.test(x)&&!/(secret|token|password|api.key|customer|email|telephone|bearer)/i.test(x)&&!/^https?:/i.test(x);
const time=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
const rowKeys=["hold_id","evidence_class","scope_key","evidence","owner_review"];
const evidenceKeys=["type","source_system","source_reference","scope_key","observed_at","outcome","device_type","browser_reference","route_reference","viewport_reference"];
const reviewKeys=["decision","reviewer_reference","reviewed_at","scope_key"];
export function build556OwnerHoldIntake(packet={},asOf=new Date().toISOString()){
 const now=time(asOf)??Date.now(),rows=obj(packet)&&Array.isArray(packet.rows)?packet.rows:[];
 const valid=allowed(packet,["rows","schema"])&&(packet.schema===undefined||packet.schema==="rosie-hold-intake-556")&&rows.length<=HOLD_DEFINITIONS_556.length;
 const items=HOLD_DEFINITIONS_556.map(def=>{
  const selected=rows.filter(r=>r?.hold_id===def.id),r=selected.length===1?selected[0]:null,gaps=[];
  if(!valid)gaps.push("invalid_or_oversized_packet");
  if(selected.length!==1)gaps.push(selected.length?"duplicate_hold_records":"hold_evidence_not_submitted");
  if(r&&!allowed(r,rowKeys))gaps.push("unexpected_or_sensitive_fields");
  if(r&&(r.evidence_class!==def.kind||!safe(r.scope_key)))gaps.push("class_or_scope_mismatch");
  const evidence=r&&Array.isArray(r.evidence)?r.evidence:[];
  if(evidence.length!==def.needs.length)gaps.push("missing_required_source_evidence");
  const kinds=new Set(evidence.map(e=>e?.type));
  if(kinds.size!==evidence.length||!def.needs.every(x=>kinds.has(x)))gaps.push("missing_duplicate_or_mismatched_evidence_types");
  const observed=[];
  for(const e of evidence){
   if(!allowed(e,evidenceKeys)||!safe(e?.source_reference)||!safe(e?.scope_key)||e.scope_key!==r?.scope_key||
      e.source_system!==(def.kind==="provider_dependent"?"provider":"owner")||e.outcome!=="observed_pass")
      gaps.push("source_attribution_or_negative_observation");
   const t=time(e?.observed_at);observed.push(t);
   if(t===null||t>now+60000||now-t>30*86400000)gaps.push("stale_future_or_invalid_evidence");
   if(def.id==="independent_device_visual_evidence"&&(!["phone","tablet","desktop"].includes(e.device_type)||
    !safe(e.browser_reference)||!safe(e.route_reference)||!safe(e.viewport_reference)))gaps.push("device_browser_route_viewport_required");
  }
  if(def.id==="independent_device_visual_evidence"){
   const deviceTypes=new Set(evidence.map(e=>e?.device_type));
   if(!["phone","tablet","desktop"].every(x=>deviceTypes.has(x)))gaps.push("representative_device_types_missing");
  }
  const review=r?.owner_review;
  if(!allowed(review,reviewKeys)||!safe(review?.reviewer_reference)||!safe(review?.scope_key)||review?.scope_key!==r?.scope_key||
   !["retain_hold","request_manual_closure_review"].includes(review?.decision))gaps.push("explicit_owner_review_required");
  const reviewed=time(review?.reviewed_at);
  if(reviewed===null||reviewed>now+60000||now-reviewed>30*86400000||observed.some(t=>t!==null&&reviewed<t))
   gaps.push("owner_review_date_invalid_or_before_evidence");
  if(def.kind==="unavailable")gaps.push("independent_source_restoration_required");
  const unique=[...new Set(gaps)],request=review?.decision==="request_manual_closure_review";
  return Object.freeze({hold_id:def.id,evidence_class:def.kind,required_evidence_types:Object.freeze([...def.needs]),
   submitted:!!r,status:unique.length?"evidence_intake_hold":request?"manual_closure_review_candidate_unverified":"owner_retained_hold",
   owner_decision:review?.decision==="retain_hold"?"retain_hold":request?"request_manual_closure_review":null,
   gaps:Object.freeze(unique),scope_key:safe(r?.scope_key)?r.scope_key:null,
   safe_source_references:Object.freeze(evidence.filter(e=>safe(e?.source_reference)).map(e=>e.source_reference)),
   reviewer_reference:safe(review?.reviewer_reference)?review.reviewer_reference:null,
   hold_closed:false,evidence_independently_verified:false,canonical_inventory_updated:false});
 });
 return Object.freeze({build:556,authority:"metadata_only_manual_owner_hold_intake",
  submitted_hold_count:items.filter(x=>x.submitted).length,
  manual_review_candidate_count:items.filter(x=>x.status==="manual_closure_review_candidate_unverified").length,
  items:Object.freeze(items),truth_boundary:Object.freeze({all_canonical_holds_remain_open:true,automatic_hold_closure:false,
   provider_evidence_not_verified:true,db_or_r2_written:false,booking_payment_or_customer_action:false,public_claim_changed:false})});
}
