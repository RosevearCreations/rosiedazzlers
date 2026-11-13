// Rosie 880 — append-only source-bound history and historical grace monitors.
// Historical custody is evidence of prior checks, never a current provider readback.
export const hold880=reason=>({state:'HOLD',verified:false,reason,
  current_customer_read:false,current_financial_clearance:false});
export function eligibleWatch880(watch){
 const d=watch?.delivery_watch,a=watch?.owner_sla_renewal;
 if(watch?.ok!==true||d?.verified!==true||
  !['ORIGINAL_DELIVERY_CURRENT_SNAPSHOT','ORIGINAL_DELIVERY_AGED_REVIEW'].includes(d.state)||
  !/^[a-f0-9]{64}$/.test(d.source_chain_sha256||'')||
  !Number.isFinite(Date.parse(d.latest_original_signed_event_at))||
  !['OWNER_SLA_RENEWAL_REQUIRED','CURRENT_SOURCE_ACKNOWLEDGED','OWNER_SLA_RENEWAL_HOLD'].includes(a?.state)||
  (a.state!=='OWNER_SLA_RENEWAL_HOLD'&&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a?.source_check_id||'')))
  return hold880('Current original provider and exact refund source were not independently revalidated');
 return {state:'ORIGINAL_SOURCE_ELIGIBLE_FOR_APPEND',verified:true,
  delivery_state:d.state,source_chain_sha256:d.source_chain_sha256,
  latest_signed_event_at:d.latest_original_signed_event_at,
  owner_sla_state:a.state,source_check_id:a.state==='OWNER_SLA_RENEWAL_HOLD'?null:a.source_check_id};
}
export function chainWindow880(rows,kind){
 const hash=kind==='rotation'?'receipt_sha256':'entry_sha256';
 const previous=kind==='rotation'?'previous_receipt_sha256':'previous_entry_sha256';
 if(!Array.isArray(rows)||rows.length>50)return hold880('Original custody history unavailable or truncated');
 const ids=new Set();
 for(const r of rows){
  if(!/^[a-f0-9]{64}$/.test(r?.[hash]||'')||ids.has(r.id)||
     !Number.isFinite(Date.parse(r.observed_at)))return hold880('Original custody digest or timestamp invalid');
  ids.add(r.id);
 }
 for(let i=0;i<rows.length-1;i++){
  if(rows[i][previous]!==rows[i+1][hash]||
   Date.parse(rows[i].observed_at)<Date.parse(rows[i+1].observed_at))
   return hold880('Original custody sequence discontinuity or rollback observed');
 }
 return {state:'CHAIN_CONTIGUOUS_IN_READ_WINDOW',verified:true,records:rows.length,
  bounded_window_only:true,older_history_not_proven:rows.length>0&&!!rows.at(-1)[previous],
  externally_anchored:false};
}
export function graceExpiry880({receipts=[],roster,nowMs=Date.now()}={}){
 if(!roster?.ok)return hold880('Operator-trusted active/previous issuer roster unavailable');
 if(!Array.isArray(receipts)||receipts.length>50)return hold880('Historical receipt window incomplete');
 const current=roster.rows.filter(k=>k.status==='active');
 if(current.length!==1)return hold880('Exactly one operator active issuer required');
 const states=receipts.map(r=>{
  const pin=roster.rows.find(k=>k.issuer_id===r.previous_issuer_key_id);
  let state='HISTORICAL_PIN_REMOVED_HOLD';
  if(pin?.status==='revoked')state='HISTORICAL_PIN_REVOKED_HOLD';
  else if(pin?.status==='previous'&&Number.isFinite(Date.parse(pin.verify_until))&&
   Date.parse(pin.verify_until)===Date.parse(r.grace_verify_until)){
   const left=Date.parse(r.grace_verify_until)-nowMs;
   state=!Number.isFinite(left)?'INVALID_GRACE_HOLD':left<=0?'GRACE_EXPIRED':
    left<=604800000?'GRACE_EXPIRING_7_DAYS':'GRACE_WITHIN_WINDOW';
  }
  return {receipt_id:r.id,recorded_at:r.observed_at,state,
   previous_issuer_key_id:r.previous_issuer_key_id,
   active_issuer_key_id:r.active_issuer_key_id,
   grace_verify_until:r.grace_verify_until,
   current_active_matches_receipt:current[0].issuer_id===r.active_issuer_key_id};
 });
 const alert=states.some(x=>x.state!=='GRACE_WITHIN_WINDOW'||!x.current_active_matches_receipt);
 return {state:alert?'OWNER_GRACE_REVIEW_REQUIRED':'HISTORICAL_GRACE_WITHIN_WINDOW',
  verified:true,history_only:true,owner_followup_required:alert,
  receipts:states,live_original_source_recheck_not_inferred:true,
  no_key_rotated_or_revoked:true};
}
