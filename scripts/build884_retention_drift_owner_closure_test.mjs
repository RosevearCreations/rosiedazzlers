import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {executionReceiptComment883} from '../functions/api/_lib/roadside-custody-v883.js';
import {sourceWindow884,retentionComment884,parseRetention884,verifyRetention884,
 assessExecutionDrift884,closureDecision884}
 from '../functions/api/_lib/roadside-retention-v884.js';
const files=['functions/api/_lib/roadside-retention-v884.js',
 'functions/api/admin/roadside_scheduler_retention_v884.js',
 'scripts/build884_retention_drift_watch.mjs',
 'scripts/build884_owner_gated_closure.mjs',
 'scripts/build884_retention_drift_owner_closure_test.mjs',
 'assets/admin-booking-v884.js'];
for(const p of files)execFileSync('node',['--check',p],{stdio:'pipe'});
const now=Date.now(),iso=t=>new Date(t).toISOString(),read=p=>readFileSync(p,'utf8');
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'});
const githubActor={login:'github-actions[bot]'},ownerActor={login:'RosevearCreations'};
const receipt=(mode,runId,time=now-600000,outcome='VERIFY_STEP_SUCCESS')=>{
 const payload={schema:'rosie883-scheduler-step-receipt-v1',
  repository:'RosevearCreations/rosiedazzlers',mode,outcome,
  workflow:'.github/workflows/rosie882-signed-enrollment-watch.yml',
  run_id:String(runId),run_attempt:1,head_sha:'a'.repeat(40),
  ref:'refs/heads/main',event:'schedule',recorded_at:iso(time),
  no_customer_identifiers:true,no_provider_or_financial_acceptance_claim:true};
 const sig=sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64url');
 return executionReceiptComment883(payload,sig);
};
const first={id:1001,user:githubActor,body:receipt('watch',1234)};
const second={id:1002,user:githubActor,body:receipt('anchor',1234)};
const original=[first,second];
const initial=await sourceWindow884(original,pin,{sourceIssue:73,sourceCount:2,now});
assert.equal(initial.verified_receipts,2);
assert.equal(initial.first_comment_id,1001);
assert.equal(initial.last_comment_id,1002);
assert.match(initial.window_sha256,/^[a-f0-9]{64}$/);
await assert.rejects(()=>sourceWindow884(original,pin,{sourceIssue:73,sourceCount:3,now}),
 /UNATTESTED_PREVIOUS_HISTORY/);
await assert.rejects(()=>sourceWindow884(original,pin,{sourceIssue:73,sourceCount:2,
 previousLastId:999,now}),/CURSOR_GAP/);
await assert.rejects(()=>sourceWindow884([first,first],pin,{sourceIssue:73,
 sourceCount:2,now}),/INVALID/);
await assert.rejects(()=>sourceWindow884([{...first,body:first.body.replace('VERIFY_STEP_SUCCESS','VERIFY_STEP_HOLD')},second],
 pin,{sourceIssue:73,sourceCount:2,now}),/INVALID/);
const third={id:1003,user:githubActor,body:receipt('watch',1235,now-300000)};
const extended=await sourceWindow884([first,second,third],pin,{
 sourceIssue:73,sourceCount:3,previousLastId:1002,now});
assert.equal(extended.verified_receipts,1);
assert.equal(extended.first_comment_id,1003);
const checkpoint={schema:'rosie884-scheduler-retention-v1',
 repository:'RosevearCreations/rosiedazzlers',run_id:'3333',
 source_issue_number:73,source_comment_count:2,
 first_comment_id:initial.first_comment_id,last_comment_id:initial.last_comment_id,
 verified_receipts:initial.verified_receipts,window_sha256:initial.window_sha256,
 previous_checkpoint_sha256:null,recorded_at:iso(now-1000),
 no_immutable_retention_claim:true,no_vendor_or_financial_claim:true};
