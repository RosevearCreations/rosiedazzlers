// B692 QL-245/246 receipt reference inventory: never verifies a signer, pin, gateway or pilot.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';
import {pendingQl246SourceProof,QL246_KEYS,QL246_DENIAL_KEYS}
  from '../_lib/rosevear-integration-ql246.js';

const REF=/^[A-Z0-9_-]{6,64}$/;
const SOURCE=/^np-[A-Za-z0-9_-]{6,120}$/;
const REV=/^[0-9a-f]{40}$/;
const KINDS=['health','capabilities','gateway_audit','registered_key','source_challenge','source_proof','independent_pin'];
function answer(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor.role_code!=='admin')
    return {ok:false,response:answer({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true,actor:a.actor};}
function boundary(env){return {build:692,review_state:'UNVERIFIED_ORIGINAL',
  connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN',
  receipt_kinds:KINDS,ql246_signed_payload_order:QL246_KEYS,
  ql246_denial_order:QL246_DENIAL_KEYS,
  ql246_pending_template_not_a_proof:pendingQl246SourceProof(env.CF_PAGES_COMMIT_SHA),
  ql246_gate:'PENDING: authentic operator challenge, distinct signing key, out-of-band SPKI pin, immutable commit, real source and gateway receipts, seven observed denials, separately witnessed verification.',
  scope:'No source signature, challenge nonce, secret, private key, customer data or real gateway request is saved or generated. Public signed metadata file must not be published until independently verified.'};}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  try{const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rosevear_integration_v1_original_receipt_intake?select=id,evidence_reference,receipt_kind,original_receipt_reference,source_revision,observed_at,review_state,connection_state,owner_authorization,created_at&order=created_at.desc&limit=20`,{
      headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
    if(!r.ok)throw Error('Original-receipt list unavailable');
    return answer({ok:true,...boundary(env),intakes:await r.json()});
  }catch{return answer({ok:false,error:'Source references unavailable; still disconnected.',...boundary(env)},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin original receipt intake refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  const b=await request.json().catch(()=>({})),when=Date.parse(b.observed_at||'');
  if(!REF.test(String(b.evidence_reference||''))||!KINDS.includes(b.receipt_kind)||
    !SOURCE.test(String(b.original_receipt_reference||''))||
    (b.source_revision!==null&&b.source_revision!==undefined&&!REV.test(String(b.source_revision)))||
    !Number.isFinite(when)||when>Date.now()+30000||when<Date.now()-7*86400000||
    b.confirm_independent_verification_pending!==true||b.confirm_no_owner_authorization!==true||
    b.confirm_no_gateway_contact!==true)
    return answer({ok:false,error:'Nonsecret np- receipt reference and three UNVERIFIED safeguards required.'},400);
  try{const id=crypto.randomUUID(),sourceRevision=b.source_revision||null,
      hash=await sha256({id,owner:a.actor.id,source:'rosiedazzlers',kind:b.receipt_kind,
        original:b.original_receipt_reference,reference:b.evidence_reference,
        source_revision:sourceRevision,observed_at:new Date(when).toISOString(),
        status:'UNVERIFIED_ORIGINAL'});
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_rosevear_integration_v1_original_receipt_intake`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:id,p_owner_id:a.actor.id,p_evidence_reference:b.evidence_reference,
        p_receipt_kind:b.receipt_kind,p_original_receipt_reference:b.original_receipt_reference,
        p_source_revision:sourceRevision,p_evidence_sha256:hash,
        p_observed_at:new Date(when).toISOString()})});
    if(!r.ok)return answer({ok:false,error:'Original reference duplicate or refused; never treated as signed proof.',...boundary(env)},409);
    return answer({ok:true,...boundary(env),receipt:await r.json()});
  }catch{return answer({ok:false,error:'Unverified reference not saved; no gateway called.',...boundary(env)},503);}
}
