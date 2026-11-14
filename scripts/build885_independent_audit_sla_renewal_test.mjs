import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign} from 'node:crypto';
import {digest883,executionReceiptComment883} from '../functions/api/_lib/roadside-custody-v883.js';
import {retentionComment884} from '../functions/api/_lib/roadside-retention-v884.js';
import {auditRetentionChain885,monitorSchedulerSla885,verifyAudit885,auditComment885,
 verifyRenewal885,renewalComment885,ownerClosureRenewalDecision885}
 from '../functions/api/_lib/roadside-audit-v885.js';
const read=p=>readFileSync(p,'utf8'),now=Date.now(),iso=t=>new Date(t).toISOString();
const files=['functions/api/_lib/roadside-audit-v885.js',
 'functions/api/admin/roadside_independent_audit_v885.js',
 'scripts/build885_independent_retention_sla_audit.mjs',
 'scripts/build885_owner_closure_renewal.mjs',
 'scripts/build885_independent_audit_sla_renewal_test.mjs',
 'assets/admin-booking-v885.js'];
for(const p of files)execFileSync('node',['--check',p],{stdio:'pipe'});
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'});
const signPayload=p=>sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64url');
const sourcePayload=(mode,runid,at=now-400000)=>({
 schema:'rosie883-scheduler-step-receipt-v1',repository:'RosevearCreations/rosiedazzlers',
 mode,outcome:'VERIFY_STEP_SUCCESS',
 workflow:'.github/workflows/rosie882-signed-enrollment-watch.yml',
 run_id:String(runid),run_attempt:1,head_sha:'a'.repeat(40),
 ref:'refs/heads/main',event:'schedule',recorded_at:iso(at),
 no_customer_identifiers:true,no_provider_or_financial_acceptance_claim:true});
const receipt=(id,mode,runid,at)=>{const p=sourcePayload(mode,runid,at);
 return {id,user:{login:'github-actions[bot]'},
  body:executionReceiptComment883(p,signPayload(p))};};
const inputs=[receipt(101,'watch',1234),receipt(102,'anchor',1234),
 receipt(103,'watch',1235,now-300000),receipt(104,'anchor',1235,now-300000)];
const cps=[];
async function checkpoint(id,start,end,previousBody=null){
 const window=inputs.slice(start,end);
 const digest=await digest883(JSON.stringify(await Promise.all(window.map(async x=>[
  x.id,await digest883(x.body)]))));
 const payload={schema:'rosie884-scheduler-retention-v1',
  repository:'RosevearCreations/rosiedazzlers',run_id:String(9000+id),
  source_issue_number:77,source_comment_count:end,
  first_comment_id:window[0].id,last_comment_id:window.at(-1).id,
  verified_receipts:window.length,window_sha256:digest,
  previous_checkpoint_sha256:previousBody?await digest883(previousBody):null,
  recorded_at:iso(now-6000+id),no_immutable_retention_claim:true,
  no_vendor_or_financial_claim:true};
 return {id,user:{login:'github-actions[bot]'},
  body:retentionComment884(payload,signPayload(payload))};
}
const cp1=await checkpoint(1001,0,2),cp2=await checkpoint(1002,2,4,cp1.body);
const chain=await auditRetentionChain885({
 receipts:inputs,checkpoints:[cp1,cp2],pin,sourceIssue:77,now});
assert.equal(chain.state,'INDEPENDENT_RETENTION_CHAIN_VERIFIED');
assert.equal(chain.verified_checkpoints,2);
assert.equal(chain.original_step_receipts,4);
assert.equal(chain.latest_checkpoint_sha256,await digest883(cp2.body));
await assert.rejects(()=>auditRetentionChain885({receipts:inputs,
 checkpoints:[cp2],pin,sourceIssue:77,now}),/LINK_OR_COUNT/);
await assert.rejects(()=>auditRetentionChain885({receipts:inputs.slice(0,2),
 checkpoints:[cp1,cp2],pin,sourceIssue:77,now}),/LINK_OR_COUNT/);
await assert.rejects(()=>auditRetentionChain885({receipts:inputs,
 checkpoints:[cp1],pin,sourceIssue:77,now}),/UNATTESTED_SOURCE_TAIL/);
