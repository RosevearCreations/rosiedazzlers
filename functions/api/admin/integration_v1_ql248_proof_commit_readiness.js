// Build 694: owner-only, offline, public-metadata-only two-SHA transport readiness.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {verifyQl248RosieTransport,pendingQl248Transport} from '../_lib/rosevear-integration-ql248.js';

function reply(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor.role_code!=='admin')
    return {ok:false,response:reply({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true};}
function expectations(env){return {
  sourceRevisionSha:env.ROSEVEAR_QL246_EXPECTED_SOURCE_SHA,
  proofCommitSha:env.ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA,
  proofSha256:env.ROSEVEAR_QL248_EXPECTED_PROOF_SHA256,
  publicKeySpkiSha256:env.ROSEVEAR_QL246_TRUSTED_SPKI_SHA256,
  ciRunUrl:env.ROSEVEAR_QL246_EXPECTED_CI_RUN_URL,
  challengeId:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID,
  challengeSha256:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256,
  tenantId:null};}
function boundary(env){const e=expectations(env);
  return {build:694,source_revision_configured:/^[0-9a-f]{40}$/.test(String(e.sourceRevisionSha||'')),
    proof_commit_configured:/^[0-9a-f]{40}$/.test(String(e.proofCommitSha||'')),
    raw_proof_digest_configured:/^[0-9a-f]{64}$/.test(String(e.proofSha256||'')),
    independent_public_pin_configured:/^[0-9a-f]{64}$/.test(String(e.publicKeySpkiSha256||'')),
    source_ci_configured:!!e.ciRunUrl,operator_challenge_configured:!!e.challengeId&&!!e.challengeSha256,
    consumer_agreement:'PENDING',github_origin_attested:false,original_denials_verified:false,
    original_gateway_receipts_verified:false,read_only_pilot_authorized:false,
    connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN',
    ql248_pending_template_not_a_proof:pendingQl248Transport(e.sourceRevisionSha),
    message:'QL-248 is a proposed two-SHA clarification, not consumer agreement, original source evidence or permission to connect.'};}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  return reply({ok:true,...boundary(env)});}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin proof-commit request refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Public JSON bundle row required.'},415);
  const raw=await request.text().catch(()=>'');
  if(raw.length<80||raw.length>26000)return reply({ok:false,error:'Public bundle row size invalid.'},413);
  let source;try{source=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid public bundle JSON.'},400);}
  const result=await verifyQl248RosieTransport(source,expectations(env));
  return reply({ok:true,...boundary(env),public_metadata_check:result.ok?'CRYPTOGRAPHIC_MATCH_ONLY':'BLOCKED',
    signature_and_raw_digest_match:result.ok,reason:result.reason,
    message:'QL-248 consumer agreement, immutable GitHub origin and seven actual nonproduction denial receipts remain unverified. No pilot or live connection.'});
}
