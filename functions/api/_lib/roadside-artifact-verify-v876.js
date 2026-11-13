// Rosie 876: integrity validation of previously downloaded Build 874 artifact.
// SHA-256 is NOT a signature; server-side original ledger readback is mandatory.
const encoder=new TextEncoder();
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
export function validateClosureEnvelope(artifact,draftId){
 if(!artifact||typeof artifact!=='object'||Array.isArray(artifact)||
  artifact.schema!=='rosie-roadside-closure-export-v874'||
  artifact.integrity?.algorithm!=='SHA-256'||
  !/^[a-f0-9]{64}$/.test(artifact.integrity?.digest_sha256||'')||
  artifact.integrity?.independently_signed!==false||
  artifact.closure?.draft_id!==draftId||!uuid(draftId)||
  ![artifact.closure?.id,artifact.closure?.dispatch_id,
    artifact.closure?.device_challenge_id,artifact.closure?.net_check_id].every(uuid)||
  artifact.dispatch?.id!==artifact.closure.dispatch_id||
  artifact.original_device_witness?.id!==artifact.closure.device_challenge_id||
  artifact.original_deposit_snapshot?.id!==artifact.closure.net_check_id||
  !Array.isArray(artifact.independent_provider_receipts)||artifact.independent_provider_receipts.length>100||
  !Array.isArray(artifact.refund_case_history)||artifact.refund_case_history.length>100)
  return {ok:false,reason:'Original closure source or integrity envelope is invalid'};
 return {ok:true};
}
export async function verifyClosurePayloadDigest(artifact){
 const digest=artifact.integrity?.digest_sha256||'';
 const e={...artifact};delete e.integrity;
 const serialized=JSON.stringify(e);
 if(encoder.encode(serialized).length>65536)return false;
 const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(serialized));
 const hex=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
 let diff=0;if(digest.length!==hex.length)return false;
 for(let i=0;i<hex.length;i++)diff|=hex.charCodeAt(i)^digest.charCodeAt(i);
 return diff===0;
}
export function compareOriginalClosureEvidence(artifact,original){
 const same=(left,right,keys)=>keys.every(k=>left?.[k]===right?.[k]);
 const closure=['id','draft_id','dispatch_id','device_challenge_id','net_check_id',
   'owner_actor','owner_note','closed_at','outcome'];
 const dispatch=['id','draft_id','share_id','provider','provider_message_id','state','receipt_at'];
 const device=['id','draft_id','state','issued_at','completed_at','media_id',
   'owner_accepted_by','owner_accepted_at'];
 const net=['id','draft_id','booking_id','provider','source','state','gross_cents',
   'refunded_cents','net_cents','net_verified','checked_at'];
 const receipt=['id','dispatch_id','provider_event_id','provider_message_id',
   'event_type','effective_state','received_at','signature_verified'];
 const caseKeys=['id','state','issue_code','opened_at','closed_at','closed_source_check_id'];
 const exists=rows=>Array.isArray(rows)&&rows.every(x=>x&&typeof x.id==='string');
 if(!same(artifact.closure,original.closure,closure)||
  !same(artifact.dispatch,original.dispatch,dispatch)||
  !same(artifact.original_device_witness,original.device,device)||
  !same(artifact.original_deposit_snapshot,original.net,net)||
  !exists(original.receipts)||!exists(original.cases))return false;
 for(const r of artifact.independent_provider_receipts){
  const source=original.receipts.find(x=>x.id===r.id);
  const receiptFields=Object.hasOwn(r,'provider_message_id')?receipt:
   receipt.filter(k=>k!=='provider_message_id');
  if(!source||!same(r,source,receiptFields))return false;
 }
 for(const c of artifact.refund_case_history){
  const source=original.cases.find(x=>x.id===c.id);
  if(!source||!same(c,source,caseKeys))return false;
 }
 return artifact.independent_provider_receipts.some(x=>
  x.signature_verified===true&&x.event_type==='delivered'&&
  x.effective_state==='delivery_confirmed'&&x.dispatch_id===artifact.dispatch.id)&&
  artifact.original_device_witness?.state==='owner_accepted'&&
  artifact.original_deposit_snapshot?.net_verified===true;
}