await assert.rejects(()=>auditRetentionChain885({receipts:inputs,
 checkpoints:[cp1,{...cp2,body:cp2.body.replace('source_comment_count":4','source_comment_count":3')}],
 pin,sourceIssue:77,now}),/SIGNATURE/);
await assert.rejects(()=>auditRetentionChain885({receipts:[inputs[0],inputs[0],...inputs.slice(2)],
 checkpoints:[cp1,cp2],pin,sourceIssue:77,now}),/SIGNATURE_OR_IDENTITY/);
await assert.rejects(()=>auditRetentionChain885({receipts:[{...inputs[0],user:{login:'operator'}},...inputs.slice(1)],
 checkpoints:[cp1,cp2],pin,sourceIssue:77,now}),/SIGNATURE_OR_IDENTITY/);
await assert.rejects(()=>auditRetentionChain885({receipts:inputs,
 checkpoints:[cp1,{...cp2,user:{login:'other'}}],pin,sourceIssue:77,now}),/SIGNATURE/);
const horizon=['4h','24h','7d','30d'];
const matureSource=[],runs=[];
for(let i=0;i<=360;i++){
 const t=now-(360-i)*2*3600000-20*60000,runid=50000+i;
 for(const mode of ['watch','anchor'])matureSource.push({
  mode,run_id:String(runid),run_attempt:1,head_sha:'a'.repeat(40),
  event:'schedule',outcome:'VERIFY_STEP_SUCCESS',recorded_at:iso(t)});
 runs.push({id:runid,run_attempt:1,head_sha:'a'.repeat(40),
  head_branch:'main',event:'schedule',status:'completed',conclusion:'success',
  path:'RosevearCreations/rosiedazzlers/.github/workflows/rosie882-signed-enrollment-watch.yml@main',
  repository:{full_name:'RosevearCreations/rosiedazzlers'}});
}
const sla=monitorSchedulerSla885(matureSource,runs,{now});
for(const h of horizon)assert.equal(sla.horizon[h],'VERIFIED','Expected mature '+h);
assert.equal(sla.state,'SHORT_HORIZON_SLA_VERIFIED');
const incomplete=monitorSchedulerSla885(matureSource.slice(-10),runs,{now});
assert.equal(incomplete.horizon['24h'],'INSUFFICIENT_HISTORY_HOLD');
assert.equal(incomplete.horizon['7d'],'INSUFFICIENT_HISTORY_HOLD');
const late=monitorSchedulerSla885(matureSource.filter(x=>
 Date.parse(x.recorded_at)<now-6*3600000),runs,{now});
assert.equal(late.horizon['4h'],'SCHEDULER_SLA_HOLD');
const broken=monitorSchedulerSla885(matureSource,
 runs.map(r=>r.id>=50359?{...r,conclusion:'failure'}:r),{now});
assert.equal(broken.horizon['4h'],'SCHEDULER_SLA_HOLD');
const noDual=monitorSchedulerSla885(matureSource.filter(x=>x.mode==='watch'),runs,{now});
assert.equal(noDual.horizon['24h'],'SCHEDULER_SLA_HOLD');
const auditPayload={schema:'rosie885-original-continuity-audit-v1',
 repository:'RosevearCreations/rosiedazzlers',run_id:'7777',
 chain_state:'INDEPENDENT_RETENTION_CHAIN_VERIFIED',
 latest_checkpoint_sha256:chain.latest_checkpoint_sha256,
 verified_checkpoints:2,original_step_receipts:4,
 sla:sla.horizon,recorded_at:iso(now-2000),
 original_vendor_delivery_not_inferred:true,not_worm_or_lifetime_archive:true};
const auditBody=auditComment885(auditPayload,signPayload(auditPayload));
assert.equal(await verifyAudit885(auditBody,pin,now),true);
assert.equal(await verifyAudit885(auditBody.replace('verified_checkpoints":2','verified_checkpoints":3'),pin,now),false);
assert.equal(await verifyAudit885(auditComment885({...auditPayload,recorded_at:iso(now+3600000)},
 signPayload({...auditPayload,recorded_at:iso(now+3600000)})),pin,now),false);
