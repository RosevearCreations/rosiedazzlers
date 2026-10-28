// Build 693: owner-only, no-storage, no-gateway verification of public QL-246 metadata.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {verifyQl246PinnedSignature} from '../_lib/rosevear-integration-ql246.js';

function reply(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor.role_code!=='admin')
    return {ok:false,response:reply({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true,actor:a.actor};}
function expectations(env){return {pinnedSpkiSha256:env.ROSEVEAR_QL246_TRUSTED_SPKI_SHA256,
  expectedRevision:env.ROSEVEAR_QL246_EXPECTED_SOURCE_SHA,
  expectedCiRunUrl:env.ROSEVEAR_QL246_EXPECTED_CI_RUN_URL,
  expectedChallengeId:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID,
  expectedChallengeSha256:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256,
  expectedTenantId:null};}
function status(env){const e=expectations(env);
  return {build:693,trust_pin_configured:/^[0-9a-f]{64}$/.test(String(e.pinnedSpkiSha256||'')),
    immutable_source_configured:/^[a-f0-9]{40}$/.test(String(e.expectedRevision||'')),
    ci_reference_configured:!!e.expectedCiRunUrl,
    operator_challenge_configured:!!e.expectedChallengeId&&!!e.expectedChallengeSha256,
    cryptographic_verification:'NOT_RUN',original_evidence_verified:false,
    seven_original_denials_verified:false,connection_state:'DISCONNECTED',
    owner_authorization:'NOT_GIVEN',pilot_authorized:false,
    message:'This checker accepts public metadata only. Configuration must be independently authenticated; no gateway, issuance, dispatch, customer or payment access.'};}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  return reply({ok:true,...status(env)});
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin signature verification refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Public JSON envelope required.'},415);
  const raw=await request.text().catch(()=>'');
  if(raw.length>12000||raw.length<50)return reply({ok:false,error:'Public envelope size invalid.'},413);
  let envelope;try{envelope=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid public JSON.'},400);}
  const result=await verifyQl246PinnedSignature(envelope,expectations(env));
  return reply({ok:true,...status(env),cryptographic_verification:result.ok?'PINNED_SIGNATURE_VALID':'BLOCKED',
    signature_check:result.ok,reason:result.reason,
    message:'Signature result is NOT original-source verification, connection approval or a pilot.'});
}
