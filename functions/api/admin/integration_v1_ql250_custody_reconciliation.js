// Build 697 / QL-250-252: independent public availability recheck, NOT signer custody.
// Only three fixed-host public GitHub GETs; never a gateway GET or credentialed request.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';

const GH='https://api.github.com/repos/RosevearCreations/rosiedazzlers';
const PATH='docs/integration/ql246-source-proof.json';
const SHA=/^[0-9a-f]{40}$/;
const RUN=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/([0-9]{1,20})$/;
const MISS='NOT_AVAILABLE';
function reply(body,status=200){const response=json(body,status),headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});}
async function owner(request,env){const result=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!result.ok)return result.response;
  if(result.auth_mode!=='session'||!result.actor?.is_admin||result.actor?.role_code!=='admin')
    return reply({ok:false,error:'Signed owner session required.'},403);
  return null;}
const missingEvidence=()=>({application_name:'Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',
  source_sha_A:MISS,source_ci_run_url:MISS,proof_commit_sha_B:MISS,
  immutable_public_proof_url:MISS,exact_proof_bytes_sha256:MISS,public_spki_sha256:MISS,
  out_of_band_custody_receipt_id:MISS,distinct_witness_receipt_id:MISS,
  owner_test_decision:'NOT_GIVEN',owner_test_receipt_id:MISS,
  actual_gateway_test:'NOT_RUN',connection_state:'DISCONNECTED'});
function boundary(){return {build:697,ql:'QL-250/QL-252',read_only:true,
  source_proof_state:'NOT_CHECKED',independent_custody_attested:false,
  distinct_ql251_witness_attested:false,fresh_ql250_nonce_witnessed:false,
  authenticated_owner_test_approval:false,owner_test_decision:'NOT_GIVEN',
  actual_gateway_test:'NOT_RUN',connection_state:'DISCONNECTED',
  operator_return:missingEvidence(),
  next_required:'Independently provision the genuine Ed25519 signer and original custody/witness receipts outside GitHub. Publish proof from a source-CI-green A as separate proof commit B. Authenticate owner TEST-only decision separately.'};}
async function publicJson(url){
  if(!url.startsWith(GH+'/'))throw Error('Unexpected public host');
  const response=await fetch(url,{method:'GET',headers:{Accept:'application/vnd.github+json',
    'User-Agent':'RosieDazzlers-QL252-public-recheck'},redirect:'error',signal:AbortSignal.timeout(8500)});
  if(response.status===404)return {notFound:true};
  if(!response.ok||!String(response.headers.get('content-type')||'').toLowerCase().includes('json'))
    throw Error('GitHub response unavailable');
  const raw=await response.text();if(raw.length<2||raw.length>40000)throw Error('Public response too large');
  const json=JSON.parse(raw);if(!json||typeof json!=='object'||Array.isArray(json))
    throw Error('Malformed public response');return json;
}
function parsePublicProof(file){
  if(file.path!==PATH||file.type!=='file'||file.encoding!=='base64'||
    !Number.isSafeInteger(file.size)||file.size<1||file.size>16000||
    typeof file.content!=='string')throw Error('Unexpected public proof content');
  const encoded=file.content.replace(/\s/g,'');
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))
    throw Error('Unexpected base64 content');
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  if(bytes.length!==file.size)throw Error('Proof byte count mismatch');
  const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    typeof envelope.payload!=='object'||!envelope.payload||Array.isArray(envelope.payload))
    throw Error('Invalid proof envelope');
  return {bytes,payload:envelope.payload};
}
const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
  b=>b.toString(16).padStart(2,'0')).join('');

export async function recheckQl252PublicProof(){
  const evidence=missingEvidence();
  try{
    const main=await publicJson(`${GH}/git/ref/heads/main`);
    const sha=main?.object?.sha;
    if(!SHA.test(String(sha||''))||main.ref!=='refs/heads/main')throw Error('Unverifiable main ref');
    const file=await publicJson(`${GH}/contents/${PATH}?ref=${sha}`);
    if(file.notFound)return {public_proof_http_status:404,proof_publication:'HTTP_404_NOT_PUBLISHED',
      checked_main_sha:sha,source_ci_head_match:false,operator_return:evidence,
      verification_scope:'PUBLIC_GITHUB_ONLY',connection_state:'DISCONNECTED',owner_test_decision:'NOT_GIVEN'};
    const {bytes,payload}=parsePublicProof(file);
    const digest=await sha256(bytes);
    const runMatch=String(payload.ci_run_url||'').match(RUN);
    const sourceSha=payload.source_revision;
    // A public GitHub CI match is NOT independent source origin or signer custody.
    let publicCiMatch=false;
    if(SHA.test(String(sourceSha||''))&&runMatch){
      const run=await publicJson(`${GH}/actions/runs/${runMatch[1]}`);
      publicCiMatch=!run.notFound&&run.head_sha===sourceSha&&run.conclusion==='success'&&
        run.repository?.full_name==='RosevearCreations/rosiedazzlers';
    }
    const observed={...evidence,
      source_sha_A:SHA.test(String(sourceSha||''))?sourceSha:MISS,
      source_ci_run_url:runMatch?payload.ci_run_url:MISS,
      // Main may NOT be original proof-adding B. Never infer ancestry from path existence.
      proof_commit_sha_B:MISS,exact_proof_bytes_sha256:digest};
    return {public_proof_http_status:200,proof_publication:'HTTP_200_UNTRUSTED_CANDIDATE',
      checked_main_sha:sha,source_ci_head_match:publicCiMatch,
      operator_return:observed,verification_scope:'PUBLIC_GITHUB_ONLY',
      independent_signer_origin_attested:false,distinct_witness_signature_verified:false,
      connection_state:'DISCONNECTED',owner_test_decision:'NOT_GIVEN'};
  }catch{return {public_proof_http_status:MISS,proof_publication:'UNAVAILABLE_FAIL_CLOSED',
    checked_main_sha:MISS,source_ci_head_match:false,operator_return:evidence,
    verification_scope:'PUBLIC_GITHUB_ONLY',connection_state:'DISCONNECTED',owner_test_decision:'NOT_GIVEN'};}
}
export async function onRequestGet({request,env}){
  const blocked=await owner(request,env);if(blocked)return blocked;
  return reply({ok:true,...boundary()});
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin public evidence check rejected.'},403);
  const blocked=await owner(request,env);if(blocked)return blocked;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'JSON action required.'},415);
  const raw=await request.text().catch(()=>'');if(raw.length>96)return reply({ok:false,error:'Request too large.'},413);
  let row;try{row=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid JSON action.'},400);}
  if(!row||Array.isArray(row)||typeof row!=='object'||Object.keys(row).join(',')!=='action'||
    row.action!=='public_proof_recheck')return reply({ok:false,error:'Only public proof recheck is allowed.'},400);
  return reply({ok:true,...boundary(),...await recheckQl252PublicProof()});
}
