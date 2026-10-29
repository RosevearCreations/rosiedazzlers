#!/usr/bin/env node
// Build 698: read-only public proof preflight for a REAL custodian-supplied file.
// Never generates/stores private keys, writes a proof, publishes commits or calls a gateway.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyQl246PinnedSignature} from '../functions/api/_lib/rosevear-integration-ql246.js';

const SHA=/^[0-9a-f]{40}$/;
const HASH=/^[0-9a-f]{64}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const CHALLENGE=/^np-[A-Za-z0-9_-]+$/;
function blocked(reason){return {ok:false,stage:'NOT_AVAILABLE_OR_UNVERIFIED',reason,
  signed_source_metadata_matched:false,origin_attested:false,
  independent_custodian_verified:false,distinct_witness_verified:false,
  original_denials_verified:false,owner_test_decision:'NOT_GIVEN',
  actual_gateway_test:'NOT_RUN',connection_state:'DISCONNECTED'};}

export async function preflightAuthenticQl252Proof(options,now=Date.now()){
  if(!options||typeof options!=='object'||!SHA.test(String(options.sourceRevisionSha||''))||
    !HASH.test(String(options.proofSha256||''))||
    !HASH.test(String(options.publicKeySpkiSha256||''))||
    !HASH.test(String(options.challengeSha256||''))||
    !CI.test(String(options.ciRunUrl||''))||
    !CHALLENGE.test(String(options.challengeId||''))||
    typeof options.proofFile!=='string'||!options.proofFile.trim()||
    options.tenantId!==null)
    return blocked('A real proof file and separately authenticated exact public SHA, source CI, SPKI and challenge expectations are required.');
  try{
    const raw=readFileSync(resolve(options.proofFile));
    if(raw.length<80||raw.length>16000)return blocked('Original proof bytes are missing or oversized.');
    const sha=createHash('sha256').update(raw).digest('hex');
    if(sha!==options.proofSha256)return blocked('Raw proof digest differs from independently supplied expectation.');
    const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
    const check=await verifyQl246PinnedSignature(envelope,{
      pinnedSpkiSha256:options.publicKeySpkiSha256,
      expectedRevision:options.sourceRevisionSha,
      expectedCiRunUrl:options.ciRunUrl,
      expectedChallengeId:options.challengeId,
      expectedChallengeSha256:options.challengeSha256,
      expectedTenantId:null},now);
    if(!check.ok)return blocked(check.reason);
    return {ok:true,stage:'LOCAL_PUBLIC_PROOF_DIGEST_AND_PINNED_SIGNATURE_MATCH_ONLY',
      source_sha_A:options.sourceRevisionSha,source_ci_run_url:options.ciRunUrl,
      exact_proof_bytes_sha256:sha,public_spki_sha256:options.publicKeySpkiSha256,
      signed_source_metadata_matched:true,
      proof_commit_sha_B:'NOT_AVAILABLE',immutable_public_proof_url:'NOT_AVAILABLE',
      independent_source_ci_attested:false,origin_attested:false,
      independent_custodian_verified:false,distinct_witness_verified:false,
      original_denials_verified:false,owner_test_decision:'NOT_GIVEN',
      actual_gateway_test:'NOT_RUN',connection_state:'DISCONNECTED',
      notice:'Local public-key signature match only; all signer custody, actual denial receipts, GitHub origin/CI, proof publication and owner approval must still be independently verified.'};
  }catch{return blocked('Genuine proof file cannot be read or decoded; no proof was published.');}
}

const invoked=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(invoked){
  const keys={'--proof-file':'proofFile','--source-sha':'sourceRevisionSha',
    '--ci-url':'ciRunUrl','--proof-sha256':'proofSha256',
    '--public-spki-sha256':'publicKeySpkiSha256','--challenge-id':'challengeId',
    '--challenge-sha256':'challengeSha256'};
  const args=process.argv.slice(2),options={tenantId:null};let bad=false;
  if(args.length!==Object.keys(keys).length*2)bad=true;
  for(let i=0;!bad&&i<args.length;i+=2){const key=keys[args[i]];
    if(!key||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,key)){bad=true;break;}
    options[key]=args[i+1];}
  const result=bad?blocked('Exactly seven public metadata flags are required; no private signing key or gateway input is accepted.'):
    await preflightAuthenticQl252Proof(options);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(!result.ok)process.exitCode=2;
}
