import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor728 as f} from './build727_exception_queue_witness_audit_provenance_test.mjs';
import {ownerFollowupAgingReview728,witnessAuditExceptionReview728,
  nonproductionProvenanceGapTracking728} from '../assets/quote-followup-gaps-v728.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const exceptionReviewer='f7280000-0000-4000-8000-000000000001';
const gapReviewer='f7280000-0000-4000-8000-000000000002';
const env={...f.env,
  ROSIE_EXPORT_WITNESS_AUDIT_EXCEPTION_REVIEWER_STAFF_ID:exceptionReviewer,
  ROSIE_LEDGER_NONPROD_EVIDENCE_GAP_REVIEWER_STAFF_ID:gapReviewer};
const verify=(item,kind,build)=>f.verify(item,kind,build);
const queue=await verify(f.exception,'rosie_owner_exception_evidence_followup_queue',727);
const audit=await verify(f.audit,'rosie_witness_priority_disposition_audit',727);
const recheck=await verify(f.recheck,'rosie_nonproduction_trial_source_provenance_recheck',727);
assert.ok(queue.ok&&audit.ok&&recheck.ok);

const ownerPolicy={decision:'flag_aged_external_receipt_gap',review_window_hours:24,
  acknowledge_local_receipt_age_only:true,review_note:f.note};
const owner=ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,ownerPolicy,f.now);
assert.equal(owner.status,'OWNER_FOLLOWUP_LOCAL_AGING_OPEN_EXTERNAL_RECEIPT_HELD');
assert.equal(owner.local_queue_age_hours,0);
assert.equal(owner.authentic_external_receipt_received,false);
assert.equal(owner.external_message_sent,false);
assert.equal(ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,ownerPolicy,new Date(f.now.getTime()+25*3600000)).status,
  'OWNER_FOLLOWUP_LOCAL_AGING_OVERDUE_EXTERNAL_RECEIPT_HELD');
assert.equal(ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.execution),env,ownerPolicy,f.now),null);
assert.equal(ownerFollowupAgingReview728({...queue,receipt:{...queue.receipt,
  signed_exception_sha256:f.digest('tampered')}},f.signedException,f.reconciled,
  f.actor(f.owner),env,ownerPolicy,f.now),null);
assert.equal(ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,{...ownerPolicy,review_window_hours:6},f.now),null);
assert.equal(ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,{...ownerPolicy,decision:'defer_aging'},f.now).status,
  'OWNER_FOLLOWUP_AGING_REVIEW_DEFERRED');
assert.equal(ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,{...ownerPolicy,acknowledge_local_receipt_age_only:false},f.now),null);

const witnessPolicy={decision:'flag_external_resolution_missing',review_note:f.note,
  acknowledge_no_original_external_witness_resolution:true};
const witness=witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(exceptionReviewer),env,witnessPolicy,f.now);
assert.equal(witness.status,'WITNESS_AUDIT_EXCEPTION_EXTERNAL_RESOLUTION_MISSING_HELD');
assert.equal(witness.exception_resolution,'PENDING_AUTHENTIC_EXTERNAL_EVIDENCE');
assert.equal(witness.genuine_independent_witness_disposition_received,false);
assert.equal(witness.witness_identity_verified,false);
assert.equal(witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(f.auditor),env,witnessPolicy,f.now),null);
assert.equal(witnessAuditExceptionReview728({...audit,receipt:{...audit.receipt,
  signed_priority_sha256:f.digest('wrong parent')}},f.signedPriority,f.overdue,
  f.actor(exceptionReviewer),env,witnessPolicy,f.now),null);
assert.equal(witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(exceptionReviewer),env,{...witnessPolicy,decision:'reject_exception'},f.now).status,
  'WITNESS_AUDIT_EXCEPTION_REJECTED');
assert.equal(witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(exceptionReviewer),env,{...witnessPolicy,acknowledge_no_original_external_witness_resolution:false},f.now),null);

