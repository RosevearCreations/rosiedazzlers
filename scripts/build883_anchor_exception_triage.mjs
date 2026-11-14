#!/usr/bin/env node
// Build 883: manual, redacted original external anchor exception triage.
// Never writes provider data, generates source receipts, automatically reanchors or rotates a key.
import {createPrivateKey,createPublicKey} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {keyId881} from './build881_independent_anchor_runner.mjs';
import {anchorTitle883,recoveryTitle883,classifyAnchorRecovery883}
 from '../functions/api/_lib/roadside-custody-v883.js';
const url='https://rosiedazzlers.ca/api/roadside_anchor_candidates_v881';
export async function runTriage883(){
 const key=process.env.ROSIE881_ANCHOR_JOB_SECRET||'';
 if(process.env.GITHUB_REPOSITORY!==repo881||key.length<32||
  process.env.GITHUB_REF!=='refs/heads/main')
  throw Error('ORIGINAL_SOURCE_TRIAGE_AUTHORITY_HOLD');
 let signer;try{signer=createPrivateKey({key:JSON.parse(
  process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||''),format:'jwk'});}
 catch{throw Error('SEPARATE_GITHUB_SIGNER_NOT_ENROLLED_HOLD');}
 const res=await fetch(url,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+key,Accept:'application/json'}});
 if(!res.ok)throw Error('ORIGINAL_SOURCE_UNAVAILABLE_HOLD HTTP '+res.status);
 const source=await res.json();
 const publicLocal=createPublicKey(signer).export({format:'jwk'});
 if(keyId881(source.external_witness_public_jwk)!==keyId881(publicLocal)||
  source.external_witness_public_jwk.x!==publicLocal.x)
  throw Error('ORIGINAL_PUBLIC_PIN_AND_PRIVATE_SIGNER_MISMATCH_HOLD');
 let anchorIssue=null;
 try{anchorIssue=await originalIssue881(anchorTitle883);}
 catch(e){if(e.message!=='Owner issue anchor missing')throw e;}
 let comments=[];
 if(anchorIssue){
  if((anchorIssue.comments||0)>=100)comments=null;
  else comments=await github881('/issues/'+anchorIssue.number+'/comments?per_page=100');
 }
 const result=await classifyAnchorRecovery883(source,comments,{
  truncated:!!anchorIssue&&(anchorIssue.comments||0)>=100});
 const body='<!-- rosie883-recovery-state:'+JSON.stringify(result)+' -->\n'+
  '## Original External Anchor Exception Recovery — Owner Review\n'+
  'Source-only classification: **'+result.state+'**.\n'+
  'Verified: '+result.verified+'; missing: '+result.missing+
  '; invalid: '+result.invalid+'; duplicate: '+result.duplicate+
  '; unexpected: '+result.unexpected+'.\n'+
  'This is a manual inventory/reconciliation result. No original issuer was rotated, no receipt was created and no gap auto-repaired.\n'+
  'Before manual recovery, the owner should inspect the original 880 source custody and the 881 independent anchor workflow, then explicitly supervise any rerun.\n'+
  'Do not treat a software release or this issue as live vendor evidence, immutable WORM, financial closure or owner acceptance.\n';
 const issue=await originalIssue881(recoveryTitle883,body);
 if(issue.body!==body)await github881('/issues/'+issue.number,'PATCH',{body});
 const refreshed=await github881('/issues/'+issue.number);
 if(refreshed.body!==body)throw Error('ORIGINAL_OWNER_RECOVERY_ISSUE_READBACK_HOLD');
 console.log('Rosie 883 manual anchor recovery: '+result.state+
  ' verified='+result.verified+' missing='+result.missing+
  ' invalid='+result.invalid+' duplicate='+result.duplicate+
  ' unexpected='+result.unexpected);
 if(result.state!=='EXACT_EXTERNAL_ANCHORS_RECONCILED')throw Error(result.state);
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 runTriage883().catch(e=>{console.error('Rosie 883 recovery: '+e.message);process.exitCode=1;});
