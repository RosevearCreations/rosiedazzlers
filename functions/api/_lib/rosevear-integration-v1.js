// QL-243: Rosie source-side NONPRODUCTION health/capabilities only.
// No gateway credentials or live cross-business link are installed by this code.
import {serviceHeaders} from './staff-auth.js';

const CONTRACT='rosevear.integration.v1';
const EMPTY_BODY='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const PATHS=['/api/integration/v1/health','/api/integration/v1/capabilities'];
const NONCE=/^np-[a-f0-9]{32}$/;
const KEY_ID=/^[A-Za-z0-9_-]{8,80}$/;
const te=new TextEncoder();
function result(body,status=200){return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private',
  'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',
  'Access-Control-Allow-Origin':'none'}});}
function error(reason='nonproduction connection test not authorized',status=403){
  return result({ok:false,schema_version:CONTRACT,connection_status:'HOLD',error:reason},status);}
function b64u(bytes){let s='';for(const c of bytes)s+=String.fromCharCode(c);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}
function decoded64(s){if(!/^[A-Za-z0-9_-]{43}$/.test(String(s||'')))return null;
  try{const v=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'=');
    if(v.length!==32)return null;return Uint8Array.from(v,c=>c.charCodeAt(0));}catch{return null;}}
function constantCompare(a,b){if(!a||!b||a.length!==32||b.length!==32)return false;
  let difference=0;for(let i=0;i<32;i++)difference|=a[i]^b[i];return difference===0;}
async function hexDigest(value){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(value)));
  return [...digest].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function canonicalV1Request({path,timestamp,nonce,keyId}){
  return [CONTRACT,'GET',path,timestamp,nonce,'ai-data-platform','rosiedazzlers',
    'rosiedazzlers','-','nonproduction',EMPTY_BODY,keyId].join('\n');
}
export function nonproductionEnabled(env,request){
  const u=new URL(request.url);
  return env.ROSEVEAR_INTEGRATION_V1_MODE==='nonproduction'&&
    !!env.CF_PAGES_BRANCH&&env.CF_PAGES_BRANCH!=='main'&&
    u.protocol==='https:'&&
    env.ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN===u.origin&&
    u.hostname!=='rosiedazzlers.ca'&&u.hostname!=='www.rosiedazzlers.ca';
}
function reasonFor(request){const u=new URL(request.url);const h=request.headers;
  if(!PATHS.includes(u.pathname))return 'wrong_path';
  if(request.method!=='GET'||(h.get('content-length')&&h.get('content-length')!=='0'))return 'wrong_method';
  if(u.search||u.hash)return 'query_denied';
  if(h.get('X-Rosevear-Contract')!==CONTRACT||
    h.get('X-Rosevear-Environment')!=='nonproduction'||
    h.get('X-Rosevear-Source')!=='ai-data-platform'||
    h.get('X-Rosevear-Destination')!=='rosiedazzlers'||
    h.get('X-Rosevear-Business')!=='rosiedazzlers'||
    h.get('X-Rosevear-Tenant')!=='-')return 'invalid_identity';
  const keyId=h.get('X-Rosevear-Key-Id'),nonce=h.get('X-Rosevear-Nonce');
  if(!KEY_ID.test(String(keyId||''))||!NONCE.test(String(nonce||'')))return 'invalid_identity';
  const ts=h.get('X-Rosevear-Timestamp');
  if(!/^\d{13}$/.test(String(ts||''))||Math.abs(Date.now()-Number(ts))>300000)return 'stale';
  return 'ok';
}
async function audit(env,request,reason,keyId,nonceHash,claimNonce){
  // Audit decisions are never exposed without an actual, atomic Supabase receipt.
  const url=`${env.SUPABASE_URL}/rest/v1/rpc/record_rosevear_integration_v1_probe`;
  const r=await fetch(url,{method:'POST',headers:serviceHeaders(env),redirect:'error',
    signal:AbortSignal.timeout(4500),body:JSON.stringify({p_id:crypto.randomUUID(),
      p_path:new URL(request.url).pathname,p_method:request.method==='GET'?'GET':'OTHER',
      p_reason:reason,p_key_id:keyId,p_nonce_sha256:nonceHash,p_claim_nonce:claimNonce})});
  if(!r.ok)throw Error('Nonproduction replay audit unavailable');return r.json();
}
export async function onRequest({request,env}){
  if(!nonproductionEnabled(env,request))return error('nonproduction integration disabled; owner pilot HOLD',503);
  const keyId=request.headers.get('X-Rosevear-Key-Id')||'';
  const nonce=request.headers.get('X-Rosevear-Nonce')||'';
  const configuredId=env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID;
  const rawSecret=env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64;
  const secret=typeof rawSecret==='string'?decoded64(rawSecret.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')):null;
  if(!KEY_ID.test(String(configuredId||''))||!secret||!env.SUPABASE_URL||
     !env.SUPABASE_SERVICE_ROLE_KEY)return error('nonproduction credential or audit store missing; HOLD',503);
  let reason=reasonFor(request),nonceHash=null;
  try{
    if(NONCE.test(nonce))nonceHash=await hexDigest(nonce);
    if(reason==='ok'&&(keyId!==configuredId||
      String(env.ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS||'').split(',').includes(keyId)))reason='invalid_identity';
    if(reason==='ok'){
      const canon=canonicalV1Request({path:new URL(request.url).pathname,
        timestamp:request.headers.get('X-Rosevear-Timestamp'),nonce,keyId});
      const hmac=await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const expected=new Uint8Array(await crypto.subtle.sign('HMAC',hmac,te.encode(canon)));
      const supplied=decoded64(request.headers.get('X-Rosevear-Signature'));
      if(!constantCompare(expected,supplied))reason='bad_signature';
    }
    const receipt=await audit(env,request,reason,keyId,nonceHash,reason==='ok');
    if(reason!=='ok'||receipt?.decision!=='accepted')return error(
      receipt?.decision==='replay_denied'?'Replay denied; connection remains HOLD':
        'Authentication or scope denied; connection remains HOLD',403);
    const path=new URL(request.url).pathname;
    const payload={ok:true,schema_version:CONTRACT,source_system:'rosiedazzlers',
      business_id:'rosiedazzlers',tenant_id:null,environment:'nonproduction',
      connection_status:'HOLD',owner_pilot_authorized:false,gateway_connected:false,
      source_revision:/^[0-9a-f]{40}$/.test(String(env.CF_PAGES_COMMIT_SHA||''))?
        env.CF_PAGES_COMMIT_SHA:null,
      source_audit_receipt_id:receipt.receipt_id,
      ...(path.endsWith('/health')?{service_status:'held_read_only_probe',contract_version:1}:
        {allowed_operations:[],planned_read_only_references:['read_quote_reference','read_booking_reference'],
          prohibited_operations:['write_booking','payment','gift_resend','send_sms','dispatch','customer_data']})};
    return result(payload);
  }catch{return error('Durable nonproduction audit unavailable; HOLD',503);}
}