const gapsPolicy={decision:'request_original_provenance',review_note:f.note,
  acknowledge_gaps_not_live_verification:true};
const gaps=nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapReviewer),env,gapsPolicy,f.now);
assert.equal(gaps.status,'NONPROD_PROVENANCE_EXTERNAL_EVIDENCE_GAPS_HELD');
assert.equal(gaps.original_local_metadata_match,true);
assert.equal(gaps.readiness_gaps.authentic_external_source_origin,true);
assert.equal(gaps.readiness_gaps.retention_backup_observation,true);
assert.equal(gaps.independent_approval_received,false);
assert.equal(gaps.actual_records_deleted,0);
assert.equal(nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(f.provenance),env,gapsPolicy,f.now),null);
assert.equal(nonproductionProvenanceGapTracking728({...recheck,receipt:{...recheck.receipt,
  signed_intake_sha256:f.digest('tampered')}},f.signedIntake,f.readiness,
  f.actor(gapReviewer),env,gapsPolicy,f.now),null);
assert.equal(nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapReviewer),{...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  gapsPolicy,f.now),null);
assert.equal(nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapReviewer),env,{...gapsPolicy,decision:'quarantine_gaps'},f.now).status,
  'NONPROD_PROVENANCE_GAPS_QUARANTINED');
assert.equal(nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapReviewer),env,{...gapsPolicy,acknowledge_gaps_not_live_verification:false},f.now),null);

// End-to-end signed server responses using synthetic GET-only staff sessions.
const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const ids=[f.owner,exceptionReviewer,gapReviewer,f.auditor];
const hashes=Object.fromEntries(ids.map(id=>[f.digest('fixture-'+id),id]));
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected Build 728 write');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected staff source');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(f.now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const upload=async item=>f.sign(item.receipt);
try{
  let r=await onRequestPost({request:request(f.owner,{
    action:'review_owner_followup_aging',signed_queue:await upload(queue),
    signed_exception:await upload(f.signedException),
    signed_reconciliation:await upload(f.reconciled),...ownerPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.ledger_activated,false);
  r=await onRequestPost({request:request(exceptionReviewer,{
    action:'review_witness_audit_exception',signed_audit:await upload(audit),
    signed_priority:await upload(f.signedPriority),signed_aging:await upload(f.overdue),
    ...witnessPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.custody_approved,false);
  r=await onRequestPost({request:request(gapReviewer,{
    action:'track_nonproduction_provenance_gaps',signed_recheck:await upload(recheck),
    signed_intake:await upload(f.signedIntake),
    signed_readiness:await upload(f.readiness),...gapsPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.external_provenance_verified,false);
  r=await onRequestPost({request:request(f.auditor,{
    action:'review_witness_audit_exception',signed_audit:await upload(audit),
    signed_priority:await upload(f.signedPriority),signed_aging:await upload(f.overdue),
    ...witnessPolicy}),env:apiEnv});
  assert.equal(r.status,409);
  assert.ok(reads>=4);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['ledgerQueueReceipt728','ledgerAgingWindow728',
  'ledgerAgingDecision728','ledgerAgingNote728','ledgerAgingLocalOnly728',
  'ledgerAgingReview728','witnessAuditReceipt728','witnessExceptionDecision728',
  'witnessExceptionNote728','witnessExceptionNotApproved728','witnessExceptionReview728',
  'trialRecheckReceipt728','trialGapDecision728','trialGapNote728',
  'trialGapNoVerification728','trialGapReview728'])assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const method of ['reviewOwnerAging728','reviewWitnessException728','reviewTrialGaps728'])
  assert.match(client,new RegExp(method));
assert.match(html,/admin-followup-workload-v728\.css/);
assert.match(read('assets/admin-followup-workload-v728.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build728_owner_aging_witness_exception_provenance_gaps_test\.mjs/);
console.log('Build 728 PASS: owner local aging, independent witness audit exception, nonproduction provenance gaps, no external approval or live writes');