const signed=p=>retentionComment884(p,sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64url'));
const cp=signed(checkpoint);
assert.deepEqual(parseRetention884(cp).payload,checkpoint);
assert.equal(await verifyRetention884(cp,pin,now),true);
assert.equal(await verifyRetention884(cp.replace('verified_receipts":2','verified_receipts":1'),pin,now),false);
assert.equal(await verifyRetention884(signed({...checkpoint,previous_checkpoint_sha256:'bad'}),pin,now),false);
assert.equal(await verifyRetention884(signed({...checkpoint,recorded_at:iso(now+600000)}),pin,now),false);
assert.equal(await verifyRetention884(signed({...checkpoint,no_immutable_retention_claim:false}),pin,now),false);
const sourceRows=[{mode:'watch',run_id:'1234',run_attempt:1,head_sha:'a'.repeat(40),
 recorded_at:iso(now-600000),outcome:'VERIFY_STEP_SUCCESS',event:'schedule'},
 {mode:'anchor',run_id:'1234',run_attempt:1,head_sha:'a'.repeat(40),
 recorded_at:iso(now-600000),outcome:'VERIFY_STEP_SUCCESS',event:'schedule'}];
const live={id:1234,run_attempt:1,head_sha:'a'.repeat(40),head_branch:'main',
 event:'schedule',status:'completed',conclusion:'success'};
const green=assessExecutionDrift884(sourceRows,[live],{now});
assert.equal(green.state,'ORIGINAL_EXECUTION_WINDOW_VERIFIED');
assert.equal(assessExecutionDrift884(sourceRows,[],{now}).state,'ORIGINAL_SCHEDULER_DRIFT_HOLD');
assert.equal(assessExecutionDrift884([{...sourceRows[0],recorded_at:iso(now-6*3600000)},sourceRows[1]],
 [live],{now}).state,'ORIGINAL_SCHEDULER_DRIFT_HOLD');
assert.equal(assessExecutionDrift884([{...sourceRows[0],outcome:'VERIFY_STEP_HOLD'},sourceRows[1]],
 [live],{now}).state,'ORIGINAL_SCHEDULER_DRIFT_HOLD');
assert.equal(assessExecutionDrift884(sourceRows,[{...live,conclusion:'failure'}],{now}).state,
 'ORIGINAL_SCHEDULER_DRIFT_HOLD');
assert.equal(assessExecutionDrift884([],[],{now}).state,'SIGNED_EXECUTION_COVERAGE_HOLD');
const fingerprint=createHash('sha256').update(cp).digest('hex');
const approval={user:ownerActor,body:'ROSIE884-CLOSE: '+fingerprint,created_at:iso(now)};
const eligible={retentionBody:cp,pin,drift:green,
 ownerAck:{state:'OWNER_ACK_CURRENT'},
 anchors:{state:'EXACT_EXTERNAL_ANCHORS_RECONCILED',original_receipts:1},
 originalReceiptCount:1,approvalComments:[approval],now};
const success=await closureDecision884(eligible);
assert.equal(success.close,true);
assert.equal(success.state,'OWNER_GATED_DRIFT_EXCEPTION_CLOSE_APPROVED');
assert.equal((await closureDecision884({...eligible,approvalComments:[]})).close,false);
assert.equal((await closureDecision884({...eligible,approvalComments:[{...approval,user:{login:'another'}}]})).close,false);
assert.equal((await closureDecision884({...eligible,approvalComments:[approval,approval]})).close,false);
assert.equal((await closureDecision884({...eligible,approvalComments:[{...approval,created_at:iso(now-86400000*2)}]})).close,false);
assert.equal((await closureDecision884({...eligible,ownerAck:{state:'OWNER_ACK_RENEWAL_HOLD'}})).close,false);
assert.equal((await closureDecision884({...eligible,anchors:{state:'EXTERNAL_ANCHOR_EXCEPTION_HOLD'}})).close,false);
assert.equal((await closureDecision884({...eligible,drift:{state:'ORIGINAL_SCHEDULER_DRIFT_HOLD'}})).close,false);
assert.equal((await closureDecision884({...eligible,retentionBody:cp.replace('verified_receipts":2','verified_receipts":1')})).close,false);
const a=read('admin-booking.html');
assert.equal(a,read('admin-booking/index.html'));
for(const marker of ['rd884Review','rd884Retention','rd884Drift','rd884Closure',
 'rd884CopyClose','/assets/admin-booking-v884.js'])
 assert(a.includes(marker),'Missing Build 884 owner UI '+marker);
const scheduled=read('.github/workflows/rosie884-retention-drift-watch.yml');
const manual=read('.github/workflows/rosie884-owner-gated-closure.yml');
const gate=read('.github/workflows/rosie884-protected-source.yml');
assert(scheduled.includes('schedule:')&&scheduled.includes('workflow_dispatch:')&&
 scheduled.includes('issues: write')&&scheduled.includes('main'));
assert(manual.includes('workflow_dispatch:')&&!manual.includes('schedule:')&&
 manual.includes("github.actor == 'RosevearCreations'"));
assert(gate.includes('build884_retention_drift_owner_closure_test.mjs'));
const script=read('scripts/build884_owner_gated_closure.mjs');
assert(script.includes("GITHUB_ACTOR!=='RosevearCreations'"));
assert(script.includes("state:'closed'")&&!script.includes('automatic issuer rotation'));
const admin=read('functions/api/admin/roadside_scheduler_retention_v884.js');
assert(admin.includes('allowLegacyAdminFallback:false')&&admin.includes("auth_mode!=='session'"));
console.log('Rosie 884 signed bounded retention, cursor continuity, drift escalation, explicit owner-gated closure and mirrored owner UI: PASS');
