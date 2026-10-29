// Build 696: signed-owner, allowlisted public GitHub GET proof-origin comparison.
// No secrets sent, no gateway, no mutation, no independent attestation claim.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {QL249_PROOF_PATH,ql249IndependentExpectationsReady,
  verifyQl249PublicGitHubResponses} from '../_lib/rosevear-integration-ql249-github.js';

const SHA=/^[0-9a-f]{40}$/;
const GH='https://api.github.com/repos/RosevearCreations/rosiedazzlers';
function reply(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function owner(request,env){const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return {ok:false,response:a.response};
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor?.role_code!=='admin')
    return {ok:false,response:reply({ok:false,error:'Signed-in owner required.'},403)};
  return {ok:true};}
function expected(env){return {sourceRevisionSha:env.ROSEVEAR_QL246_EXPECTED_SOURCE_SHA,
  proofCommitSha:env.ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA,
  proofSha256:env.ROSEVEAR_QL248_EXPECTED_PROOF_SHA256,
  publicKeySpkiSha256:env.ROSEVEAR_QL246_TRUSTED_SPKI_SHA256,
  ciRunUrl:env.ROSEVEAR_QL246_EXPECTED_CI_RUN_URL,
  challengeId:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID,
  challengeSha256:env.ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256,tenantId:null};}
function boundary(e){return {build:696,independent_public_pins_configured:ql249IndependentExpectationsReady(e),
  consumer_agreement:'PENDING',independent_origin_attestation:'PENDING',
  original_genuine_gateway_denials:'PENDING',original_receipts_and_durable_audit:'PENDING',
  read_only_pilot_authorized:false,owner_authorization:'NOT_GIVEN',
  connection_state:'DISCONNECTED',read_only:true,
  message:'Only public GitHub metadata GET when all separately authenticated pins exist; no original proof or consumer agreement is claimed.'};}
async function publicGitHubJson(url){
  if(!url.startsWith(GH+'/'))throw Error('GitHub host/path not allowlisted');
  const r=await fetch(url,{method:'GET',headers:{Accept:'application/vnd.github+json',
    'User-Agent':'RosieDazzlers-QL249-public-proof-readonly'},redirect:'error',
    signal:AbortSignal.timeout(8500)});
  if(!r.ok||!String(r.headers.get('content-type')||'').toLowerCase().includes('json'))
    throw Error('Public GitHub source unavailable');
  const s=await r.text();if(s.length>225000||s.length<2)throw Error('Public GitHub response exceeded safety boundary');
  const result=JSON.parse(s);if(!result||typeof result!=='object'||Array.isArray(result))
    throw Error('Public GitHub response malformed');return result;
}
export async function onRequestGet({request,env}){
  const a=await owner(request,env);if(!a.ok)return a.response;
  return reply({ok:true,...boundary(expected(env))});}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return reply({ok:false,error:'Cross-origin GitHub origin request refused.'},403);
  const a=await owner(request,env);if(!a.ok)return a.response;
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Public source/proof SHA JSON only.'},415);
  const raw=await request.text().catch(()=>'');
  if(raw.length<80||raw.length>500)return reply({ok:false,error:'Bounded public source/proof SHA row required.'},413);
  let row;try{row=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid public SHA JSON.'},400);}
  if(!row||typeof row!=='object'||Array.isArray(row)||
    Object.keys(row).sort().join(',')!=='proofCommitSha,sourceRevisionSha'||
    !SHA.test(String(row.sourceRevisionSha||''))||!SHA.test(String(row.proofCommitSha||''))||
    row.sourceRevisionSha===row.proofCommitSha)
    return reply({ok:false,error:'Exactly two distinct public commit SHAs required.'},400);
  const e=expected(env);
  if(!ql249IndependentExpectationsReady(e)||e.sourceRevisionSha!==row.sourceRevisionSha||
    e.proofCommitSha!==row.proofCommitSha)
    return reply({ok:true,...boundary(e),public_github_check:'BLOCKED',
      reason:'Separately authenticated exact source/proof pins, digest, SPKI, CI and challenge not configured or mismatched. No GitHub request made.'});
  try{
    const commit=await publicGitHubJson(`${GH}/git/commits/${e.proofCommitSha}`);
    // Fail before further GETs if the proof commit is not a direct source child.
    if(commit.sha!==e.proofCommitSha||commit.parents?.length!==1||
      commit.parents[0]?.sha!==e.sourceRevisionSha)
      return reply({ok:true,...boundary(e),public_github_check:'BLOCKED',reason:'GitHub proof commit/source parent differs. HOLD.'});
    const comparison=await publicGitHubJson(`${GH}/compare/${e.sourceRevisionSha}...${e.proofCommitSha}`);
    const file=await publicGitHubJson(`${GH}/contents/${QL249_PROOF_PATH}?ref=${e.proofCommitSha}`);
    const result=await verifyQl249PublicGitHubResponses(commit,comparison,file,e);
    return reply({ok:true,...boundary(e),public_github_check:result.ok?'PUBLIC_API_CRYPTOGRAPHIC_MATCH_ONLY':'BLOCKED',
      remote_public_metadata_match:result.ok,reason:result.reason,
      message:'Independently authenticated GitHub origin and CI, AI Data Platform consumer agreement, original seven gateway denials and owner pilot authorization remain PENDING.'});
  }catch{return reply({ok:true,...boundary(e),public_github_check:'BLOCKED',
    reason:'Public GitHub proof origin could not be retrieved or verified. No connection or case action occurred.'});}
}
