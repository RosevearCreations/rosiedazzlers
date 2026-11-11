// Build 844. Independently pinned public verification keys are configured
// outside the operator browser. A signature establishes witness custody; it
// is not a native provider-signed statement or hardware device attestation.
const FIELDS={
  provider:['version','kind','booking_id','post_id','platform','external_post_id','external_post_url','outcome','provider_request_id','provider_http_status','provider_result','provider_response_sha256','observed_at','nonce','witness_id','provider_access_authenticated'],
  device:['version','kind','booking_id','project_id','device_type','observation_audit_id','owner_closure_audit_id','witness_id','witness_reference_sha256','observed_at','nonce','accessibility_pass','recovery_pass']
};

export const PROVIDER_STATUS_844={post_live:'provider_witness_verified_live',post_removed:'provider_witness_verified_removed'};
export const DEVICE_AUDIT_844='Build 844 independently signed device witness:';
export const RECALL_AUDIT_844='Build 844 public derivative R2 deletion:';

const decodeB64Url=(value,bytes)=>{
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))return null;
  try{
    const b64=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
    const data=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    return data.length===bytes?data:null;
  }catch{return null;}
};

export function canonical844(kind,receipt){
  const fields=FIELDS[kind];
  if(!fields||!receipt||typeof receipt!=='object'||Array.isArray(receipt))throw Error('Unknown receipt type.');
  if(Object.keys(receipt).length!==fields.length||Object.keys(receipt).some(k=>!fields.includes(k))||fields.some(k=>receipt[k]===undefined||receipt[k]===null))throw Error('Receipt must contain only the exact approved signed fields.');
  return `ROSIE-844-${kind.toUpperCase()}-V1\n${JSON.stringify(fields.map(k=>receipt[k]))}`;
}

export async function verifyPinnedWitness844(env,kind,receipt,signature){
  const keyName=kind==='provider'?'ROSIE_SOCIAL_PROVIDER_WITNESS_ED25519_PUBLIC_KEY':'ROSIE_DEVICE_INDEPENDENT_WITNESS_ED25519_PUBLIC_KEY';
  const pub=decodeB64Url(env?.[keyName],32),sig=decodeB64Url(signature,64);
  if(!pub)return {ok:false,reason:`Independent ${kind} witness public-key pin is not enrolled.`};
  if(!sig)return {ok:false,reason:'A valid detached Ed25519 witness signature is required.'};
  let message;
  try{message=canonical844(kind,receipt);}catch(e){return {ok:false,reason:e.message};}
  try{
    const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    const valid=await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(message));
    return valid?{ok:true,pin_id:keyName,signature_valid:true}:{ok:false,reason:'Independent witness signature does not verify against the enrolled pin.'};
  }catch{return {ok:false,reason:'Independent witness signature verification is unavailable.'};}
}

export function freshWitness844(receipt,maxAgeMs=24*60*60*1000){
  const time=Date.parse(receipt?.observed_at||'');
  return Number.isFinite(time)&&Math.abs(Date.now()-time)<=maxAgeMs;
}

export function digestReference844(value){return typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);}
export function nonce844(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(value);}
