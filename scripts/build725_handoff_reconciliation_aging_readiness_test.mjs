import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor725 as f} from './build724_handoff_reference_purge_test.mjs';
import {witnessReferenceConflict724} from '../assets/quote-followup-handoff-v724.mjs';
import {reconcilePrivateOwnerHandoff725,witnessConflictAging725,
  nonproductionRetentionReadiness725} from '../assets/quote-followup-reconciliation-v725.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// Disposable fixtures, not live owner approvals, real witness identity or database evidence.
const aging='f7250000-0000-4000-8000-000000000001';
const trial='f7250000-0000-4000-8000-000000000002';
const env={...f.env,ROSIE_EXPORT_WITNESS_CONFLICT_AGING_REVIEWER_STAFF_ID:aging,
  ROSIE_LEDGER_NONPROD_TRIAL_READINESS_REVIEWER_STAFF_ID:trial,
  ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID:f.security};
const verify=(receipt,kind,build)=>f.verify(receipt,kind,build);
const handoff=await verify(f.packet,'rosie_owner_nonproduction_authorization_handoff',724);
const reference=await verify(f.match,'rosie_witness_reference_conflict_review',724);
const purge=await verify(f.purge,'rosie_retention_backup_purge_trial_preconditions',724);
assert.equal(handoff.ok,true);assert.equal(reference.ok,true);assert.equal(purge.ok,true);

const ownerPolicy={decision:'reconcile_private_handoff',review_note:f.note,
  acknowledge_no_private_delivery_or_external_receipt:true};
const reconciled=reconcilePrivateOwnerHandoff725(handoff,f.checklist,f.dry,f.gate,
  f.actor(f.owner),env,ownerPolicy,f.now);
assert.equal(reconciled.status,'OWNER_HANDOFF_RECEIPT_CHAIN_RECONCILED_EXTERNAL_APPROVAL_HELD');
assert.equal(reconciled.authentic_external_receipt_received,false);
assert.equal(reconciled.database_access_authorized,false);
assert.equal(reconcilePrivateOwnerHandoff725(handoff,f.checklist,f.dry,f.gate,
  f.actor(f.execution),env,ownerPolicy,f.now),null);
