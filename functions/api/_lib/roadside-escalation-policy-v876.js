// Rosie 876: deterministic, non-mutating escalation policy for refund source drift.
// A release/dashboard GREEN is not financial clearance. Never close/open a payment.
const known=new Set(['SOURCE_STABLE','REFUND_COMPLETENESS_DRIFT','PROVIDER_SOURCE_HOLD',
 'SAVED_SOURCE_HOLD','BASELINE_MISSING','BOOKING_ID_MISMATCH','STALE_SOURCE_BASELINE']);
export function classifyRoadsideRefundEscalation(drift,{nowMs=Date.now(),lastCheckAt=null}={}){
 const state=known.has(drift?.state)?drift.state:'PROVIDER_SOURCE_HOLD';
 const base={policy:'rosie-roadside-refund-v876',provider_clearance:false,
  automatic_financial_mutation:false,requires_owner_acceptance:true,
  external_customer_contact:false};
 if(state==='SOURCE_STABLE'&&drift?.alert===false)
  return {...base,severity:'NONE',action:'monitor',requires_owner_acceptance:false,
   due_at:null,owner_alert:false,reason:'Original source and saved verified snapshot match'};
 const critical=state==='REFUND_COMPLETENESS_DRIFT'||state==='BOOKING_ID_MISMATCH';
 const severe=critical||state==='PROVIDER_SOURCE_HOLD'||state==='SAVED_SOURCE_HOLD';
 const severity=critical?'CRITICAL':severe?'HIGH':'REVIEW';
 // Time windows are an owner escalation policy, not a guarantee of delivery.
 const hours=severity==='CRITICAL'?1:severity==='HIGH'?4:24;
 const baseMs=Number.isFinite(nowMs)?nowMs:Date.now();
 const dueAt=new Date(baseMs+hours*3600000).toISOString();
 const oldAt=lastCheckAt?Date.parse(lastCheckAt):NaN;
 return {...base,severity,action:critical?'freeze_closure_and_owner_review':
    severe?'owner_source_recheck':'refresh_verified_baseline',
  due_at:dueAt,owner_alert:true,
  prior_check_age_minutes:Number.isFinite(oldAt)?Math.max(0,Math.floor((baseMs-oldAt)/60000)):null,
  reason:drift?.reason||'Refund source proof missing or changed'};
}
export function rollupRoadsideEscalations(policies,{coverageIncomplete=false,nowMs=Date.now()}={}){
 const counts={CRITICAL:0,HIGH:0,REVIEW:0,NONE:0};
 for(const x of policies||[])counts[x?.severity]!==undefined&&counts[x.severity]++;
 const highest=counts.CRITICAL?'CRITICAL':counts.HIGH?'HIGH':counts.REVIEW?'REVIEW':'NONE';
 return {schema:'rosie-roadside-owner-watch-v876',checked_at:new Date(nowMs).toISOString(),
  severity:coverageIncomplete&&highest==='NONE'?'REVIEW':highest,counts,
  source_coverage_incomplete:coverageIncomplete,
  alert:highest!=='NONE'||coverageIncomplete,owner_triage_required:highest!=='NONE'||coverageIncomplete,
  no_customer_identifiers:true,no_payment_or_booking_mutation:true,
  monitor_coverage:coverageIncomplete?'PARTIAL':'BOUNDED_COMPLETE',
  external_owner_message_sent:false};
}
