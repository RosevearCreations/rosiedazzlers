#!/usr/bin/env node
// Rosie 884 owner-supervised closure of ONLY the Build 884 drift exception issue.
// Never closes original 881/883 evidence, changes provider/financial state, or invents approval.
import {createPrivateKey,createPublicKey} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {safeReport881} from './build881_native_drift_alert_runner.mjs';
import {ledgerTitle883,alertTitle883,anchorTitle883,digest883,
 ownerRenewal883,classifyAnchorRecovery883,
 parseExecutionReceipt883,verifyExecutionReceipt883}
 from '../functions/api/_lib/roadside-custody-v883.js';
import {retentionTitle884,driftTitle884,verifyRetention884,parseRetention884,
 assessExecutionDrift884,closureDecision884}
 from '../functions/api/_lib/roadside-retention-v884.js';
const root='https://rosiedazzlers.ca/api/';
async function source884(path,secret){
 if(secret.length<32)throw Error('ORIGINAL_SCHEDULER_SECRET_NOT_ENROLLED_HOLD');
 const r=await fetch(root+path,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'}});
 if(!r.ok)throw Error('ORIGINAL_PRIVATE_SOURCE_HOLD');
 const data=await r.json();
 if(data?.ok!==true)throw Error('ORIGINAL_SOURCE_NOT_VERIFIED_HOLD');
 return data;
}
async function issueComments884(issue,limit=100){
 if(!issue||!Number.isSafeInteger(issue.number)||!Number.isSafeInteger(issue.comments)||
  issue.comments>2000)throw Error('ORIGINAL_ISSUE_COMMENT_COVERAGE_HOLD');
 const last=Math.max(1,Math.ceil(issue.comments/100)),pages=last>1?[last-1,last]:[last];
 const all=[];
 for(const page of pages){
  const data=await github881('/issues/'+issue.number+'/comments?per_page=100&page='+page);
  if(!Array.isArray(data))throw Error('GITHUB_COMMENT_COUNT_DRIFT_HOLD');
  all.push(...data);
 }
 if(issue.comments<=100&&all.length!==issue.comments)throw Error('GITHUB_COMMENT_COUNT_DRIFT_HOLD');
 return all.slice(-limit);
}
export async function ownerClose884(){
 if(process.env.GITHUB_REPOSITORY!==repo881||process.env.GITHUB_REF!=='refs/heads/main'||
  process.env.GITHUB_EVENT_NAME!=='workflow_dispatch'||
  process.env.GITHUB_ACTOR!=='RosevearCreations')
  throw Error('ORIGINAL_OWNER_SUPERVISED_DISPATCH_REQUIRED_HOLD');
 let signer;
 try{signer=createPrivateKey({key:JSON.parse(
  process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||''),format:'jwk'});}
 catch{throw Error('ORIGINAL_EXTERNAL_SIGNER_UNENROLLED_HOLD');}
 const pin=createPublicKey(signer).export({format:'jwk'});
 const [watch,anchor]=await Promise.all([
  source884('roadside_operational_watch_v881',process.env.ROSIE881_OWNER_WATCH_JOB_SECRET||''),
  source884('roadside_anchor_candidates_v881',process.env.ROSIE881_ANCHOR_JOB_SECRET||'')]);
 safeReport881(watch);
 if(anchor?.external_witness_public_jwk?.x!==pin.x||
  anchor.build!==881||anchor.no_customer_identifiers!==true)
  throw Error('ORIGINAL_ANCHOR_VERIFIER_PIN_HOLD');
 const [checkIssue,ledgerIssue,driftIssue]=await Promise.all([
  originalIssue881(retentionTitle884),originalIssue881(ledgerTitle883),
  originalIssue881(driftTitle884)]);
 if(driftIssue.state!=='open')throw Error('NO_OPEN_ORIGINAL_DRIFT_EXCEPTION_HOLD');
 const [checkComments,ledgerComments,driftComments]=await Promise.all([
  issueComments884(checkIssue),issueComments884(ledgerIssue),issueComments884(driftIssue)]);
 const last=checkComments.at(-1);
 if(!last||last.user?.login!=='github-actions[bot]'||
  !await verifyRetention884(last.body,pin))
  throw Error('CURRENT_ORIGINAL_RETENTION_READBACK_HOLD');
 const cp=parseRetention884(last.body).payload;
 if(Date.now()-Date.parse(cp.recorded_at)>4*3600000||
  cp.source_issue_number!==ledgerIssue.number||
  cp.source_comment_count!==ledgerIssue.comments||
  cp.last_comment_id!==ledgerComments.at(-1)?.id)
  throw Error('EXPIRED_OR_STALE_ORIGINAL_RETENTION_HOLD');
 if(ledgerIssue.comments<=100&&ledgerComments.length!==ledgerIssue.comments)
  throw Error('ORIGINAL_EXECUTION_INVENTORY_DRIFT_HOLD');
 const previousCheckpoint=checkComments.at(-2);
 if(cp.previous_checkpoint_sha256!==null&&(!previousCheckpoint||
  !await verifyRetention884(previousCheckpoint.body,pin)||
  cp.previous_checkpoint_sha256!==await digest883(previousCheckpoint.body)))
  throw Error('SIGNED_RETENTION_CHECKPOINT_CHAIN_HOLD');

 const rows=[];
 for(const c of ledgerComments){
  if(c.user?.login!=='github-actions[bot]'||!await verifyExecutionReceipt883(c.body,pin))
   throw Error('ORIGINAL_SIGNED_SCHEDULER_RECEIPT_HOLD');
  const p=parseExecutionReceipt883(c.body).payload;
  rows.push({mode:p.mode,run_id:p.run_id,run_attempt:p.run_attempt,head_sha:p.head_sha,
   recorded_at:p.recorded_at,outcome:p.outcome,event:p.event});
 }
 const latest=['watch','anchor'].map(mode=>rows.filter(x=>x.mode===mode)
  .sort((a,b)=>Date.parse(b.recorded_at)-Date.parse(a.recorded_at))[0]).filter(Boolean);
 const runs=[];
 for(const item of latest){
  const r=await github881('/actions/runs/'+item.run_id);
  if(r?.repository?.full_name!==repo881||
   typeof r.path!=='string'||
   !r.path.split('@')[0].endsWith('/.github/workflows/rosie882-signed-enrollment-watch.yml'))
   throw Error('ORIGINAL_GITHUB_SCHEDULER_WORKFLOW_IDENTITY_HOLD');
  runs.push(r);
 }
 const drift=assessExecutionDrift884(rows,runs);
 const [ownerIssue,anchorIssue]=await Promise.all([
  watch.alert?originalIssue881(alertTitle883):Promise.resolve(null),
  originalIssue881(anchorTitle883)]);
 if(anchorIssue.comments>=100)throw Error('ORIGINAL_EXTERNAL_ANCHOR_COVERAGE_HOLD');
 const [ownerComments,anchorComments]=await Promise.all([
  ownerIssue?issueComments884(ownerIssue):Promise.resolve([]),
  issueComments884(anchorIssue)]);
 const renewal=await ownerRenewal883(watch,ownerIssue,ownerComments);
 const anchors=await classifyAnchorRecovery883(anchor,anchorComments);
 const decision=await closureDecision884({
  retentionBody:last.body,pin,drift,ownerAck:renewal,anchors,
  originalReceiptCount:anchor.receipt_count,
  approvalComments:driftComments});
 if(!decision.close){
  console.log('Rosie 884 original owner closure HOLD: '+decision.state+
   ' signed_checkpoint_sha256='+String(decision.fingerprint||'NOT_VERIFIED'));
  throw Error(decision.state);
 }
 // Exactly one explicitly approved issue is closed. Original 881 and 883 issues remain untouched.
 await github881('/issues/'+driftIssue.number,'PATCH',{state:'closed',
  state_reason:'completed'});
 const updated=await github881('/issues/'+driftIssue.number);
 if(updated.state!=='closed')throw Error('OWNER_GATED_EXCEPTION_CLOSE_READBACK_HOLD');
 console.log('Rosie 884 OWNER-GATED DRIFT EXCEPTION CLOSED: original issue #'+driftIssue.number+
  '; signer pinned, current source readback and exact owner approval verified.'+
  ' No provider/finance/issuer clearance inferred.');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 ownerClose884().catch(e=>{console.error('Rosie 884 closure: '+e.message);process.exitCode=1;});
