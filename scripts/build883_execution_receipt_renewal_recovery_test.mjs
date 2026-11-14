import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {receiptMarker883,executionReceiptComment883,parseExecutionReceipt883,
 verifyExecutionReceipt883,summarizeExecutionLedger883,digest883,
 ownerRenewal883,classifyAnchorRecovery883}
 from '../functions/api/_lib/roadside-custody-v883.js';
const paths=['functions/api/_lib/roadside-custody-v883.js',
 'functions/api/admin/roadside_scheduler_custody_v883.js',
 'scripts/build883_execution_receipt.mjs',
 'scripts/build883_anchor_exception_triage.mjs',
 'scripts/build883_execution_receipt_renewal_recovery_test.mjs',
 'assets/admin-booking-v883.js'];
for(const p of paths)execFileSync('node',['--check',p],{stdio:'pipe'});
const read=p=>readFileSync(p,'utf8'),now=Date.now(),iso=t=>new Date(t).toISOString();
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'});
const sourceSha=c=>c.repeat(64);
const payload=(mode,runId)=>({
 schema:'rosie883-scheduler-step-receipt-v1',repository:'RosevearCreations/rosiedazzlers',
 mode,outcome:'VERIFY_STEP_SUCCESS',
 workflow:'.github/workflows/rosie882-signed-enrollment-watch.yml',
 run_id:String(runId),run_attempt:1,head_sha:'a'.repeat(40),
 ref:'refs/heads/main',event:'schedule',recorded_at:iso(now-1000),
 no_customer_identifiers:true,no_provider_or_financial_acceptance_claim:true
});
const signed=p=>executionReceiptComment883(p,
 sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64url'));
const watch=payload('watch',123456),anchor=payload('anchor',123456);
const w=signed(watch),a=signed(anchor);
assert.equal(receiptMarker883(watch),'<!-- rosie883-scheduler-receipt:123456:watch:1 -->');
assert.deepEqual(parseExecutionReceipt883(w).payload,watch);
assert.equal(await verifyExecutionReceipt883(w,pin,now),true);
assert.equal(await verifyExecutionReceipt883(a,pin,now),true);
assert.equal(await verifyExecutionReceipt883(w.replace('VERIFY_STEP_SUCCESS','VERIFY_STEP_HOLD'),pin,now),false);
assert.equal(await verifyExecutionReceipt883(signed({...watch,ref:'refs/heads/dev'}),pin,now),false);
assert.equal(await verifyExecutionReceipt883(signed({...watch,head_sha:'wrong'}),pin,now),false);
assert.equal(await verifyExecutionReceipt883(signed({...watch,recorded_at:iso(now+3600000)}),pin,now),false);
const ledger=await summarizeExecutionLedger883([{body:w},{body:a}],pin,{now});
assert.equal(ledger.state,'SIGNED_STEP_RECEIPTS_FRESH');
assert.equal(ledger.receipts_in_window,2);
assert.equal(ledger.watch.outcome,'VERIFY_STEP_SUCCESS');
assert.equal((await summarizeExecutionLedger883([{body:w}],pin,{now})).state,'SCHEDULER_RECEIPT_COVERAGE_HOLD');
assert.equal((await summarizeExecutionLedger883([{body:w},{body:w},{body:a}],pin,{now})).state,'DUPLICATE_EXECUTION_RECEIPT_HOLD');
assert.equal((await summarizeExecutionLedger883([{body:w.replace('VERIFY_STEP_SUCCESS','VERIFY_STEP_HOLD')}],pin,{now})).state,'LEDGER_SIGNATURE_OR_FORMAT_HOLD');
assert.equal((await summarizeExecutionLedger883([{body:signed({...watch,recorded_at:iso(now-7*3600000)})},{body:a}],pin,{now})).state,'SCHEDULER_RECEIPT_STALE_HOLD');
assert.equal((await summarizeExecutionLedger883([{body:signed({...watch,outcome:'VERIFY_STEP_HOLD'})},{body:a}],pin,{now})).state,'SCHEDULER_STEP_FAILURE_HOLD');
const measures={native_observations:0,original_drafts_observed:0,native_source_changes_review:0,
 broken_native_chain_links:0,stale_native_observations:0,aged_signed_events:0,
 rotation_receipts:0,broken_rotation_chain_links:0,grace_expiring_seven_days:0,
 grace_expiring_72_hours:0,grace_expired:0,pin_custody_hold:0};
const original={ok:true,build:881,severity:'REVIEW',alert:true,coverage_incomplete:false,
 no_original_native_history:true,no_original_rotation_receipts:true,...measures,
 no_customer_identifiers:true,original_provider_current_delivery_not_inferred:true,
 no_financial_or_key_mutation:true};
const report={severity:'REVIEW',coverage_incomplete:false,no_original_native_history:true,
 no_original_rotation_receipts:true,measures};
const fingerprint=await digest883(JSON.stringify(report));
const issue={body:'<!-- rosie881-watch-state:'+JSON.stringify(report)+' -->\nOwner alert'};
const correct={user:{login:'RosevearCreations'},body:'ROSIE882-ACK: '+fingerprint,
 created_at:iso(now-1000)};
const current=await ownerRenewal883(original,issue,[correct],{now});
assert.equal(current.state,'OWNER_ACK_CURRENT');
assert.equal(current.renewal_required,false);
assert.equal(current.ack_command,'ROSIE882-ACK: '+fingerprint);
assert.equal((await ownerRenewal883(original,issue,[{...correct,user:{login:'another'}}],{now})).state,'OWNER_ACK_RENEWAL_HOLD');
assert.equal((await ownerRenewal883(original,issue,[{...correct,created_at:iso(now-8*86400000)}],{now})).state,'OWNER_ACK_RENEWAL_HOLD');
assert.equal((await ownerRenewal883({...original,grace_expired:1},issue,[correct],{now})).state,'ORIGINAL_ALERT_SNAPSHOT_DRIFT_HOLD');
assert.equal((await ownerRenewal883({...original,severity:'NONE',alert:false},null,null,{now})).state,'NO_ACTIVE_ALERT');
const p={schema:'rosie881-independent-rotation-receipt-anchor-v1',receipt_sha256:sourceSha('a'),
 anchor_public_key_id:'ed25519-sha256:'+createHash('sha256').update(pin.x).digest('base64url'),anchored_at:iso(now-1000)};
const oldSig=sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64url');
const comment='<!-- rosie881-rotation-anchor:'+p.receipt_sha256+' -->\n'+
 JSON.stringify({payload:p,signature_ed25519:oldSig})+
 '\n\nMetadata-only, separate GitHub-hosted tamper-evident anchor. NOT WORM or third-party human witnessing.';
const inventory={ok:true,build:881,receipt_digests:[sourceSha('a')],receipt_count:1,
 no_customer_identifiers:true,no_proof_of_actual_key_change:true,external_witness_public_jwk:pin};
let anchorState=await classifyAnchorRecovery883(inventory,[{body:comment}],{now});
assert.equal(anchorState.state,'EXACT_EXTERNAL_ANCHORS_RECONCILED');
assert.equal(anchorState.verified,1);
assert.equal((await classifyAnchorRecovery883(inventory,[],{now})).state,'EXTERNAL_ANCHOR_EXCEPTION_HOLD');
assert.equal((await classifyAnchorRecovery883(inventory,[{body:comment},{body:comment}],{now})).duplicate,1);
assert.equal((await classifyAnchorRecovery883(inventory,[{body:comment.replace('NOT WORM','IS WORM')}],{now})).invalid,1);
assert.equal((await classifyAnchorRecovery883({...inventory,receipt_count:0},[],{now})).state,'ORIGINAL_ANCHOR_SOURCE_HOLD');
assert.equal((await classifyAnchorRecovery883({...inventory,receipt_count:0,receipt_digests:[]},[],{now})).state,'NO_ORIGINAL_ROTATION_RECEIPTS_HOLD');
assert.equal((await classifyAnchorRecovery883(inventory,[{body:comment}],{now,truncated:true})).state,'ANCHOR_COMMENT_COVERAGE_HOLD');
const page=read('admin-booking.html');
assert.equal(page,read('admin-booking/index.html'));
for(const marker of ['rd883Inspect','rd883Ledger','rd883Ack','rd883Anchor',
 'rd883CopyAck','/assets/admin-booking-v883.js'])
 assert(page.includes(marker),'Missing mirrored 883 owner UI '+marker);
const scheduler=read('.github/workflows/rosie882-signed-enrollment-watch.yml');
const gate=read('.github/workflows/rosie883-protected-source.yml');
const manual=read('.github/workflows/rosie883-manual-anchor-recovery.yml');
assert.equal((scheduler.match(/continue-on-error: true/g)||[]).length,2);
assert.equal((scheduler.match(/node scripts\/build883_execution_receipt.mjs/g)||[]).length,2);
assert.equal((scheduler.match(/Keep original verification failures as failures/g)||[]).length,2);
assert(scheduler.includes('issues: write')&&scheduler.includes('steps.verify.outcome'));
assert(gate.includes('scripts/build883_execution_receipt_renewal_recovery_test.mjs'));
assert(manual.includes('workflow_dispatch:')&&!manual.includes('schedule:'));
const admin=read('functions/api/admin/roadside_scheduler_custody_v883.js');
assert(admin.includes('allowLegacyAdminFallback:false')&&admin.includes("auth_mode!=='session'"));
assert(!admin.includes('createStripeCheckoutSession')&&!admin.includes('writeSecret'));
console.log('Rosie 883 original signed scheduler step ledger, bounded readback, owner renewal, external anchor recovery and mirrored owner UX: PASS');
