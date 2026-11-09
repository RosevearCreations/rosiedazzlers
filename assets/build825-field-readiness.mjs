// Build 825: classify source-backed readiness without automatically closing owner HOLDs.
// The rates remain explicitly provisional audit estimates, never inferred from row counts.
export const EVIDENCE_SOURCES_825=Object.freeze({
  handoffs:"customer_worksite_supervisor_notes_v824",
  followups:"customer_worksite_followups_v814",
  bookings:"bookings",
  fieldUpdates:"job_updates",
  timeEntries:"job_time_entries",
  payroll:"staff_payroll_runs",
  invoices:"final_balance_payment_requests",
  accounting:"accounting_period_closes",
  financeJournal:"accounting_journal_entries",
  tax:"accounting_tax_year_support",
  social:"social_dispatch_attempts",
  inventory:"catalog_inventory_movements",
  payments:"quote_payment_webhook_events",
  integration:"rosevear_integration_v1_original_receipt_intake",
  creative:"creative_projects"
});
const ROLE_IDS=new Set(["customer","detailer","operations","admin"]);
const DEVICE_IDS=new Set(["phone","tablet","desktop"]);
const SAMPLES=Object.freeze(["handoffs","followups","bookings","fieldUpdates","timeEntries","payroll","invoices","accounting","financeJournal","tax","social","inventory","payments","integration","creative"]);
export function countFromPostgrest825(header,bodyLength=0){
  if(typeof header!=="string")return null;
  const result=/^(?:\d+-\d+|\*)\/(\d+)$/.exec(header.trim());
  if(!result)return null;
  const n=Number(result[1]);
  return Number.isSafeInteger(n)&&n>=0&&bodyLength<=1?n:null;
}
export function verifiedEvidenceCounts825(sources={}){
  const result={};
  for(const key of SAMPLES){
    const item=sources[key];
    const n=item?.status==="available"&&Number.isSafeInteger(item.count)&&item.count>=0?item.count:null;
    result[key]={status:n===null?"unavailable":"available",count:n,observed:n!==null&&n>0};
  }
  return result;
}
export function deviceMatrix825(deviceEvidence=null){
  const empty={status:"unavailable",closure_candidate:false,operator_review_required:true,
    roles:[...ROLE_IDS].map(id=>({id,status:"unavailable",current_pass:false,current_regression:false})),
    devices:[...DEVICE_IDS].map(id=>({id,status:"unavailable",observed:false})),reason:"Authenticated device authority unavailable."};
  if(!deviceEvidence||typeof deviceEvidence!=="object")return empty;
  const roles=empty.roles.map(base=>{
    const r=Array.isArray(deviceEvidence.roles)?deviceEvidence.roles.find(x=>x?.id===base.id):null;
    if(!r)return base;
    return {id:base.id,status:typeof r.status==="string"?r.status:"unavailable",
      current_pass:r.current_pass===true,current_regression:r.current_regression===true,
      observed_at:typeof r.observed_at==="string"?r.observed_at:null,
      device_classes:Array.isArray(r.device_classes)?r.device_classes.filter(x=>DEVICE_IDS.has(x)):[]};
  });
  const devices=empty.devices.map(base=>{
    const d=Array.isArray(deviceEvidence.devices)?deviceEvidence.devices.find(x=>x?.id===base.id):null;
    if(!d)return base;
    return {id:base.id,status:typeof d.status==="string"?d.status:"unavailable",observed:d.observed===true,
      observed_at:typeof d.observed_at==="string"?d.observed_at:null};
  });
  const regression=roles.some(r=>r.current_regression);
  const currentRoles=roles.every(r=>r.current_pass);
  const currentDevices=devices.every(d=>d.observed&&d.status==="observed_dated");
  const candidate=deviceEvidence.closure_candidate===true&&currentRoles&&currentDevices&&!regression;
  return {status:regression?"regression_hold":candidate?"operator_review_candidate":"hold",
    closure_candidate:candidate,operator_review_required:true,roles,devices,
    reason:regression?"At least one current authenticated negative observation requires triage.":candidate
      ?"Full current role/device observations present; explicit human closure and source checks remain required."
      :"Role/device observations incomplete, stale or missing; source checks cannot replace real-device proof."};
}
export function fieldAcceptance825({sources={},deviceEvidence=null,generatedAt=null}={}){
  const counts=verifiedEvidenceCounts825(sources),devices=deviceMatrix825(deviceEvidence);
  const handoff=counts.handoffs,followups=counts.followups;
  const handoffStatus=handoff.status==="unavailable"||followups.status==="unavailable"?"unavailable":
    handoff.count===0||followups.count===0?"owner_action":"source_observed_review_required";
  const realFieldEvidence=counts.fieldUpdates.status==="available"&&counts.fieldUpdates.count>0;
  return {generated_at:generatedAt,counts,devices,
    handoff:{status:handoffStatus,recorded_private_notes:handoff.count,recorded_followups:followups.count,
      source_observation:handoffStatus==="source_observed_review_required",
      independent_field_acceptance: false,
      reason:handoffStatus==="unavailable"?"The authorized handoff or follow-up evidence source is unavailable.":
        handoffStatus==="owner_action"?"No real follow-up and private handoff are jointly evidenced. A green source build cannot replace a witnessed field test.":
        "Source-backed supervisor handoffs exist. The operator must still verify the actual session, selected role/device, current revision and outcome."},
    operational_readiness:realFieldEvidence&&devices.closure_candidate&&handoffStatus==="source_observed_review_required"
      ?"operator_review_required":"hold",
    canonical_hold_changed:false,auto_completion_percent_increased:false,source_green_is_not_business_evidence:true,
    owner_review_required:true};
}
export function moduleSignal825(module,acceptance){
  const key=module?.source||"";
  const source=acceptance?.counts?.[key];
  if(!source||source.status==="unavailable")return {status:"source_unavailable",label:"Source unavailable — HOLD"};
  if(source.count===0)return {status:"missing_observation",label:"No recorded source events — HOLD"};
  if(module?.role){
    const match=acceptance?.devices?.roles?.find(r=>r.id===module.role);
    if(!match||match.current_pass!==true||match.current_regression===true)return {status:"device_hold",label:"Source activity present; role/device acceptance HOLD"};
  }
  return {status:"owner_review",label:"Evidence found — owner review required"};
}
