// Build 694: QL-248 source vs proof-commit transport preflight for Rosie only.
// All trust expectations MUST come from an independently authenticated operator.
import {verifyQl246PinnedSignature} from './rosevear-integration-ql246.js';

const SHA=/^[0-9a-f]{40}$/;
const HASH=/^[0-9a-f]{64}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const CHALLENGE=/^np-[A-Za-z0-9_-]+$/;
const SYSTEM='rosiedazzlers';
const LABEL='SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD';

const blocked=reason=>({ok:false,reason,transport_state:'BLOCKED',
  origin_attested:false,consumer_agreement_verified:false,
  seven_original_denials_verified:false,original_gateway_evidence_verified:false,
  owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED'});

export function pendingQl248Transport(sourceRevisionSha=null){
  return {system:SYSTEM,sourceRevisionSha:SHA.test(String(sourceRevisionSha||''))?sourceRevisionSha:null,
    proofCommitSha:null,proofSha256:null,publicKeySpkiSha256:null,
    ai_data_platform_consumer_agreement:'PENDING',origin_attested:false,
    seven_original_denials_verified:false,owner_authorization:'NOT_GIVEN',
    connection_state:'DISCONNECTED'};
}

// `source` mirrors a SINGLE Rosie row from the QL-248 offline --bundle.
// `expected` is separately provisioned trusted metadata, never from the same request.
// This performs NO GitHub fetch, key creation, receipt lookup, signature publication or writes.
export async function verifyQl248RosieTransport(source,expected,now=Date.now()){
  if(!source||typeof source!=='object'||Array.isArray(source)||
    Object.keys(source).sort().join(',')!=='proofCommitSha,rawProofBase64,sourceRevisionSha,system')
    return blocked('Exactly one Rosie public bundle row is required');
  if(source.system!==SYSTEM||!SHA.test(String(source.sourceRevisionSha||''))||
    !SHA.test(String(source.proofCommitSha||''))||
    source.sourceRevisionSha===source.proofCommitSha)
    return blocked('Separate immutable source and proof-bearing commit SHAs are required');
  if(!expected||!Object.hasOwn(expected,'tenantId')||expected.tenantId!==null||
    !SHA.test(String(expected.sourceRevisionSha||''))||
    !SHA.test(String(expected.proofCommitSha||''))||
    expected.sourceRevisionSha===expected.proofCommitSha||
    !HASH.test(String(expected.proofSha256||''))||
    !HASH.test(String(expected.publicKeySpkiSha256||''))||
    !CI.test(String(expected.ciRunUrl||''))||
    !CHALLENGE.test(String(expected.challengeId||''))||
    !HASH.test(String(expected.challengeSha256||'')))
    return blocked('Distinct independently trusted proof SHA, raw digest, SPKI, CI and challenge are missing');
  if(source.sourceRevisionSha!==expected.sourceRevisionSha||
    source.proofCommitSha!==expected.proofCommitSha)
    return blocked('Public bundle identity does not match separately trusted source/proof SHAs');
  const b64=source.rawProofBase64;
  if(typeof b64!=='string'||b64.length<80||b64.length>24000||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64))
    return blocked('Exact raw proof bytes must be supplied as bounded standard base64');
  try{
    const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    if(raw.byteLength>16000)return blocked('Public proof exceeds maximum allowed size');
    const hex=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),
      b=>b.toString(16).padStart(2,'0')).join('');
    if(hex!==expected.proofSha256)return blocked('Raw proof SHA-256 differs from separately trusted digest');
    const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
    const signed=await verifyQl246PinnedSignature(envelope,{
      pinnedSpkiSha256:expected.publicKeySpkiSha256,
      expectedRevision:expected.sourceRevisionSha,
      expectedCiRunUrl:expected.ciRunUrl,
      expectedChallengeId:expected.challengeId,
      expectedChallengeSha256:expected.challengeSha256,
      expectedTenantId:expected.tenantId},now);
    if(!signed.ok)return blocked(signed.reason);
    return {ok:true,reason:'Raw bytes, distinct SHAs and independently pinned Ed25519 source signature match. GitHub origin and real witnesses remain unverified.',
      transport_state:'PUBLIC_METADATA_CRYPTOGRAPHICALLY_MATCHED_ONLY',
      offline_result_label:LABEL,origin_attested:false,consumer_agreement_verified:false,
      seven_original_denials_verified:false,original_gateway_evidence_verified:false,
      owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED'};
  }catch{return blocked('Public proof bytes, JSON or Ed25519 signature are invalid');}
}
