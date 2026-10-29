// Build 696: public GitHub response/metadata comparison ONLY, not independent
// origin attestation, consumer acceptance, real gateway proof or permission to connect.
import {verifyQl248RosieTransport} from './rosevear-integration-ql248.js';

export const QL249_PROOF_PATH='docs/integration/ql246-source-proof.json';
const SHA=/^[0-9a-f]{40}$/;
const HASH=/^[0-9a-f]{64}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const CHALLENGE=/^np-[A-Za-z0-9_-]+$/;
const fail=reason=>({ok:false,reason,stage:'BLOCKED',
  remote_github_public_api_match:false,independent_github_origin_attested:false,
  source_ci_independently_verified:false,consumer_agreement_verified:false,
  seven_original_denials_verified:false,original_gateway_evidence_verified:false,
  read_only_pilot_authorized:false,owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED'});
const hex=u=>Array.from(new Uint8Array(u),b=>b.toString(16).padStart(2,'0')).join('');

export function ql249IndependentExpectationsReady(e){return !!e&&
  SHA.test(String(e.sourceRevisionSha||''))&&SHA.test(String(e.proofCommitSha||''))&&
  e.sourceRevisionSha!==e.proofCommitSha&&HASH.test(String(e.proofSha256||''))&&
  HASH.test(String(e.publicKeySpkiSha256||''))&&CI.test(String(e.ciRunUrl||''))&&
  CHALLENGE.test(String(e.challengeId||''))&&HASH.test(String(e.challengeSha256||''))&&
  Object.hasOwn(e,'tenantId')&&e.tenantId===null;}

// `commit`, `comparison` and `file` are supplied HTTPS GitHub public API results;
// this verifies only response consistency with separately provisioned expectations.
// A mock or replayed API response is not independent provenance evidence.
export async function verifyQl249PublicGitHubResponses(commit,comparison,file,e,now=Date.now()){
  if(!ql249IndependentExpectationsReady(e))return fail('Independent source/proof SHA, raw digest, public SPKI, CI and challenge pins are missing');
  if(!commit||commit.sha!==e.proofCommitSha||!SHA.test(String(commit.tree?.sha||''))||
    !Array.isArray(commit.parents)||commit.parents.length!==1||
    commit.parents[0]?.sha!==e.sourceRevisionSha)
    return fail('Public GitHub proof commit is not a direct child of the audited source');
  if(!comparison||comparison.base_commit?.sha!==e.sourceRevisionSha||
    comparison.merge_base_commit?.sha!==e.sourceRevisionSha||
    comparison.head_commit?.sha!==e.proofCommitSha||comparison.status!=='ahead'||
    comparison.ahead_by!==1||comparison.behind_by!==0||comparison.total_commits!==1||
    !Array.isArray(comparison.files)||comparison.files.length!==1||
    comparison.files[0]?.filename!==QL249_PROOF_PATH||comparison.files[0]?.status!=='added')
    return fail('GitHub source-to-proof comparison is not one proof-only descendant commit');
  if(!file||file.type!=='file'||file.path!==QL249_PROOF_PATH||
    file.encoding!=='base64'||!SHA.test(String(file.sha||''))||
    !Number.isInteger(file.size)||file.size<80||file.size>16000||
    typeof file.content!=='string')return fail('Exact public proof Git blob is missing or unbounded');
  const base64=file.content.replace(/[\r\n]/g,'');
  if(base64.length<80||base64.length>24000||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))
    return fail('Public GitHub file is not strict standard base64');
  try{
    const raw=Uint8Array.from(atob(base64),x=>x.charCodeAt(0));
    if(raw.byteLength!==file.size)return fail('GitHub proof file byte count differs from response');
    const header=new TextEncoder().encode(`blob ${raw.byteLength}\0`);
    const blob=new Uint8Array(header.length+raw.byteLength);blob.set(header);blob.set(raw,header.length);
    if(hex(await crypto.subtle.digest('SHA-1',blob))!==file.sha)
      return fail('Public Git blob identifier differs from exact supplied bytes');
    const verified=await verifyQl248RosieTransport({system:'rosiedazzlers',
      sourceRevisionSha:e.sourceRevisionSha,proofCommitSha:e.proofCommitSha,
      rawProofBase64:base64},e,now);
    if(!verified.ok)return fail('QL-248 independent pin and signature mismatch: '+verified.reason);
    return {ok:true,stage:'PUBLIC_GITHUB_API_AND_PINNED_SIGNATURE_MATCH_ONLY',
      reason:'Public GitHub commit/compare/blob response, proof-only ancestry, exact bytes and independently pinned public signature match. Separate authenticated operator attestation and original gateway evidence remain PENDING.',
      remote_github_public_api_match:true,proof_only_diff:true,raw_blob_and_sha256_match:true,
      public_ed25519_pin_match:true,independent_github_origin_attested:false,
      source_ci_independently_verified:false,consumer_agreement_verified:false,
      seven_original_denials_verified:false,original_gateway_evidence_verified:false,
      read_only_pilot_authorized:false,owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED'};
  }catch{return fail('Public GitHub raw proof encoding, digest or Ed25519 verification failed');}
}
