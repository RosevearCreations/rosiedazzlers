#!/usr/bin/env node
// Build 695: local Git-object + pinned public QL-246 signature readiness ONLY.
// Does not fetch GitHub, attest an origin, authorize gateway tests or publish proof.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyQl248RosieTransport} from '../functions/api/_lib/rosevear-integration-ql248.js';

const SHA=/^[0-9a-f]{40}$/;
const HASH=/^[0-9a-f]{64}$/;
const PATH='docs/integration/ql246-source-proof.json';
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const CHALLENGE=/^np-[A-Za-z0-9_-]+$/;
const blocked=(reason,stage='BLOCKED')=>({ok:false,stage,reason,
  local_git_relation_verified:false,github_origin_attested:false,
  github_ci_verified:false,consumer_agreement_verified:false,
  seven_original_denials_verified:false,original_gateway_evidence_verified:false,
  connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN'});
function git(repo,args,encoding='utf8'){
  return execFileSync('git',['-C',repo,...args],{encoding,maxBuffer:200000,timeout:8000,stdio:['ignore','pipe','pipe']});
}

export async function reviewLocalQl249(options,now=Date.now()){
  if(!options||typeof options!=='object'||!SHA.test(String(options.sourceRevisionSha||''))||
    !SHA.test(String(options.proofCommitSha||''))||options.sourceRevisionSha===options.proofCommitSha||
    !HASH.test(String(options.proofSha256||''))||
    !HASH.test(String(options.publicKeySpkiSha256||''))||
    !CI.test(String(options.ciRunUrl||''))||!CHALLENGE.test(String(options.challengeId||''))||
    !HASH.test(String(options.challengeSha256||''))||
    options.tenantId!==null)return blocked('Exact distinct SHAs and independent nonsecret pin/CI/challenge expectations required');
  const repo=resolve(String(options.repo||'.'));
  try{
    if(git(repo,['cat-file','-t',options.sourceRevisionSha]).trim()!=='commit'||
      git(repo,['cat-file','-t',options.proofCommitSha]).trim()!=='commit')
      return blocked('Local immutable source and proof commits missing','PENDING_LOCAL_OBJECTS');
    git(repo,['merge-base','--is-ancestor',options.sourceRevisionSha,options.proofCommitSha]);
  }catch{return blocked('Git commit objects or immutable source ancestry are not available','PENDING_LOCAL_OBJECTS');}
  try{
    const paths=git(repo,['diff','--name-only','--no-renames',options.sourceRevisionSha,options.proofCommitSha])
      .trim().split('\n').filter(Boolean);
    if(paths.length!==1||paths[0]!==PATH)
      return blocked('Source-to-proof diff includes non-proof changes; independent code review required');
    const raw=git(repo,['show',`${options.proofCommitSha}:${PATH}`],null);
    if(raw.length<80||raw.length>16000)return blocked('Raw public proof bytes absent or outside safety bounds');
    if(createHash('sha256').update(raw).digest('hex')!==options.proofSha256)
      return blocked('Raw proof bytes differ from independently expected SHA-256');
    const result=await verifyQl248RosieTransport({system:'rosiedazzlers',
      sourceRevisionSha:options.sourceRevisionSha,proofCommitSha:options.proofCommitSha,
      rawProofBase64:raw.toString('base64')},options,now);
    if(!result.ok)return blocked('QL-248 pinned public signature failed: '+result.reason);
    return {ok:true,stage:'LOCAL_GIT_OBJECT_AND_PUBLIC_SIGNATURE_MATCH_ONLY',
      reason:'Local commit ancestry, proof-only diff, raw proof digest and independent pinned public Ed25519 signature match; independent GitHub origin/CI and real gateway observations remain PENDING.',
      local_git_relation_verified:true,proof_only_diff:true,
      raw_proof_digest_match:true,pinned_signature_match:true,
      github_origin_attested:false,github_ci_verified:false,consumer_agreement_verified:false,
      seven_original_denials_verified:false,original_gateway_evidence_verified:false,
      read_only_pilot_authorized:false,connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN'};
  }catch{return blocked('Local proof path is missing or Git object inspection failed','PENDING_LOCAL_PROOF');}
}

const invoked=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(invoked){
  const keys={'--repo':'repo','--source-sha':'sourceRevisionSha','--proof-sha':'proofCommitSha',
    '--proof-sha256':'proofSha256','--public-spki-sha256':'publicKeySpkiSha256',
    '--ci-url':'ciRunUrl','--challenge-id':'challengeId','--challenge-sha256':'challengeSha256'};
  const args=process.argv.slice(2),options={tenantId:null};let error=null;
  for(let i=0;i<args.length;i+=2){const key=keys[args[i]];
    if(!key||!args[i+1]||args[i+1].startsWith('--')){error='Invalid CLI flags: public metadata only';break;}
    options[key]=args[i+1];}
  const result=error?blocked(error):await reviewLocalQl249(options);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(!result.ok)process.exitCode=2;
}
