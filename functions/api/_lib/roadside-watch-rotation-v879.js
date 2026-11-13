// Rosie 879: source-verified, fail-closed snapshot review and pinned rotation gates.
// A snapshot does not establish long-horizon stability, customer reading or closure.
export const hold879 = reason => ({state:'HOLD',verified:false,reason,
  provider_delivery_claimed:false,customer_read_claimed:false,financial_clearance:false});
export function reviewDelivery879(native, nowMs=Date.now()){
  if(native?.ok!==true || native.delivery_corroborated!==true ||
    native.original_dispatch_record_verified!==true ||
    native.original_owner_draft_scope_verified!==true ||
    native.original_evidence_missing_is_hold!==false ||
    !/^[a-f0-9]{64}$/.test(native.original_native_event_chain_sha256||'') ||
    !Number.isFinite(Date.parse(native.latest_signed_event_at)) ||
    Date.parse(native.latest_signed_event_at)>nowMs+300000)
    return hold879('Original signed native provider readback or chain is missing, conflicting or invalid');
  const age=Math.max(0,Math.floor((nowMs-Date.parse(native.latest_signed_event_at))/60000));
  return {state:age>43200?'ORIGINAL_DELIVERY_AGED_REVIEW':'ORIGINAL_DELIVERY_CURRENT_SNAPSHOT',
    verified:true,source_chain_sha256:native.original_native_event_chain_sha256,
    latest_original_signed_event_at:native.latest_signed_event_at,
    event_age_minutes:age,manual_recheck_recommended:age>43200,
    stability_across_multiple_checks_not_established:true,
    provider_delivery_claimed:true,customer_read_claimed:false,financial_clearance:false};
}
export function reviewRenewal879(audit){
  if(audit?.ok!==true || !Array.isArray(audit.cases) ||
    audit.original_cases_missing===true || audit.cases.length<1 ||
    audit.cases.length>=100 || !/^[0-9a-f-]{36}$/i.test(audit.source_check_id||'') ||
    !['CRITICAL','HIGH','REVIEW'].includes(audit.severity) ||
    !['SLA_WITHIN_POLICY','SLA_BREACHED'].includes(audit.original_sla_state))
    return {state:'OWNER_SLA_RENEWAL_HOLD',renewal_required:false,
      reason:'No verifiable original open refund case, current source or severity'};
  if(audit.cases.some(x=>!['OWNER_ACK_REQUIRED','OWNER_ACKNOWLEDGED'].includes(x.state)))
    return {state:'OWNER_SLA_RENEWAL_HOLD',renewal_required:false,
      reason:'Original acknowledgment custody is conflicting or unavailable'};
  const required=audit.cases.filter(x=>x.state==='OWNER_ACK_REQUIRED').length;
  return {state:required?'OWNER_SLA_RENEWAL_REQUIRED':'CURRENT_SOURCE_ACKNOWLEDGED',
    renewal_required:required>0,required_cases:required,open_cases:audit.cases.length,source_check_id:audit.source_check_id,
    original_sla_state:audit.original_sla_state,original_deadline_unchanged:true,
    automatic_acknowledgment:false,no_refund_or_case_mutation:true};
}
export function checkRotation879({roster,priorKeyId,newKeyId,verifiedPrevious,nowMs=Date.now()}={}){
  if(!roster?.ok || !Array.isArray(roster.rows) || !priorKeyId || !newKeyId ||
    priorKeyId===newKeyId || verifiedPrevious?.ok!==true ||
    verifiedPrevious.key_status!=='previous' ||
    verifiedPrevious.issuer_key_id!==priorKeyId ||
    verifiedPrevious.rotation_readiness!=='PREVIOUS_PIN_WITHIN_GRACE')
    return hold879('Original historical issuer proof is not verified inside the operator-pinned grace window');
  const current=roster.rows.filter(k=>k.status==='active');
  const previous=roster.rows.filter(k=>k.status==='previous');
  if(current.length!==1 || previous.length<1 ||
    !previous.some(k=>k.issuer_id===priorKeyId) ||
    current[0].issuer_id!==newKeyId ||
    !Number.isFinite(Date.parse(previous.find(k=>k.issuer_id===priorKeyId)?.verify_until)) ||
    Date.parse(previous.find(k=>k.issuer_id===priorKeyId).verify_until)<=nowMs)
    return hold879('Post-rotation operator roster does not prove distinct new active key and unexpired previous issuer');
  return {state:'POST_ROTATION_OPERATOR_PIN_CONFIRMED',verified:true,
    previous_issuer_key_id:priorKeyId,active_issuer_key_id:newKeyId,
    previous_grace_until:previous.find(k=>k.issuer_id===priorKeyId).verify_until,
    original_historical_signature_verified:true,
    operator_configuration_readback_only:true,
    live_cloudflare_change_not_performed_by_this_request:true,
    external_independent_witness:false,financial_clearance:false};
}
