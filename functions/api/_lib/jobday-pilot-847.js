// Build 847: conservative post-closure conflict classification and independent
// Master source-contract acknowledgment. No provider or Master side effects.
export const REOPEN_STATUS_847='recall_reopened_verified_provider_conflict';
export const PILOT_AUDIT_847='Build 847 provider custodian pilot review:';
export const MASTER_AUDIT_847='Build 847 independently signed AI Data contract receipt:';
export const MASTER_CONTRACT_847='rosie.ai-data.social-evidence.preview.v847';

const live847=a=>a?.status==='provider_api_authenticated_post_visible'&&a.response_summary?.authenticated_provider_read===true&&a.response_summary?.provider_http_status===200||a?.status==='provider_witness_verified_live'&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.provider_result==='provider_post_found'&&a.response_summary?.provider_http_status===200;
const validTime=v=>{const t=Date.parse(v||'');return Number.isFinite(t)?t:NaN;};
export function recallState847(rows=[],now=Date.now()){
  const safe=rows.filter(a=>Number.isFinite(validTime(a.created_at))&&validTime(a.created_at)<=now+5*60e3);
  const closures=safe.filter(a=>a.status==='recall_sla_closed_scoped').sort((a,b)=>validTime(b.created_at)-validTime(a.created_at));
  const last=closures[0],recall=safe.some(a=>a.status==='recall_required');
  if(!last)return {state:recall?'RECALL_OPEN_HOLD':'NO_RECALL',closure:null,conflict:null,reopen:null};
  const laterLive=safe.filter(a=>live847(a)&&validTime(a.created_at)>validTime(last.created_at)).sort((a,b)=>validTime(b.created_at)-validTime(a.created_at))[0];
  const reopened=safe.filter(a=>a.status===REOPEN_STATUS_847&&validTime(a.created_at)>validTime(last.created_at)).sort((a,b)=>validTime(b.created_at)-validTime(a.created_at))[0];
  if(reopened)return {state:'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD',closure:last,conflict:laterLive||null,reopen:reopened};
  if(laterLive)return {state:'CONFLICT_REOPEN_REQUIRED',closure:last,conflict:laterLive,reopen:null};
  return {state:'CLOSED_SCOPED_EXTERNAL_MIRRORS_HOLD',closure:last,conflict:null,reopen:null};
}

const MASTER_FIELDS=['version','kind','source_id','shell_id','source_contract','source_revision','consumer_id','decision','permissions','booking_id','project_id','master_case_reference','nonce','issued_at','expires_at','signer_id'];
const decode=(v,n)=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;try{const x=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);const bytes=Uint8Array.from(atob(x),c=>c.charCodeAt(0));return bytes.length===n?bytes:null;}catch{return null;}};
export function canonicalMaster847(r){
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==MASTER_FIELDS.length||MASTER_FIELDS.some(k=>r[k]===null||r[k]===undefined)||Object.keys(r).some(k=>!MASTER_FIELDS.includes(k)))throw Error('Exact AI Data source-contract attestation fields required.');
  return `ROSIE-847-AIDATA-CONTRACT-V1\n${JSON.stringify(MASTER_FIELDS.map(k=>r[k]))}`;
}
export async function validateMaster847(env,r,signature,{bookingId,projectId,actor,now=Date.now()}={}){
  const pin=decode(env?.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY,32),sig=decode(signature,64);
  if(!pin)return {ok:false,reason:'Independent AI Data public-key pin custody is not enrolled.'};
  if(!sig)return {ok:false,reason:'Valid detached AI Data contract signature is required.'};
  const issued=validTime(r?.issued_at),expires=validTime(r?.expires_at),revision=env?.CF_PAGES_COMMIT_SHA;
  if(r?.version!==1||r.kind!=='source_contract_review'||r.source_id!=='rosiedazzlers'||r.shell_id!=='rosiedazzlers'||r.source_contract!==MASTER_CONTRACT_847||r.consumer_id!=='ai-data-platform'||r.decision!=='source_contract_accepted_counts_only'||r.permissions!=='read_redacted_counts_only_no_event'||r.booking_id!==bookingId||r.project_id!==projectId||r.source_revision!==revision||typeof revision!=='string'||!/^[0-9a-f]{40}$/.test(revision))return {ok:false,reason:'Original Rosie booking, exact deployed revision, contract, and named Master consumer must match.'};
  if(!Number.isFinite(issued)||!Number.isFinite(expires)||issued>now+300000||now-issued>86400000||expires<=now||expires-issued>86400000||expires<=issued)return {ok:false,reason:'Master receipt age or expiry is invalid.'};
  if(typeof r.nonce!=='string'||!/^[A-Za-z0-9_-]{20,100}$/.test(r.nonce)||typeof r.signer_id!=='string'||!/^[A-Za-z0-9_.@-]{5,120}$/.test(r.signer_id)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||typeof r.master_case_reference!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(r.master_case_reference))return {ok:false,reason:'Distinct Master signer, nonce and safe case reference are required.'};
  try{const msg=new TextEncoder().encode(canonicalMaster847(r)),key=await crypto.subtle.importKey('raw',pin,{name:'Ed25519'},false,['verify']);if(!await crypto.subtle.verify('Ed25519',key,sig,msg))return {ok:false,reason:'AI Data contract signature did not verify.'};const digest=await crypto.subtle.digest('SHA-256',msg);return {ok:true,sha256:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join(''),pin:'ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY'};}catch{return {ok:false,reason:'Independent Master verification unavailable.'};}
}
