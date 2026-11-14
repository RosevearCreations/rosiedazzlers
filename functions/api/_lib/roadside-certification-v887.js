// Rosie 887 — independently validate signed original 885 audits and owner renewals.
// This module does not fetch GitHub history. Its caller MUST supply an independently
// complete, fully paginated original source inventory and pinned external public key.
// Never treat a deploy/CI GREEN signal as original operational acceptance.
import {verifyAudit885,parseAudit885,verifyRenewal885,parseRenewal885}
  from './roadside-audit-v885.js';
import {reconcileAudits886,horizons886} from './roadside-recurrence-v886.js';
import {digest883} from './roadside-custody-v883.js';
export const certificationSchema887='rosie887-independent-source-closure-v1';
const validId=x=>Number.isSafeInteger(x)&&x>0;
const hold=(...reason)=>({schema:certificationSchema887,state:'HOLD',
  reasons:[...new Set(reason)],source_certified:false,owner_renewal_stable:false,
  operational_green_inferred:false,software_release_green_inferred:false});
export async function certifyOriginalClosure887({
  auditComments,renewalComments,pin,sourceInventoryComplete=false,
  renewalInventoryComplete=false,sourceSchedulerRunsVerified=false,
  originalClosureApproved=false,now=Date.now()
}={}) {
  if(!sourceInventoryComplete||!renewalInventoryComplete)
    return hold('ORIGINAL_COMPLETE_HISTORY_REQUIRED');
  if(!Array.isArray(auditComments)||!auditComments.length||
    !Array.isArray(renewalComments)||!renewalComments.length||
    auditComments.length>2000||renewalComments.length>2000)
    return hold('ORIGINAL_BOUNDED_SIGNED_HISTORY_MISSING');
  if(!Number.isFinite(now)||!pin||typeof pin!=='object')
    return hold('ORIGINAL_PIN_OR_TIME_INVALID');
  const ids=new Set(),runs=new Set(),audits=[];
  for(const item of auditComments) {
    if(!validId(item?.id)||ids.has(item.id)||item.user?.login!=='github-actions[bot]'||
       !await verifyAudit885(item.body,pin,now))
      return hold('ORIGINAL_AUDIT_IDENTITY_OR_SIGNATURE_HOLD');
    ids.add(item.id);
    const payload=parseAudit885(item.body)?.payload;
    if(runs.has(String(payload.run_id)))return hold('ORIGINAL_AUDIT_DUPLICATE_RUN_HOLD');
    runs.add(String(payload.run_id));
    audits.push({payload,body:item.body});
  }
  audits.sort((a,b)=>Date.parse(a.payload.recorded_at)-Date.parse(b.payload.recorded_at));
  const latest=audits.at(-1);
  if(latest.payload.chain_state!=='INDEPENDENT_RETENTION_CHAIN_VERIFIED')
    return hold('LATEST_ORIGINAL_CHAIN_NOT_VERIFIED');
  // v886 expects a normalized chain state only after this cryptographic verification.
  const normalized=audits.map(x=>({...x.payload,
    chain_state:x.payload.chain_state==='INDEPENDENT_RETENTION_CHAIN_VERIFIED'?'VERIFIED':'HOLD'}));
  const renewalIds=new Set(),renewals=[];
  for(const item of renewalComments){
    if(!validId(item?.id)||renewalIds.has(item.id)||
      item.user?.login!=='github-actions[bot]'||
      !await verifyRenewal885(item.body,pin,now))
      return hold('ORIGINAL_RENEWAL_IDENTITY_OR_SIGNATURE_HOLD');
    renewalIds.add(item.id);
    renewals.push(parseRenewal885(item.body).payload);
  }
  renewals.sort((a,b)=>Date.parse(a.recorded_at)-Date.parse(b.recorded_at));
  const currentRenewal=renewals.at(-1);
  const latestAuditHash=await digest883(latest.body);
  const linked=currentRenewal.audit_sha256===latestAuditHash&&
    currentRenewal.checkpoint_sha256===latest.payload.latest_checkpoint_sha256;
  // Strictly require a continuous renewal chain, starting at GENESIS.
  let previousHash=null;
  for(const item of renewalComments.slice().sort((a,b)=>{
    const aTime=Date.parse(parseRenewal885(a.body).payload.recorded_at);
    const bTime=Date.parse(parseRenewal885(b.body).payload.recorded_at);
    return aTime-bTime;
  })){
    const p=parseRenewal885(item.body).payload;
    if(p.previous_renewal_sha256!==previousHash)
      return hold('ORIGINAL_OWNER_RENEWAL_CHAIN_BROKEN');
    previousHash=await digest883(item.body);
  }
  const ownerRenewal=linked?{
    original_owner_verified:true,recorded_at:currentRenewal.recorded_at,
    audit_run_id:latest.payload.run_id,
    latest_checkpoint_sha256:currentRenewal.checkpoint_sha256
  }:null;
  const assessment=reconcileAudits886(normalized,{now,ownerRenewal});
  const reasons=[...assessment.reasons];
  if(!linked)reasons.push('OWNER_RENEWAL_NOT_LINKED_TO_LATEST_ORIGINAL_AUDIT');
  if(!sourceSchedulerRunsVerified)reasons.push('ORIGINAL_SCHEDULER_RUN_INVENTORY_NOT_VERIFIED');
  if(!originalClosureApproved)reasons.push('ORIGINAL_OWNER_CLOSURE_NOT_INDEPENDENTLY_CONFIRMED');
  for(const h of horizons886)
    if(latest.payload.sla[h]!=='VERIFIED')reasons.push('ORIGINAL_'+h.toUpperCase()+'_MATURITY_HOLD');
  return {schema:certificationSchema887,state:reasons.length?'HOLD':'CERTIFIED',
    reasons:[...new Set(reasons)],source_certified:reasons.length===0,
    owner_renewal_stable:linked&&assessment.reasons.every(x=>!x.includes('OWNER_RENEWAL')),
    operational_green_inferred:false,software_release_green_inferred:false,
    original_audits:audits.length,original_renewals:renewals.length,
    latest_original_run_id:latest.payload.run_id,
    latest_checkpoint_sha256:latest.payload.latest_checkpoint_sha256,
    horizons:assessment.horizons};
}
