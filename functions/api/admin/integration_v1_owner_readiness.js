// Build 690: offline owner checklist only. Never contacts the integration gateway.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const REF=/^[A-Z0-9_-]{6,64}$/;
const REV=/^[0-9a-f]{40}$/;
function answer(value,status=200){const r=json(value,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','no-referrer');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const result=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!result.ok)return {ok:false,response:result.response};
  if(result.auth_mode!=='session'||!result.actor?.is_admin||result.actor.role_code!=='admin')
    return {ok:false,response:answer({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true,actor:result.actor};}
export function configurationSnapshot(env){
  return {mode_configured:env.ROSEVEAR_INTEGRATION_V1_MODE==='nonproduction'&&
      !!env.CF_PAGES_BRANCH&&env.CF_PAGES_BRANCH!=='main',
    origin_configured:/^https:\/\/[^/]+$/.test(String(env.ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN||''))&&
      !/^https:\/\/(?:www\.)?rosiedazzlers\.ca$/.test(String(env.ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN||'')),
    key_id_configured:/^[A-Za-z0-9_-]{8,80}$/.test(String(env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID||'')),
    hmac_key_configured:typeof env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64==='string'&&
      /^[A-Za-z0-9+/_-]{43,44}={0,2}$/.test(env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64),
    gateway_audit_verified:false,witness_verified:false,pilot_authorized:false};
}
function boundary(snapshot){return {connection_status:'HOLD',gateway_connected:false,
  pilot_authorized:false,external_calls_made:0,configuration_snapshot:snapshot,
  blockers:['No independently verified gateway audit','No independent witness receipt',
    'No owner-authorized nonproduction pilot; do not connect live businesses'],
  note:'This inventory does not verify secrets, a gateway, receipt origin, key rotation or the four-company tenant isolation.'};}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  try{const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rosevear_integration_v1_owner_readiness_reviews?select=id,evidence_reference,observed_at,created_at,configuration_snapshot,connection_status,pilot_authorized,source_revision&order=created_at.desc&limit=10`,
    {headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
    if(!response.ok)throw Error('Receipt store unavailable');
    return answer({ok:true,build:690,...boundary(configurationSnapshot(env)),
      reviews:await response.json()});
  }catch{return answer({ok:false,error:'Readiness audit store unavailable. Connection remains HOLD.',
    ...boundary(configurationSnapshot(env))},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin owner review refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),time=Date.parse(b.observed_at||'');
  if(!REF.test(String(b.evidence_reference||''))||!Number.isFinite(time)||
    time>Date.now()+30000||time<Date.now()-7*86400000||
    b.confirm_no_live_link!==true||b.confirm_no_gateway_proof!==true||
    b.confirm_no_pilot_approval!==true)
    return answer({ok:false,error:'Current non-personal evidence and three explicit HOLD acknowledgments required.'},400);
  const snapshot=configurationSnapshot(env),revision=REV.test(String(env.CF_PAGES_COMMIT_SHA||''))?
    env.CF_PAGES_COMMIT_SHA:null;
  try{const id=crypto.randomUUID();const fingerprint=await sha256({id,actor:a.actor.id,
    reference:b.evidence_reference,observed_at:new Date(time).toISOString(),revision,snapshot});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_rosevear_integration_v1_owner_readiness`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:id,p_owner_id:a.actor.id,p_source_revision:revision,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:fingerprint,
        p_observed_at:new Date(time).toISOString(),p_snapshot:snapshot})});
    if(!response.ok)return answer({ok:false,error:'Duplicate or invalid HOLD receipt refused; no gateway contacted.',
      ...boundary(snapshot)},409);
    return answer({ok:true,build:690,receipt:await response.json(),...boundary(snapshot)});
  }catch{return answer({ok:false,error:'HOLD receipt not saved; no gateway contacted.',
    ...boundary(snapshot)},503);}
}
