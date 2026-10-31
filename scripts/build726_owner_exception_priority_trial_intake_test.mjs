import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor726 as f} from './build725_handoff_reconciliation_aging_readiness_test.mjs';
import {ownerHandoffExceptionFollowup726,witnessConflictPriorityQueue726,
  nonproductionTrialEvidenceGuardrails726} from '../assets/quote-followup-exceptions-v726.mjs';
import {witnessConflictAging725} from '../assets/quote-followup-reconciliation-v725.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const priorityReviewer='f7260000-0000-4000-8000-000000000001';
const intakeReviewer='f7260000-0000-4000-8000-000000000002';
const env={...f.env,
  ROSIE_EXPORT_WITNESS_PRIORITY_REVIEWER_STAFF_ID:priorityReviewer,
  ROSIE_LEDGER_NONPROD_EVIDENCE_INTAKE_REVIEWER_STAFF_ID:intakeReviewer};
const verify=(receipt,kind,build)=>f.verify(receipt,kind,build);
const reconciled=await verify(f.reconciled,'rosie_private_owner_handoff_receipt_reconciliation',725);
// A locally signed reference from 96 hours ago, aged now (no future-dated claims).
const oldConflict=await verify({...f.conflict.receipt,
  reviewed_at:new Date(f.now.getTime()-96*3600000).toISOString()},
  'rosie_witness_reference_conflict_review',724);
const overdueReceipt=witnessConflictAging725(oldConflict,f.identityReceipt,f.provenance,
  f.actor(f.aging),env,f.agingPolicy,f.now);
const overdue=await verify(overdueReceipt,'rosie_witness_reference_conflict_aging',725);
const readiness=await verify(f.readiness,'rosie_nonproduction_retention_trial_readiness_review',725);
assert.ok(reconciled.ok&&overdue.ok&&readiness.ok);

const ownerPolicy={decision:'request_external_handoff_receipt',review_note:f.note,
  acknowledge_no_authenticated_external_delivery:true};
const followup=ownerHandoffExceptionFollowup726(reconciled,f.handoff,f.checklist,
  f.actor(f.owner),env,ownerPolicy,f.now);
assert.equal(followup.status,'OWNER_HANDOFF_EXCEPTION_EXTERNAL_RECEIPT_PENDING_HELD');
assert.equal(followup.genuine_external_receipt_received,false);
assert.equal(followup.external_notification_sent,false);
assert.equal(ownerHandoffExceptionFollowup726(reconciled,f.handoff,f.checklist,
  f.actor(f.execution),env,ownerPolicy,f.now),null);
assert.equal(ownerHandoffExceptionFollowup726({...reconciled,receipt:{...reconciled.receipt,
  signed_handoff_sha256:f.digest('mutated')}},f.handoff,f.checklist,
  f.actor(f.owner),env,ownerPolicy,f.now),null);
assert.equal(ownerHandoffExceptionFollowup726(reconciled,f.handoff,f.checklist,
  f.actor(f.owner),env,{...ownerPolicy,acknowledge_no_authenticated_external_delivery:false},f.now),null);
assert.equal(ownerHandoffExceptionFollowup726(reconciled,f.handoff,f.checklist,
  f.actor(f.owner),env,{...ownerPolicy,decision:'defer_followup'},f.now).status,
  'OWNER_HANDOFF_EXCEPTION_FOLLOWUP_DEFERRED');

const priorityPolicy={decision:'request_independent_priority_review',review_note:f.note,
  acknowledge_local_priority_only:true};
const priority=witnessConflictPriorityQueue726(overdue,oldConflict,f.identityReceipt,
  f.actor(priorityReviewer),env,priorityPolicy,f.now);
assert.equal(priority.status,'WITNESS_PRIORITY_QUEUED_LOCAL_ONLY_EXTERNAL_IDENTITY_HELD');
assert.equal(priority.priority,'urgent');
assert.equal(priority.queue_mode,'ON_DEMAND_SIGNED_ITEM_NO_PERSISTENCE');
assert.equal(priority.custody_approved,false);
const fresh=await verify(f.freshMatch,'rosie_witness_reference_conflict_aging',725);
assert.equal(witnessConflictPriorityQueue726(fresh,f.reference,f.identityReceipt,
  f.actor(priorityReviewer),env,priorityPolicy,f.now).priority,'review');
assert.equal(witnessConflictPriorityQueue726(overdue,oldConflict,f.identityReceipt,
  f.actor(f.aging),env,priorityPolicy,f.now),null);
assert.equal(witnessConflictPriorityQueue726({...overdue,receipt:{...overdue.receipt,
  witness_reference_conflict_detected:false}},oldConflict,f.identityReceipt,
  f.actor(priorityReviewer),env,priorityPolicy,f.now),null);
assert.equal(witnessConflictPriorityQueue726(overdue,oldConflict,f.identityReceipt,
  f.actor(priorityReviewer),env,{...priorityPolicy,acknowledge_local_priority_only:false},f.now),null);

