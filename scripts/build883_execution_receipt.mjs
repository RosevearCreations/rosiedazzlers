#!/usr/bin/env node
// Build 883: append a signed, independently read-back GitHub workflow-step receipt.
// Not proof of continuous scheduling, provider delivery, financial clearance or WORM.
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {ledgerTitle883,executionReceiptComment883,verifyExecutionReceipt883,
 parseExecutionReceipt883} from '../functions/api/_lib/roadside-custody-v883.js';
const number=s=>/^[1-9][0-9]{0,18}$/.test(s||'');
function input883(env){
 const mode=env.ROSIE883_MODE;
 if(env.GITHUB_REPOSITORY!==repo881||env.GITHUB_REF!=='refs/heads/main'||
  !['watch','anchor'].includes(mode)||!number(env.GITHUB_RUN_ID)||
  !number(env.GITHUB_RUN_ATTEMPT)||Number(env.GITHUB_RUN_ATTEMPT)>1000||
  !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'')||
  !['schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME))
  throw Error('ORIGINAL_GITHUB_WORKFLOW_IDENTITY_HOLD');
 const expected=mode==='watch'?'owner-grace-ack':'external-anchor-reconciliation';
 if(env.ROSIE883_JOB!==expected)throw Error('SIGNED_JOB_IDENTITY_MISMATCH_HOLD');
 if(!['success','failure','skipped','cancelled'].includes(env.ROSIE883_VERIFICATION_OUTCOME))
  throw Error('VERIFICATION_STEP_OUTCOME_UNAVAILABLE_HOLD');
 return {mode,outcome:env.ROSIE883_VERIFICATION_OUTCOME==='success'?
  'VERIFY_STEP_SUCCESS':'VERIFY_STEP_HOLD'};
}
export async function runExecutionReceipt883(){
 const {mode,outcome}=input883(process.env);
 const raw=process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||'';
 let signer;
 try{signer=createPrivateKey({key:JSON.parse(raw),format:'jwk'});}catch{
  throw Error('INDEPENDENT_SIGNER_UNENROLLED_HOLD');}
 const publicJwk=createPublicKey(signer).export({format:'jwk'});
 const p={schema:'rosie883-scheduler-step-receipt-v1',
  repository:repo881,mode,outcome,
  workflow:'.github/workflows/rosie882-signed-enrollment-watch.yml',
  run_id:process.env.GITHUB_RUN_ID,run_attempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  head_sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,
  event:process.env.GITHUB_EVENT_NAME,recorded_at:new Date().toISOString(),
  no_customer_identifiers:true,no_provider_or_financial_acceptance_claim:true};
 const sig=sign(null,Buffer.from(JSON.stringify(p)),signer).toString('base64url');
 const body=executionReceiptComment883(p,sig);
 const issue=await originalIssue881(ledgerTitle883,
  'Signed, redacted original GitHub 882 workflow-step outcomes, not customer data or immutable retention.\n'+
  'A workflow receipt is not an independent live provider event, a successful whole-workflow conclusion, or owner approval.\n'+
  'Missing keys, failed jobs or absent original evidence remain HOLD.');
 if(!Number.isSafeInteger(issue.number)||issue.number<1||!Number.isSafeInteger(issue.comments||0))
  throw Error('GITHUB_LEDGER_ISSUE_METADATA_HOLD');
 const last=Math.max(1,Math.ceil((issue.comments||0)/100));
 const pages=last>1?[last-1,last]:[last],recent=[];
 for(const page of pages){
  const rows=await github881('/issues/'+issue.number+'/comments?per_page=100&page='+page);
  if(!Array.isArray(rows))throw Error('GITHUB_LEDGER_READBACK_HOLD');
  recent.push(...rows);
 }
 const same=recent.filter(c=>{
  const v=parseExecutionReceipt883(c.body)?.payload;
  return v?.run_id===p.run_id&&v.mode===p.mode&&v.run_attempt===p.run_attempt;
 });
 if(same.length>1)throw Error('DUPLICATE_ORIGINAL_SCHEDULER_RECEIPTS_HOLD');
 if(same.length===1){
  if(!await verifyExecutionReceipt883(same[0].body,publicJwk)||
   parseExecutionReceipt883(same[0].body).payload.outcome!==p.outcome)
   throw Error('EXISTING_SCHEDULER_RECEIPT_CONFLICT_HOLD');
  console.log('Rosie 883 existing signed execution receipt exact readback verified');
  return;
 }
 const wrote=await github881('/issues/'+issue.number+'/comments','POST',{body});
 if(!Number.isSafeInteger(wrote?.id))throw Error('SIGNED_SCHEDULER_LEDGER_WRITE_HOLD');
 const readback=await github881('/issues/comments/'+wrote.id);
 if(readback.body!==body||!await verifyExecutionReceipt883(readback.body,publicJwk)||
  readback.user?.login!=='github-actions[bot]')
  throw Error('INDEPENDENT_SIGNED_LEDGER_READBACK_HOLD');
 console.log('Rosie 883 signed GitHub step receipt exact readback: '+p.mode+' '+p.outcome+
  ' run '+p.run_id+' attempt '+p.run_attempt+' (not whole-workflow GREEN)');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 runExecutionReceipt883().catch(e=>{console.error('Rosie 883 ledger: '+e.message);process.exitCode=1;});
