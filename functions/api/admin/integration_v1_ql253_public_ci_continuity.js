// Build 699 QL-253: fixed-host public GitHub GETs only. No owner TEST authorization.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {recheckQl252PublicProof} from './integration_v1_ql250_custody_reconciliation.js';

const GH='https://api.github.com/repos/RosevearCreations/rosiedazzlers';
const SHA=/^[0-9a-f]{40}$/;
const MISS='NOT_AVAILABLE';
function reply(body,status=200){const result=json(body,status),headers=new Headers(result.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(result.body,{status:result.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return a.response;
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor?.role_code!=='admin')
    return reply({ok:false,error:'Signed owner session required.'},403);
  return null;}
const boundary=()=>({build:699,ql:'QL-253',read_only:true,
  independent_signer_custody_verified:false,distinct_registry_witness_verified:false,
  registry_snapshot_sha256:MISS,registry_receipt_id:MISS,custody_receipt_id:MISS,
  distinct_witness_receipt_id:MISS,owner_test_decision:'NOT_GIVEN',
  owner_test_receipt_id:MISS,original_seven_denial_receipts:'NOT_VERIFIED',
  real_health_and_capabilities_get_receipts:'NOT_RUN',proof_commit_sha_B:MISS,
  source_proof_is_independently_trusted:false,connection_state:'DISCONNECTED'});
async function github(url){
  if(!url.startsWith(GH+'/'))throw Error('Public GitHub allowlist');
  const response=await fetch(url,{method:'GET',redirect:'error',
    headers:{Accept:'application/vnd.github+json','User-Agent':'RosieDazzlers-QL253-public-only'},
    signal:AbortSignal.timeout(8500)});
  if(!response.ok||!String(response.headers.get('content-type')||'').includes('json'))
    throw Error('GitHub metadata unavailable');
  const raw=await response.text();if(raw.length<2||raw.length>180000)
    throw Error('GitHub metadata size invalid');
  const result=JSON.parse(raw);if(!result||typeof result!=='object'||Array.isArray(result))
    throw Error('GitHub metadata shape invalid');return result;
}
export async function recheckQl253PublicCi(){
  const safe=boundary();
  try{
    const ref=await github(`${GH}/git/ref/heads/main`);
    const main=ref?.object?.sha;
    if(ref.ref!=='refs/heads/main'||!SHA.test(String(main||'')))throw Error('Main ref invalid');
    // `head_sha` is supplied by GitHub, not a locally claimed source revision.
    const runs=await github(`${GH}/actions/runs?head_sha=${main}&per_page=20`);
    if(!Array.isArray(runs.workflow_runs)||runs.workflow_runs.length>20)
      throw Error('CI list shape invalid');
    const matching=runs.workflow_runs.find(r=>r?.name==='Current Source Gate'&&
      r.head_sha===main&&r.head_branch==='main'&&r.event==='push'&&
      r.status==='completed'&&r.conclusion==='success'&&
      r.repository?.full_name==='RosevearCreations/rosiedazzlers'&&
      /^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/.test(r.html_url));
    const proof=await recheckQl252PublicProof();
    if(proof.checked_main_sha!==main)return {...safe,checked_main_sha:main,
      public_source_ci:'DRIFT_OR_UNAVAILABLE',public_proof_http_status:MISS,
      public_proof_state:'UNAVAILABLE_FAIL_CLOSED',source_sha_A:MISS,source_ci_run_url:MISS,
      reason:'Main changed while public evidence was fetched; retry from a fixed SHA.'};
    return {...safe,checked_main_sha:main,
      public_source_ci:matching?'EXACT_HEAD_GREEN_PUBLIC_METADATA_ONLY':'NOT_AVAILABLE',
      source_sha_A:matching?main:MISS,
      source_ci_run_url:matching?matching.html_url:MISS,
      public_proof_http_status:proof.public_proof_http_status,
      public_proof_state:proof.proof_publication,
      immutable_public_proof_url:proof.public_proof_http_status===404?'HTTP 404':MISS,
      source_ci_claim_is_independently_attested:false,
      reason:'Original signed B, A-to-B ancestry, independent pin registry, distinct witness and authenticated owner TEST decision still require separate evidence. Public CI does not establish signer custody.'};
  }catch{return {...safe,checked_main_sha:MISS,public_source_ci:'NOT_AVAILABLE',
    source_sha_A:MISS,source_ci_run_url:MISS,public_proof_http_status:MISS,
    public_proof_state:'UNAVAILABLE_FAIL_CLOSED',
    reason:'Public GitHub source/CI recheck unavailable; HOLD remains.'};}
}
export async function onRequestGet({request,env}){
  const denied=await owner(request,env);if(denied)return denied;
  return reply({ok:true,...boundary(),public_source_ci:'NOT_CHECKED',
    public_proof_state:'NOT_CHECKED',
    reason:'Explicit owner-side public metadata recheck required. No gateway connection.'});
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin public check refused.'},403);
  const denied=await owner(request,env);if(denied)return denied;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'JSON action required.'},415);
  const raw=await request.text().catch(()=>'');if(raw.length>90)return reply({ok:false,error:'Bounded action required.'},413);
  let action;try{action=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid action.'},400);}
  if(!action||Array.isArray(action)||Object.keys(action).join(',')!=='action'||
    action.action!=='recheck_public_main_ci_proof')
    return reply({ok:false,error:'Public GitHub-only recheck action required.'},400);
  return reply({ok:true,...await recheckQl253PublicCi()});
}