const intakePolicy={source_type:'backup_retention_inventory',source_reference_id:'source-review:fixture-726',
  source_sha256:f.digest('unverified-metadata-only'),decision:'request_independent_provenance',
  review_note:f.note,acknowledge_unverified_metadata_only:true};
const intake=nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),env,intakePolicy,f.now);
assert.equal(intake.status,'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_UNVERIFIED_HELD');
assert.equal(intake.metadata_only,true);assert.equal(intake.authentic_source_verified,false);
assert.equal(intake.independent_approval_received,false);assert.equal(intake.sql_executed,false);
assert.equal(intake.actual_records_deleted,0);
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(f.owner),env,intakePolicy,f.now),null);
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),{...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  intakePolicy,f.now),null);
for(const bad of ['https://external.invalid/identity','person@example.com','real name',
  '../document.json','<script>'])assert.equal(nonproductionTrialEvidenceGuardrails726(
    readiness,f.purge,f.handoff,f.actor(intakeReviewer),env,
    {...intakePolicy,source_reference_id:bad},f.now),null);
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),env,{...intakePolicy,source_sha256:'bad'},f.now),null);
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),env,{...intakePolicy,review_note:'person@example.com'},f.now),null);
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),env,{...intakePolicy,decision:'quarantine'},f.now).status,
  'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_QUARANTINED');
assert.equal(nonproductionTrialEvidenceGuardrails726(readiness,f.purge,f.handoff,
  f.actor(intakeReviewer),env,{...intakePolicy,acknowledge_unverified_metadata_only:false},f.now),null);

// Real signing API with synthetically authenticated admin sessions: GET-only, no external sends.
const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const ids=[f.owner,priorityReviewer,intakeReviewer,f.aging];
const hashes=Object.fromEntries(ids.map(id=>[f.digest('fixture-'+id),id]));
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected Build 726 write');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected auth source');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(f.now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const upload=async item=>f.sign(item.receipt);
try{
  let r=await onRequestPost({request:request(f.owner,{
    action:'followup_owner_handoff_exception',signed_reconciliation:await upload(reconciled),
    signed_handoff:await upload(f.handoff),signed_checklist:await upload(f.checklist),
    ...ownerPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.independent_approval_received,false);
  r=await onRequestPost({request:request(priorityReviewer,{
    action:'review_witness_conflict_priority',signed_aging:await upload(overdue),
    signed_reference:await upload(oldConflict),signed_identity:await upload(f.identityReceipt),
    ...priorityPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.priority,'urgent');
  r=await onRequestPost({request:request(intakeReviewer,{
    action:'review_nonproduction_trial_evidence_intake',signed_readiness:await upload(readiness),
    signed_purge:await upload(f.purge),signed_handoff:await upload(f.handoff),
    ...intakePolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.document_uploaded,false);
  r=await onRequestPost({request:request(f.aging,{
    action:'review_witness_conflict_priority',signed_aging:await upload(overdue),
    signed_reference:await upload(oldConflict),signed_identity:await upload(f.identityReceipt),
    ...priorityPolicy}),env:apiEnv});
  assert.equal(r.status,409);
  r=await onRequestPost({request:request(intakeReviewer,{
    action:'review_nonproduction_trial_evidence_intake',signed_readiness:await upload(readiness),
    signed_purge:await upload(f.purge),signed_handoff:await upload(f.handoff),
    ...intakePolicy,source_reference_id:'https://not-evidence.invalid'}),env:apiEnv});
  assert.equal(r.status,409);
  assert.ok(reads>=5);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['ledgerHandoffReconcileReceipt726','ledgerHandoffExceptionDecision726',
  'ledgerHandoffExceptionNote726','ledgerHandoffNoDelivery726','ledgerHandoffException726',
  'witnessAgingReceipt726','witnessPriorityDecision726','witnessPriorityNote726',
  'witnessPriorityLocalOnly726','witnessPriorityReview726','trialReadinessReceipt726',
  'trialEvidenceType726','trialEvidenceRef726','trialEvidenceHash726',
  'trialEvidenceDecision726','trialEvidenceNote726','trialEvidenceMetadataOnly726',
  'trialEvidenceReview726'])assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const method of ['followupOwnerException726','reviewWitnessPriority726','reviewTrialEvidence726'])
  assert.match(client,new RegExp(method));
assert.match(html,/admin-followup-workload-v726\.css/);
assert.match(read('assets/admin-followup-workload-v726.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build726_owner_exception_priority_trial_intake_test\.mjs/);
console.log('Build 726 PASS: owner exception follow-up, independently scoped local witness priority, metadata-only trial intake, no writes, no external approval');
// Disposable signed fixtures for successor on-demand audit tests, never external evidence.
export const fixtureFor727={...f,priorityReviewer,intakeReviewer,env,
  reconciled,oldConflict,overdue,readiness,followup,priority,intake,
  ownerPolicy,priorityPolicy,intakePolicy};