const checkpointSha=await digest883(cp2.body),auditSha=await digest883(auditBody);
const approval884={id:1005,user:{login:'RosevearCreations'},body:'ROSIE884-CLOSE: '+
 await digest883(cp1.body),created_at:iso(now-2500)};
const closed={number:451,state:'closed',state_reason:'completed',
 closed_by:{login:'github-actions[bot]'},closed_at:iso(now-2100)};
const ownerCmd='ROSIE885-RENEW: '+checkpointSha+':'+auditSha+':GENESIS';
const approval885={id:1006,user:{login:'RosevearCreations'},body:ownerCmd,
 created_at:iso(now-300)};
const eligible={auditBody,checkpointBody:cp2.body,pin,
 closureIssue:closed,closureComments:[approval884,approval885],
 previousCheckpointBodies:[cp1.body,cp2.body],priorRenewalBody:null,
 renewalComments:[approval885],now};
const passed=await ownerClosureRenewalDecision885(eligible);
assert.equal(passed.renew,true);
assert.equal(passed.state,'OWNER_RENEWAL_CURRENT_CHECKPOINT_APPROVED');
assert.equal(passed.command,ownerCmd);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 renewalComments:[]})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 renewalComments:[{...approval885,user:{login:'third-party'}}]})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 renewalComments:[approval885,approval885]})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 closureIssue:{...closed,state:'open'}})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 closureIssue:{...closed,closed_by:{login:'RosevearCreations'}}})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 closureComments:[approval885]})).renew,false);
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 previousCheckpointBodies:[cp2.body]})).renew,false);
const badSlaAudit={...auditPayload,sla:{...sla.horizon,'24h':'SCHEDULER_SLA_HOLD'}};
assert.equal((await ownerClosureRenewalDecision885({...eligible,
 auditBody:auditComment885(badSlaAudit,signPayload(badSlaAudit))})).renew,false);
const renewalPayload={schema:'rosie885-original-owner-closure-renewal-v1',
 repository:'RosevearCreations/rosiedazzlers',owner_comment_id:1006,
 closure_issue_number:451,checkpoint_sha256:checkpointSha,audit_sha256:auditSha,
 previous_renewal_sha256:null,owner_actor:'RosevearCreations',
 owner_gate_verified:true,recorded_at:iso(now),
 no_original_vendor_or_financial_clearance_claim:true};
const renewal=renewalComment885(renewalPayload,signPayload(renewalPayload));
assert.equal(await verifyRenewal885(renewal,pin,now),true);
assert.equal(await verifyRenewal885(renewal.replace('owner_comment_id":1006','owner_comment_id":1007'),pin,now),false);
const mirrors=read('admin-booking.html');
assert.equal(mirrors,read('admin-booking/index.html'));
for(const marker of ['rd885Inspect','rd885Chain','rd885Horizons','rd885Renewal',
 'rd885CopyRenew','/assets/admin-booking-v885.js'])
 assert(mirrors.includes(marker),'Missing mirrored Build 885 UI '+marker);
const protected885=read('.github/workflows/rosie885-protected-source.yml');
assert(protected885.includes('build885_independent_audit_sla_renewal_test.mjs'));
const monitor=read('.github/workflows/rosie885-independent-audit-watch.yml');
const manual=read('.github/workflows/rosie885-original-owner-renewal.yml');
assert(monitor.includes('schedule:')&&monitor.includes('issues: write')&&monitor.includes('main'));
assert(!manual.includes('schedule:')&&manual.includes("github.actor == 'RosevearCreations'"));
const admin=read('functions/api/admin/roadside_independent_audit_v885.js');
assert(admin.includes('allowLegacyAdminFallback:false')&&admin.includes("auth_mode!=='session'"));
const runner=read('scripts/build885_owner_closure_renewal.mjs');
assert(runner.includes("GITHUB_ACTOR!=='RosevearCreations'")&&
 !runner.includes("state:'closed'"));
console.log('Rosie 885 independent chain, tamper/rollback, 4h/24h/7d/30d SLA and owner-specific signed renewal regressions: PASS');
