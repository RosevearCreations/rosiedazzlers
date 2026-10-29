// QL-254: owner-only, explicit PUBLIC GitHub immutable raw proof watch.
// Public consistency is never independent custody, seven witnessed denials or owner TEST consent.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {checkQl246ProofShape} from '../_lib/rosevear-integration-ql246.js';

const GH='https://api.github.com/repos/RosevearCreations/rosiedazzlers';
const RAW='https://raw.githubusercontent.com/RosevearCreations/rosiedazzlers/';
const PATH='docs/integration/ql246-source-proof.json';
const SHA=/^[0-9a-f]{40}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/([0-9]+)$/;
const MISS='NOT_AVAILABLE';
function reply(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return a.response;
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor?.role_code!=='admin')
    return reply({ok:false,error:'Signed-in owner required.'},403);
  return null;}
const held=()=>({build:700,ql:'QL-254',read_only:true,
  application_name:'Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',
  observed_main_sha:MISS,source_sha_A:MISS,matching_source_green_ci_run_url:MISS,
  proof_commit_sha_B:MISS,immutable_proof_url:'HTTP 404',
  proof_http_status_at_B:MISS,public_main_proof_http_status:MISS,
  exact_raw_proof_sha256:MISS,public_signer_spki_sha256:MISS,
  private_registry_snapshot_sha256:MISS,independent_registry_custody_receipt_id:MISS,
  separate_witness_receipt_id:MISS,independent_witness_real_world_identity_verified:'NOT_VERIFIED',
  signed_proof_independently_trusted:false,owner_test_decision:'NOT_GIVEN',
  actual_nonproduction_gateway_gets:'NOT_RUN',real_original_seven_denial_cases:'NOT_VERIFIED',
  private_relay_installed:false,connection_state:'DISCONNECTED'});
async function github(url,allowArray=false){
  if(!url.startsWith(GH+'/'))throw Error('Nonallowlisted GitHub URL');
  const r=await fetch(url,{method:'GET',redirect:'error',headers:{
    Accept:'application/vnd.github+json','User-Agent':'RosieDazzlers-QL254-public-proof'},
    signal:AbortSignal.timeout(8500)});
  if(!r.ok||!String(r.headers.get('content-type')||'').toLowerCase().includes('json'))
    throw Error('Public GitHub JSON unavailable');
  const raw=await r.text();if(raw.length<2||raw.length>240000)throw Error('GitHub metadata out of bounds');
  const value=JSON.parse(raw);
  if(allowArray?!Array.isArray(value):(!value||typeof value!=='object'||Array.isArray(value)))
    throw Error('Public GitHub metadata shape invalid');
  return value;
}
async function proofAt(sha){
  if(!SHA.test(sha))throw Error('Immutable proof SHA malformed');
  const url=RAW+sha+'/'+PATH;
  const r=await fetch(url,{method:'GET',redirect:'error',headers:{
    Accept:'application/json','User-Agent':'RosieDazzlers-QL254-public-proof'},
    signal:AbortSignal.timeout(8500)});
  if(r.status===404)return {status:404,url};
  if(!r.ok||Number(r.headers.get('content-length')||0)>16000)
    throw Error('Raw GitHub proof unavailable or oversized');
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<80||bytes.length>16000)throw Error('Raw proof bytes out of bounds');
  const content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const envelope=JSON.parse(content);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    b=>b.toString(16).padStart(2,'0')).join('');
  return {status:200,url,digest,envelope};
}
function matchingRun(run,sha){return run?.head_sha===sha&&run.status==='completed'&&
  run.conclusion==='success'&&run.repository?.full_name==='RosevearCreations/rosiedazzlers'&&
  CI.test(String(run.html_url||''));}
