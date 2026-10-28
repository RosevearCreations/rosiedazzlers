// Build 691 — QL-245 truthful unsigned source inventory, NEVER an HMAC or Ed25519 proof.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';
import {configurationSnapshot} from './integration_v1_owner_readiness.js';

const REF=/^[A-Z0-9_-]{6,64}$/;
const REV=/^[0-9a-f]{40}$/;
const PATHS=['/api/integration/v1/health','/api/integration/v1/capabilities'];
const SCOPE=['read_health','read_capabilities'];
const NEGATIVES=['nonce_replay','stale_request','wrong_business','wrong_tenant',
  'revoked_key','prohibited_write','prohibited_dispatch'];
export const QL245_SOURCE_KEYS=['schema_version','source_system','signer_key_id','business_id','tenant_id',
  'environment','source_revision','ci_run_url','key_id','registry_receipt_id','health_receipt_id',
  'capabilities_receipt_id','gateway_audit_id','allowed_paths','scope','negative_tests',
  'source_receipt_id','audit_storage_review','owner_authorization','connection_state',
  'issued_at','expires_at'];
const denied=()=>Object.fromEntries(NEGATIVES.map(x=>[x,false]));
export function ql245UnsignedDraft(env){
  // This is deliberately NOT a valid offline verification packet. Never invent receipts.
  const revision=REV.test(String(env.CF_PAGES_COMMIT_SHA||''))?env.CF_PAGES_COMMIT_SHA:null;
  return {schema_version:'rosevear.integration.v1',source_system:'rosiedazzlers',
    signer_key_id:null,business_id:'rosiedazzlers',tenant_id:null,environment:'nonproduction',
    source_revision:revision,ci_run_url:null,key_id:null,registry_receipt_id:null,
    health_receipt_id:null,capabilities_receipt_id:null,gateway_audit_id:null,
    allowed_paths:[...PATHS],scope:[...SCOPE],negative_tests:denied(),
    source_receipt_id:null,audit_storage_review:'INDEPENDENT_RESTART_PROOF_PENDING',
    owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',
    issued_at:null,expires_at:null};
}
function answer(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor.role_code!=='admin')
    return {ok:false,response:answer({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true,actor:a.actor};}
function boundary(env){const draft=ql245UnsignedDraft(env),snapshot=configurationSnapshot(env);
  return {build:691,connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN',
    witness_state:'UNVERIFIED',signer_state:'NOT_PROVISIONED',readiness_state:'EVIDENCE_PENDING',
    verified_external_requests:0,negative_tests_executed:denied(),
    configured_source_fields:snapshot,source_key_order:QL245_SOURCE_KEYS,
    unsigned_draft_not_for_verifier:draft,
    missing_proof:['independently provisioned source and gateway HMAC test keys',
      'actual nonproduction source revision and green CI URL',
      'source Ed25519 signing key and separately authenticated SPKI pin',
      'independently retrieved signed health, capability and gateway audit receipts',
      'all seven original negative denial trace IDs',
      'six-app assessor pin and original witness proof',
      'separate authenticated owner approval and witnessed rollback'],
    safety_notice:'UNSIGNED DRAFT ONLY: no keys, signatures or receipts fabricated. QL-245 requires real offline verification. No production gateway calls or owner pilot.'};}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  try{const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rosevear_integration_v1_ql245_owner_handoffs?select=id,evidence_reference,observed_at,created_at,source_revision,readiness_state,connection_state,owner_authorization,independent_witness_state,signer_state,negative_denials&order=created_at.desc&limit=10`,
    {headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
    if(!response.ok)throw Error('Handoff inventory unavailable');
    return answer({ok:true,...boundary(env),handoffs:await response.json()});
  }catch{return answer({ok:false,error:'Owner QL-245 inventory unavailable.',...boundary(env)},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin handoff refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),when=Date.parse(b.observed_at||'');
  if(!REF.test(String(b.evidence_reference||''))||!Number.isFinite(when)||
    when>Date.now()+30000||when<Date.now()-7*86400000||
    b.confirm_no_signed_receipts!==true||b.confirm_all_denials_unverified!==true||
    b.confirm_no_owner_pilot!==true)
    return answer({ok:false,error:'Exact source reference and all three QL-245 UNVERIFIED acknowledgments required.'},400);
  const draft=ql245UnsignedDraft(env),negativeTests=denied();
  try{const id=crypto.randomUUID(),hash=await sha256({id,owner:a.actor.id,
    reference:b.evidence_reference,observed_at:new Date(when).toISOString(),
    source_revision:draft.source_revision,negativeTests,connection:'DISCONNECTED'});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_rosevear_integration_v1_ql245_owner_handoff`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:id,p_owner_id:a.actor.id,p_source_revision:draft.source_revision,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:hash,
        p_observed_at:new Date(when).toISOString(),p_negatives:negativeTests})});
    if(!response.ok)return answer({ok:false,error:'Duplicate or unsupported QL-245 handoff; still DISCONNECTED.',
      ...boundary(env)},409);
    return answer({ok:true,...boundary(env),receipt:await response.json()});
  }catch{return answer({ok:false,error:'Unsigned handoff not saved. No external request occurred.',
    ...boundary(env)},503);}
}
