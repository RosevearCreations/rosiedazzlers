#!/usr/bin/env node
// Rosie 884 signed bounded retention checkpoints + original execution drift escalation.
// This is not WORM, automatic incident closure, or proof of original provider delivery.
import {createPrivateKey,createPublicKey,sign,createHash} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {verifyExecutionReceipt883,ledgerTitle883} from '../functions/api/_lib/roadside-custody-v883.js';
import {retentionTitle884,driftTitle884,sourceWindow884,assessExecutionDrift884,
 parseRetention884,verifyRetention884,retentionComment884}
 from '../functions/api/_lib/roadside-retention-v884.js';
const sourceUrl='https://rosiedazzlers.ca/api/roadside_anchor_candidates_v881';
const sha=s=>createHash('sha256').update(s).digest('hex');
const numeric=n=>Number.isSafeInteger(n)&&n>=0;
export async function comments884(issue,{limit=100}={}){
 if(!issue||!numeric(issue.comments)||!numeric(issue.number)||issue.number<1)
  throw Error('ORIGINAL_GITHUB_ISSUE_METADATA_HOLD');
 const last=Math.max(1,Math.ceil(issue.comments/100));
 const pages=last>1?[last-1,last]:[last],all=[];
 for(const page of pages){
  const rows=await github881('/issues/'+issue.number+'/comments?per_page=100&page='+page);
  if(!Array.isArray(rows)||rows.length>100)throw Error('GITHUB_COMMENT_READBACK_HOLD');
  all.push(...rows);
 }
 return all.slice(-limit);
}
async function pin884(secret,signer){
 if(secret.length<32)throw Error('ORIGINAL_ANCHOR_JOB_NOT_ENROLLED_HOLD');
 const r=await fetch(sourceUrl,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'}});
 if(!r.ok)throw Error('ORIGINAL_PIN_SOURCE_HOLD');
 const value=await r.json();
 if(value?.ok!==true||value.build!==881||value.no_customer_identifiers!==true||
  value.no_proof_of_actual_key_change!==true)
  throw Error('ORIGINAL_VERIFIER_INVENTORY_HOLD');
 const pin=value.external_witness_public_jwk;
 const local=createPublicKey(signer).export({format:'jwk'});
 if(pin?.kty!=='OKP'||pin.crv!=='Ed25519'||pin.x!==local.x)
  throw Error('DISTINCT_ORIGINAL_SIGNER_PIN_MISMATCH_HOLD');
 return pin;
}
export async function run884(){
 if(process.env.GITHUB_REPOSITORY!==repo881||
  process.env.GITHUB_REF!=='refs/heads/main'||
  !['schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)||
  !/^[1-9][0-9]{0,18}$/.test(process.env.GITHUB_RUN_ID||''))
  throw Error('ORIGINAL_MAIN_SCHEDULE_AUTHORITY_HOLD');
 let signer;try{signer=createPrivateKey({key:JSON.parse(
  process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||''),format:'jwk'});}
 catch{throw Error('INDEPENDENT_RETENTION_SIGNER_MISSING_HOLD');}
 const pin=await pin884(process.env.ROSIE881_ANCHOR_JOB_SECRET||'',signer);
 const ledger=await originalIssue881(ledgerTitle883);
 const original=await comments884(ledger);
 const checkIssue=await originalIssue881(retentionTitle884,
  'Signed original GitHub 883 step receipt checkpoints, bounded with linked digests.\n'+
  'Signatures and GitHub readback provide tamper evidence, not WORM or a complete lifetime archive.\n'+
  'No original vendor/customer/financial acceptance or automatic owner approval is asserted.');
 const past=await comments884(checkIssue,{limit:2});
 if(past.length!==Math.min(checkIssue.comments,2))
  throw Error('RETENTION_CHECKPOINT_INVENTORY_HOLD');
 let predecessor=null,previousLastId=null,previousSourceCount=null;
 if(past.length){
  const last=past.at(-1),prior=past.at(-2);
  if(last.user?.login!=='github-actions[bot]'||
   !await verifyRetention884(last.body,pin))
   throw Error('LAST_RETENTION_CHECKPOINT_INVALID_HOLD');
  if(prior&&(!await verifyRetention884(prior.body,pin)||
   parseRetention884(last.body).payload.previous_checkpoint_sha256!==sha(prior.body)))
   throw Error('RETENTION_CHECKPOINT_LINK_BROKEN_HOLD');
  if(!prior&&checkIssue.comments>1)
   throw Error('RETENTION_CHECKPOINT_CHAIN_COVERAGE_HOLD');
  predecessor=sha(last.body);
  previousLastId=parseRetention884(last.body).payload.last_comment_id;
  previousSourceCount=parseRetention884(last.body).payload.source_comment_count;
 }
 let win=null,drift=null,reason=null;
 try{
  win=await sourceWindow884(original,pin,{sourceIssue:ledger.number,
   sourceCount:ledger.comments,previousLastId,previousSourceCount});
  // Assess the full original last-100 window, not only the newly checkpointed rows.
  const full=await Promise.all(original.map(async c=>{
   if(!await verifyExecutionReceipt883(c.body,pin))throw Error('UNSIGNED_LATEST_SOURCE_HOLD');
   const p=JSON.parse(c.body.split('\n')[1]).payload;
   return {mode:p.mode,run_id:p.run_id,run_attempt:p.run_attempt,
    head_sha:p.head_sha,recorded_at:p.recorded_at,outcome:p.outcome,event:p.event};
  }));
  const latest=['watch','anchor'].map(mode=>full.filter(x=>x.mode===mode)
   .sort((a,b)=>Date.parse(b.recorded_at)-Date.parse(a.recorded_at))[0]).filter(Boolean);
  const runs=[];
  for(const item of latest){
   const r=await github881('/actions/runs/'+item.run_id);
   if(r?.repository?.full_name!==repo881||
    typeof r.path!=='string'||!r.path.split('@')[0].endsWith('/.github/workflows/rosie882-signed-enrollment-watch.yml'))
    throw Error('ORIGINAL_SCHEDULER_WORKFLOW_PROVENANCE_HOLD');
   runs.push(r);
  }
  drift=assessExecutionDrift884(full,runs);
 }catch(e){reason=String(e?.message||'ORIGINAL_EXECUTION_HOLD').slice(0,100);}
 // An original escalation issue remains open until owner-supervised closure.
 const summary=drift||{state:'ORIGINAL_EXECUTION_COVERAGE_HOLD',reason};
 const digest=sha(JSON.stringify(summary));
 const body='<!-- rosie884-drift-state:'+JSON.stringify({state:summary.state,
  fingerprint:digest,source_count:ledger.comments})+' -->\n'+
  '## Original Signed Scheduler Receipt Drift — Owner Review\n'+
  'Original execution: **'+summary.state+'**.\n'+
  'Signed source receipt comments observed: '+ledger.comments+'.\n'+
  'Bounded retention checkpoint completed: '+Boolean(win)+'.\n'+
  'Missing or stale original scheduling, incomplete source coverage and independent signing failure remain HOLD.\n'+
  'Do not auto-close this exception, infer live vendor delivery, adjust finance, rotate issuers or fabricate an owner acknowledgment.\n'+
  'To request closure, review original source, the latest signed retention checkpoint and owner ACK, then use the Build 884 owner-gated closure workflow.\n';
 const issue=await originalIssue881(driftTitle884,body);
 if(issue.body!==body||issue.state==='closed')
  await github881('/issues/'+issue.number,'PATCH',{body,
   ...(summary.state!=='ORIGINAL_EXECUTION_WINDOW_VERIFIED'?{state:'open'}:{})});
 const verifiedIssue=await github881('/issues/'+issue.number);
 if(verifiedIssue.body!==body)throw Error('ORIGINAL_DRIFT_ISSUE_READBACK_HOLD');
 if(reason)throw Error(reason);
 // Save a checkpoint only when every newly included original record was signed and contiguous.
 const payload={schema:'rosie884-scheduler-retention-v1',repository:repo881,
  run_id:process.env.GITHUB_RUN_ID,...{
   source_issue_number:win.source_issue_number,
   source_comment_count:win.source_comment_count,
   first_comment_id:win.first_comment_id,last_comment_id:win.last_comment_id,
   verified_receipts:win.verified_receipts,window_sha256:win.window_sha256},
  previous_checkpoint_sha256:predecessor,recorded_at:new Date().toISOString(),
  no_immutable_retention_claim:true,no_vendor_or_financial_claim:true};
 const signature=sign(null,Buffer.from(JSON.stringify(payload)),signer).toString('base64url');
 const content=retentionComment884(payload,signature);
 if(!await verifyRetention884(content,pin))throw Error('LOCAL_CHECKPOINT_SIGNATURE_HOLD');
 const wrote=await github881('/issues/'+checkIssue.number+'/comments','POST',{body:content});
 if(!numeric(wrote?.id)||wrote.id<1)throw Error('RETENTION_WRITE_NOT_CONFIRMED_HOLD');
 const readback=await github881('/issues/comments/'+wrote.id);
 if(readback.body!==content||readback.user?.login!=='github-actions[bot]'||
  !await verifyRetention884(readback.body,pin))
  throw Error('ORIGINAL_CHECKPOINT_READBACK_HOLD');
 console.log('Rosie 884 original signed retention: '+win.verified_receipts+
  ' receipts; last_comment_id='+win.last_comment_id+
  '; execution='+drift.state+'; immutable/WORM claim=false');
 if(drift.state!=='ORIGINAL_EXECUTION_WINDOW_VERIFIED')throw Error(drift.state);
}
async function escalateFailure884(error){
 if(process.env.GITHUB_REPOSITORY!==repo881||process.env.GITHUB_REF!=='refs/heads/main')
  return;
 const original=String(error?.message||'ORIGINAL_SOURCE_HOLD');
 const state=/^[A-Z0-9_]{4,100}_HOLD$/.test(original)?
  original:'ORIGINAL_RETENTION_VERIFICATION_HOLD';
 const body='<!-- rosie884-drift-failure:'+state+' -->\n'+
  '## Original Signed Scheduler / Retention Exception — Owner Review\n'+
  'Original verification: **'+state+'**.\n'+
  'The protected scheduled source was unavailable or incomplete. No signed retention,'+
  ' provider delivery, finance closure or human ACK has been invented.\n'+
  'An original owner must inspect the signed GitHub workflow logs and source evidence.'+
  ' This exception is never automatically closed.\n';
 const issue=await originalIssue881(driftTitle884,body);
 if(issue.body!==body||issue.state==='closed')
  await github881('/issues/'+issue.number,'PATCH',{body,state:'open'});
 const actual=await github881('/issues/'+issue.number);
 if(actual.body!==body||actual.state!=='open')
  throw Error('FAIL_CLOSED_OWNER_ESCALATION_READBACK_HOLD');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 run884().catch(async e=>{
  try{await escalateFailure884(e);}
  catch(x){console.error('Rosie 884 escalation HOLD: '+x.message);}
  console.error('Rosie 884: '+e.message);process.exitCode=1;
 });
