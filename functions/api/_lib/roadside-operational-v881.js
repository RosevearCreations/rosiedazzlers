// Rosie 881 — aggregate-only scheduled assessment of persisted original observations.
// A persisted observation is not a live original vendor readback or customer-open receipt.
const hex = s => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
const stamp = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
const hold = reason => ({ok:false,build:881,state:'MONITOR_HOLD',reason,
  alert:true,severity:'HIGH',no_customer_identifiers:true,
  original_provider_current_delivery_not_inferred:true,financial_clearance:false});
export function assessRoadsideOperational881({
  nativeRows,rotationRows,roster,nowMs=Date.now(),
  nativeTruncated=false,rotationTruncated=false
}={}){
 if(!Array.isArray(nativeRows)||!Array.isArray(rotationRows)||
    nativeRows.length>60||rotationRows.length>60)
  return hold('Bounded original history unavailable');
 const native=new Map();
 let nativeChange=0,nativeBroken=0,nativeStale=0,nativeAged=0;
 for(const row of nativeRows){
  if(!row?.draft_id||!hex(row.entry_sha256)||!hex(row.source_chain_sha256)||
    !stamp(row.observed_at)||!stamp(row.latest_signed_event_at))
   return hold('Original native history contains invalid digest or time');
  const prior=native.get(row.draft_id);
  if(prior){
   if(prior.previous_entry_sha256!==row.entry_sha256||
      Date.parse(prior.observed_at)<Date.parse(row.observed_at)) nativeBroken++;
   if(prior.source_chain_sha256!==row.source_chain_sha256)nativeChange++;
  }else{
   if(nowMs-Date.parse(row.observed_at)>86400000)nativeStale++;
   if(nowMs-Date.parse(row.latest_signed_event_at)>30*86400000)nativeAged++;
  }
  native.set(row.draft_id,row);
 }
 let grace7=0,grace72=0,expired=0,pinHold=0,rotationBroken=0;
 const last=new Map(),active=roster?.ok&&Array.isArray(roster.rows)?
  roster.rows.filter(k=>k.status==='active'):[];
 for(const row of rotationRows){
  if(!row?.draft_id||!hex(row.receipt_sha256)||!stamp(row.observed_at)||
   !stamp(row.grace_verify_until)||typeof row.previous_issuer_key_id!=='string'||
   typeof row.active_issuer_key_id!=='string')
   return hold('Original rotation custody is malformed');
  const prior=last.get(row.draft_id);
  if(prior&&(prior.previous_receipt_sha256!==row.receipt_sha256||
    Date.parse(prior.observed_at)<Date.parse(row.observed_at)))rotationBroken++;
  last.set(row.draft_id,row);
  if(!roster?.ok||active.length!==1){pinHold++;continue;}
  const old=roster.rows.find(x=>x.issuer_id===row.previous_issuer_key_id);
  if(!old||old.status!=='previous'||
    !stamp(old.verify_until)||
    Date.parse(old.verify_until)!==Date.parse(row.grace_verify_until)||
    active[0].issuer_id!==row.active_issuer_key_id){pinHold++;continue;}
  const left=Date.parse(row.grace_verify_until)-nowMs;
  if(left<=0)expired++;
  else if(left<=72*3600000){grace72++;grace7++;}
  else if(left<=7*86400000)grace7++;
 }
 const incomplete=nativeTruncated||rotationTruncated;
 const zeroNative=nativeRows.length===0,zeroRotations=rotationRows.length===0;
 const danger=expired+nativeBroken+rotationBroken>0;
 const high=pinHold+nativeChange+grace72>0||incomplete;
 const review=zeroNative||zeroRotations||nativeStale+nativeAged+grace7>0;
 const severity=danger?'CRITICAL':high?'HIGH':review?'REVIEW':'NONE';
 return {ok:true,build:881,state:severity==='NONE'?'BOUNDED_HISTORY_NO_EXCEPTION':
  'OWNER_HISTORY_EXCEPTION_REVIEW',severity,alert:severity!=='NONE',
  coverage_incomplete:incomplete,
  native_observations:nativeRows.length,original_drafts_observed:native.size,
  native_source_changes_review:nativeChange,broken_native_chain_links:nativeBroken,
  stale_native_observations:nativeStale,aged_signed_events:nativeAged,
  rotation_receipts:rotationRows.length,
  broken_rotation_chain_links:rotationBroken,
  grace_expiring_seven_days:grace7,grace_expiring_72_hours:grace72,
  grace_expired:expired,pin_custody_hold:pinHold,
  no_original_native_history:zeroNative,no_original_rotation_receipts:zeroRotations,
  no_customer_identifiers:true,original_provider_current_delivery_not_inferred:true,
  no_customer_open_evidence:true,no_financial_or_key_mutation:true,
  independent_anchor_status_not_inferred:true};
}
export function validateAnchorPublic881(publicJwk,issuerRoster){
 const valid=publicJwk?.kty==='OKP'&&publicJwk?.crv==='Ed25519'&&
  typeof publicJwk.x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(publicJwk.x);
 return valid&&issuerRoster?.ok===true&&
  !issuerRoster.rows.some(k=>k.public_jwk?.x===publicJwk.x);
}
export function verifyAnchorCandidate881(row){
 return !!row&&hex(row.receipt_sha256)&&stamp(row.observed_at)&&
  stamp(row.grace_verify_until)&&row.draft_id!==undefined;
}