assert.equal(reconcilePrivateOwnerHandoff725(handoff,f.checklist,f.dry,f.gate,
  f.actor(f.owner),{...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  ownerPolicy,f.now),null);
assert.equal(reconcilePrivateOwnerHandoff725({...handoff,receipt:{...handoff.receipt,
  signed_dry_run_sha256:f.digest('altered')}},f.checklist,f.dry,f.gate,
  f.actor(f.owner),env,ownerPolicy,f.now),null);
assert.equal(reconcilePrivateOwnerHandoff725(handoff,f.checklist,f.dry,f.gate,
  f.actor(f.owner),env,{...ownerPolicy,acknowledge_no_private_delivery_or_external_receipt:false},
  f.now),null);
assert.equal(reconcilePrivateOwnerHandoff725(handoff,f.checklist,f.dry,f.gate,
  f.actor(f.owner),env,{...ownerPolicy,decision:'reject_reconciliation'},f.now).status,
  'OWNER_HANDOFF_RECEIPT_RECONCILIATION_REJECTED');

const agingPolicy={decision:'request_external_resolution',response_window_hours:72,
  acknowledge_age_is_local_receipt_only:true,review_note:f.note};
const freshMatch=witnessConflictAging725(reference,f.identityReceipt,f.provenance,
  f.actor(aging),env,agingPolicy,f.now);
assert.equal(freshMatch.status,'WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD');
assert.equal(freshMatch.local_review_age_hours,0);
const conflictReceipt=witnessReferenceConflict724(f.identityReceipt,f.provenance,f.exception,
  f.actor(f.reference),env,{...f.referencePolicy,
    observed_witness_id:'conflicting-fixture-reference'},f.now);
const conflict=await verify(conflictReceipt,'rosie_witness_reference_conflict_review',724);
const aged=new Date(f.now.getTime()+96*3600000);
const overdue=witnessConflictAging725(conflict,f.identityReceipt,f.provenance,
  f.actor(aging),env,agingPolicy,aged);
assert.equal(overdue.status,'WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD');
assert.equal(overdue.local_review_age_hours,96);
assert.equal(overdue.independently_verified_external_witness_identity,false);
assert.equal(overdue.external_message_sent,false);
assert.equal(witnessConflictAging725(conflict,f.identityReceipt,f.provenance,
  f.actor(aging),env,{...agingPolicy,response_window_hours:168},aged).status,
  'WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD');
assert.equal(witnessConflictAging725(conflict,f.identityReceipt,f.provenance,
  f.actor(f.reference),env,agingPolicy,aged),null);
assert.equal(witnessConflictAging725({...conflict,receipt:{...conflict.receipt,
  witness_id_reference_matches:true}},f.identityReceipt,f.provenance,
  f.actor(aging),env,agingPolicy,aged),null);
assert.equal(witnessConflictAging725(conflict,f.identityReceipt,f.provenance,
  f.actor(aging),env,{...agingPolicy,response_window_hours:1},aged),null);
assert.equal(witnessConflictAging725(conflict,f.identityReceipt,f.provenance,
  f.actor(aging),env,{...agingPolicy,acknowledge_age_is_local_receipt_only:false},aged),null);

const readinessPolicy={decision:'request_independent_readiness_review',
  acknowledge_no_live_trial_or_external_approval:true,review_note:f.note};
const readiness=nonproductionRetentionReadiness725(handoff,purge,f.expiry,f.reconciliation,
  f.actor(trial),env,readinessPolicy,f.now);
assert.equal(readiness.status,'NONPRODUCTION_RETENTION_TRIAL_GAPS_DOCUMENTED_EXTERNAL_APPROVAL_HELD');
assert.equal(readiness.readiness_gaps.real_row_retention_and_backup_purge_observation,true);
assert.equal(readiness.external_approval_received,false);
assert.equal(readiness.actual_records_deleted,0);
assert.equal(nonproductionRetentionReadiness725(handoff,purge,f.expiry,f.reconciliation,
  f.actor(f.owner),env,readinessPolicy,f.now),null);
assert.equal(nonproductionRetentionReadiness725(handoff,purge,f.expiry,f.reconciliation,
  f.actor(trial),{...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  readinessPolicy,f.now),null);
assert.equal(nonproductionRetentionReadiness725(handoff,{...purge,receipt:{...purge.receipt,
  original_signed_expiry_sha256:f.digest('wrong source')}},f.expiry,f.reconciliation,
  f.actor(trial),env,readinessPolicy,f.now),null);
assert.equal(nonproductionRetentionReadiness725(handoff,purge,f.expiry,f.reconciliation,
  f.actor(trial),env,{...readinessPolicy,acknowledge_no_live_trial_or_external_approval:false},
  f.now),null);
assert.equal(nonproductionRetentionReadiness725(handoff,purge,f.expiry,f.reconciliation,
  f.actor(trial),env,{...readinessPolicy,decision:'reject_readiness'},f.now).status,
  'NONPRODUCTION_RETENTION_TRIAL_READINESS_REJECTED');

// End-to-end authorized POSTs only read staff session; never write external evidence.
const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const hashes=Object.fromEntries([f.owner,aging,trial,f.reference].map(id=>[f.digest('fixture-'+id),id]));
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Build 725 wrote to a database.');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected session source');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(f.now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const upload=async receipt=>f.sign(receipt.receipt);
try{
  let r=await onRequestPost({request:request(f.owner,{
    action:'reconcile_private_owner_handoff',
    signed_handoff:await upload(handoff),signed_checklist:await upload(f.checklist),
    signed_dry_run:await upload(f.dry),signed_gate:await upload(f.gate),...ownerPolicy}),
  env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.packet_delivered_to_external_custodian,false);
  r=await onRequestPost({request:request(aging,{
    action:'review_witness_conflict_aging',signed_reference:await upload(conflict),
    signed_identity:await upload(f.identityReceipt),
    signed_provenance:await upload(f.provenance),...agingPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.custody_approved,false);
  r=await onRequestPost({request:request(trial,{
    action:'review_nonproduction_retention_readiness',
    signed_handoff:await upload(handoff),signed_purge:await upload(purge),
    signed_expiry:await upload(f.expiry),
    signed_reconciliation:await upload(f.reconciliation),...readinessPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.sql_executed,false);
  r=await onRequestPost({request:request(f.reference,{
    action:'review_witness_conflict_aging',signed_reference:await upload(conflict),
    signed_identity:await upload(f.identityReceipt),
    signed_provenance:await upload(f.provenance),...agingPolicy}),env:apiEnv});
  assert.equal(r.status,409);
  r=await onRequestPost({request:request(f.owner,{
    action:'review_nonproduction_retention_readiness',
    signed_handoff:await upload(handoff),signed_purge:await upload(purge),
    signed_expiry:await upload(f.expiry),
    signed_reconciliation:await upload(f.reconciliation),...readinessPolicy}),env:apiEnv});
  assert.equal(r.status,409);
  assert.ok(reads>=5);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['witnessReferenceReceipt725','witnessAgingWindow725',
  'witnessAgingDecision725','witnessAgingNote725','witnessAgingNotIdentity725',
  'witnessAgingReview725','ledgerOwnerHandoffReceipt725','ledgerHandoffReconcileDecision725',
  'ledgerHandoffReconcileNote725','ledgerNoDelivery725','ledgerHandoffReconcile725',
  'trialHandoffReceipt725','trialPurgeReceipt725','trialReadinessDecision725',
  'trialReadinessNote725','trialNoLiveApproval725','trialReadinessReview725'])
  assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const method of ['reconcileOwnerHandoff725','reviewWitnessAging725','reviewTrialReadiness725'])
  assert.match(client,new RegExp(method));
assert.match(html,/admin-followup-workload-v725\.css/);
assert.match(read('assets/admin-followup-workload-v725.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build725_handoff_reconciliation_aging_readiness_test\.mjs/);
console.log('Build 725 PASS: owner signed handoff lineage, local witness-aging conflict windows, independent retention readiness, zero writes or external approvals');