async function checkMainSourceCi(sha){
  const runs=await github(`${GH}/actions/runs?head_sha=${sha}&per_page=20`);
  if(!Array.isArray(runs.workflow_runs)||runs.workflow_runs.length>20)
    throw Error('Source CI list invalid');
  const match=runs.workflow_runs.find(r=>matchingRun(r,sha)&&
    r.name==='Current Source Gate'&&r.head_branch==='main'&&r.event==='push');
  return match?.html_url||MISS;
}
export async function recheckQl254OriginalPublicProof(){
  const base=held();
  try{
    const ref=await github(`${GH}/git/ref/heads/main`);
    const main=ref?.object?.sha;
    if(ref.ref!=='refs/heads/main'||!SHA.test(String(main||'')))throw Error('Main SHA unavailable');
    const mainProof=await proofAt(main);
    if(mainProof.status===404){
      const ci=await checkMainSourceCi(main);
      const again=await github(`${GH}/git/ref/heads/main`);
      if(again?.object?.sha!==main)throw Error('Main SHA moved during recheck');
      return {...base,observed_main_sha:main,source_sha_A:ci===MISS?MISS:main,
        matching_source_green_ci_run_url:ci,public_main_proof_http_status:404,
        proof_publication:'HTTP_404_AT_IMMUTABLE_MAIN',
        reason:'No original signed source proof at this immutable GitHub main SHA. No B or independent custody evidence can be claimed.'};
    }
    // A public JSON file is an UNTRUSTED candidate until all independent gates are proven.
    const p=mainProof.envelope?.payload;
    const source=p?.source_revision,runUrl=p?.ci_run_url;
    const shape=checkQl246ProofShape(mainProof.envelope);
    const match=String(runUrl||'').match(CI);
    if(!shape.ok||!SHA.test(String(source||''))||!match)
      return {...base,observed_main_sha:main,public_main_proof_http_status:200,
        proof_publication:'PUBLIC_JSON_CANDIDATE_INVALID_OR_EXPIRED_HELD',
        reason:'Raw public JSON exists but valid original payload, challenge and expiry are not established.'};
    const commits=await github(`${GH}/commits?path=${PATH}&sha=${main}&per_page=1`,true);
    const B=commits[0]?.sha;
    if(!SHA.test(String(B||''))||B===source)throw Error('No distinct proof commit B');
    const commit=await github(`${GH}/git/commits/${B}`);
    if(commit.sha!==B||commit.parents?.length!==1||commit.parents[0]?.sha!==source)
      throw Error('Source A is not direct parent of proof B');
    const compare=await github(`${GH}/compare/${source}...${B}`);
    if(compare.base_commit?.sha!==source||compare.head_commit?.sha!==B||
      compare.merge_base_commit?.sha!==source||compare.status!=='ahead'||
      compare.ahead_by!==1||compare.behind_by!==0||compare.total_commits!==1||
      compare.files?.length!==1||compare.files[0]?.filename!==PATH||
      compare.files[0]?.status!=='added')throw Error('Proof-only A-to-B ancestry invalid');
    const bProof=await proofAt(B);
    if(bProof.status!==200||bProof.digest!==mainProof.digest)
      throw Error('Immutable B proof bytes differ from main');
    const run=await github(`${GH}/actions/runs/${match[1]}`);
    if(!matchingRun(run,source)||run.html_url!==runUrl)
      throw Error('Source A CI does not match signed source');
    const again=await github(`${GH}/git/ref/heads/main`);
    if(again?.object?.sha!==main)throw Error('Main SHA moved during candidate check');
    return {...base,observed_main_sha:main,source_sha_A:source,
      matching_source_green_ci_run_url:runUrl,proof_commit_sha_B:B,
      immutable_proof_url:bProof.url,proof_http_status_at_B:200,
      public_main_proof_http_status:200,exact_raw_proof_sha256:bProof.digest,
      public_signer_spki_sha256:'UNTRUSTED',
      proof_publication:'PUBLIC_PROOF_ONLY_ANCESTRY_AND_RAW_BYTES_MATCH_UNTRUSTED',
      reason:'Public SHA, A→B ancestry, exact raw bytes and source A CI match only. Signature pin, real custody, independent witness and owner TEST decision remain NOT_VERIFIED.'};
  }catch{return {...base,immutable_proof_url:MISS,
    proof_publication:'UNAVAILABLE_OR_CONFLICT_FAIL_CLOSED',
    reason:'Public origin, immutable raw proof, ancestry or CI unavailable/inconsistent. Manual HOLD continues.'};}
}
export async function onRequestGet({request,env}){
  const denied=await owner(request,env);if(denied)return denied;
  return reply({ok:true,...held(),proof_publication:'NOT_CHECKED',
    reason:'Readiness only. Explicit public GitHub GET recheck must be requested by signed owner.'});
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin proof recheck rejected.'},403);
  const denied=await owner(request,env);if(denied)return denied;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'JSON action required.'},415);
  const raw=await request.text().catch(()=>'');if(raw.length>95)return reply({ok:false,error:'Bounded public recheck action required.'},413);
  let action;try{action=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid action.'},400);}
  if(!action||typeof action!=='object'||Array.isArray(action)||
    Object.keys(action).join(',')!=='action'||action.action!=='recheck_immutable_public_proof')
    return reply({ok:false,error:'Only immutable public GitHub proof recheck allowed.'},400);
  return reply({ok:true,...await recheckQl254OriginalPublicProof()});
}
