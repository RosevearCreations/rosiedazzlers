import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor727 as f} from './build726_owner_exception_priority_trial_intake_test.mjs';
import {ownerExceptionEvidenceFollowup727,witnessPriorityDispositionAudit727,
  trialSourceProvenanceRecheck727} from '../assets/quote-followup-audit-v727.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const auditor='f7270000-0000-4000-8000-000000000001';
const provenance='f7270000-0000-4000-8000-000000000002';
const env={...f.env,
  ROSIE_EXPORT_WITNESS_DISPOSITION_AUDITOR_STAFF_ID:auditor,
  ROSIE_LEDGER_NONPROD_PROVENANCE_RECHECK_REVIEWER_STAFF_ID:provenance};
const verify=(item,kind,build)=>f.verify(item,kind,build);
const signedException=await verify(f.followup,'rosie_owner_handoff_exception_followup',726);
const signedPriority=await verify(f.priority,'rosie_witness_conflict_priority_queue',726);
const signedIntake=await verify(f.intake,'rosie_nonproduction_trial_evidence_intake_guardrails',726);
assert.ok(signedException.ok&&signedPriority.ok&&signedIntake.ok);

const ownerPolicy={decision:'flag_authentic_receipt_missing',local_response_window_hours:24,
  review_note:f.note,acknowledge_no_external_receipt_or_delivery:true};
const exception=ownerExceptionEvidenceFollowup727(signedException,f.reconciled,f.handoff,
  f.actor(f.owner),env,ownerPolicy,f.now);
assert.equal(exception.status,'OWNER_EXCEPTION_FOLLOWUP_QUEUE_EXTERNAL_EVIDENCE_HELD');
assert.equal(exception.local_followup_priority,'open');
assert.equal(exception.queue_mode,'ON_DEMAND_LOCAL_SIGNED_ITEM_NO_PERSISTENCE');
assert.equal(exception.genuine_external_receipt_received,false);
assert.equal(exception.external_message_sent,false);
assert.equal(ownerExceptionEvidenceFollowup727(signedException,f.reconciled,f.handoff,
  f.actor(f.execution),env,ownerPolicy,f.now),null);
assert.equal(ownerExceptionEvidenceFollowup727({...signedException,receipt:{...signedException.receipt,
  signed_reconciliation_sha256:f.digest('wrong ancestor')}},f.reconciled,f.handoff,
  f.actor(f.owner),env,ownerPolicy,f.now),null);
assert.equal(ownerExceptionEvidenceFollowup727(signedException,f.reconciled,f.handoff,
  f.actor(f.owner),env,{...ownerPolicy,local_response_window_hours:1},f.now),null);
assert.equal(ownerExceptionEvidenceFollowup727(signedException,f.reconciled,f.handoff,
  f.actor(f.owner),env,{...ownerPolicy,decision:'defer_exception'},f.now).status,
  'OWNER_EXCEPTION_FOLLOWUP_QUEUE_DEFERRED');
assert.equal(ownerExceptionEvidenceFollowup727(signedException,f.reconciled,f.handoff,
  f.actor(f.owner),env,ownerPolicy,new Date(f.now.getTime()+25*3600000)).local_followup_priority,
  'overdue');

const auditPolicy={decision:'flag_missing_independent_disposition',review_note:f.note,
  acknowledge_no_real_witness_disposition:true};
const audit=witnessPriorityDispositionAudit727(signedPriority,f.overdue,f.oldConflict,
  f.actor(auditor),env,auditPolicy,f.now);
assert.equal(audit.status,'WITNESS_PRIORITY_AUDIT_EXTERNAL_DISPOSITION_MISSING_HELD');
assert.equal(audit.audited_local_priority,'urgent');
assert.equal(audit.authentic_disposition_received,false);
assert.equal(audit.independent_human_identity_verified,false);
assert.equal(witnessPriorityDispositionAudit727(signedPriority,f.overdue,f.oldConflict,
  f.actor(f.priorityReviewer),env,auditPolicy,f.now),null);
assert.equal(witnessPriorityDispositionAudit727({...signedPriority,receipt:{...signedPriority.receipt,
  signed_aging_sha256:f.digest('tampersource')}},f.overdue,f.oldConflict,
  f.actor(auditor),env,auditPolicy,f.now),null);
assert.equal(witnessPriorityDispositionAudit727(signedPriority,f.overdue,f.oldConflict,
  f.actor(auditor),env,{...auditPolicy,acknowledge_no_real_witness_disposition:false},f.now),null);
assert.equal(witnessPriorityDispositionAudit727(signedPriority,f.overdue,f.oldConflict,
  f.actor(auditor),env,{...auditPolicy,decision:'reject_audit'},f.now).status,
  'WITNESS_PRIORITY_DISPOSITION_AUDIT_REJECTED');

const provenancePolicy={observed_source_reference_id:f.intakePolicy.source_reference_id,
  observed_source_sha256:f.intakePolicy.source_sha256,
  decision:'compare_local_metadata',review_note:f.note,
  acknowledge_metadata_is_not_external_provenance:true};
const recheck=trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(provenance),env,provenancePolicy,f.now);
assert.equal(recheck.status,'TRIAL_SOURCE_METADATA_MATCH_EXTERNAL_PROVENANCE_HELD');
assert.equal(recheck.local_metadata_integrity_matches,true);
assert.equal(recheck.authentic_external_provenance_verified,false);
assert.equal(recheck.cryptographic_original_artifact_verified,false);
assert.equal(recheck.independent_approval_received,false);
assert.equal(recheck.actual_records_deleted,0);
assert.equal(trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(provenance),env,{...provenancePolicy,observed_source_sha256:f.digest('drift')},
  f.now).status,'TRIAL_SOURCE_METADATA_DRIFT_QUARANTINED');
assert.equal(trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(f.intakeReviewer),env,provenancePolicy,f.now),null);
assert.equal(trialSourceProvenanceRecheck727({...signedIntake,receipt:{...signedIntake.receipt,
  signed_readiness_sha256:f.digest('wrong parent')}},f.readiness,f.handoff,
  f.actor(provenance),env,provenancePolicy,f.now),null);
assert.equal(trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(provenance),env,{...provenancePolicy,observed_source_reference_id:'https://unsafe.invalid'},
  f.now),null);
assert.equal(trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(provenance),env,{...provenancePolicy,acknowledge_metadata_is_not_external_provenance:false},
  f.now),null);
assert.equal(trialSourceProvenanceRecheck727(signedIntake,f.readiness,f.handoff,
  f.actor(provenance),{...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  provenancePolicy,f.now),null);

// Real API wiring with synthetic, GET-only staff sessions. Every receipt remains HELD.
const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const ids=[f.owner,auditor,provenance,f.intakeReviewer];
const hashes=Object.fromEntries(ids.map(id=>[f.digest('fixture-'+id),id]));
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected Build 727 write');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected staff lookup');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(f.now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const upload=async result=>f.sign(result.receipt);
try{
  let r=await onRequestPost({request:request(f.owner,{
    action:'followup_owner_exception_evidence',signed_exception:await upload(signedException),
    signed_reconciliation:await upload(f.reconciled),signed_handoff:await upload(f.handoff),
    ...ownerPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.external_message_sent,false);
  r=await onRequestPost({request:request(auditor,{
    action:'audit_witness_priority_disposition',signed_priority:await upload(signedPriority),
    signed_aging:await upload(f.overdue),signed_reference:await upload(f.oldConflict),
    ...auditPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.custody_approved,false);
  r=await onRequestPost({request:request(provenance,{
    action:'recheck_trial_source_provenance',signed_intake:await upload(signedIntake),
    signed_readiness:await upload(f.readiness),signed_handoff:await upload(f.handoff),
    ...provenancePolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.authentic_external_provenance_verified,false);
  r=await onRequestPost({request:request(f.intakeReviewer,{
    action:'recheck_trial_source_provenance',signed_intake:await upload(signedIntake),
    signed_readiness:await upload(f.readiness),signed_handoff:await upload(f.handoff),
    ...provenancePolicy}),env:apiEnv});
  assert.equal(r.status,409);
  assert.ok(reads>=4);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['ledgerExceptionReceipt727','ledgerExceptionWindow727',
  'ledgerExceptionDecision727','ledgerExceptionNote727','ledgerExceptionNoReceipt727',
  'ledgerExceptionReview727','witnessPriorityReceipt727','witnessAuditDecision727',
  'witnessAuditNote727','witnessAuditNoDisposition727','witnessAuditReview727',
  'trialIntakeReceipt727','trialObservedRef727','trialObservedHash727',
  'trialProvenanceDecision727','trialProvenanceNote727','trialNoExternalProvenance727',
  'trialProvenanceReview727'])assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const method of ['followupOwnerException727','auditWitnessPriority727','recheckTrialProvenance727'])
  assert.match(client,new RegExp(method));
assert.match(html,/admin-followup-workload-v727\.css/);
assert.match(read('assets/admin-followup-workload-v727.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build727_exception_queue_witness_audit_provenance_test\.mjs/);
console.log('Build 727 PASS: signed original owner exception follow-up, separate witness priority audit, nonproduction local provenance drift quarantine, zero writes and external approvals');
// Synthetic signed-lineage fixtures for Build 728. No genuine external proof.
export const fixtureFor728={...f,auditor,provenance,env,
  signedException,signedPriority,signedIntake,exception,audit,recheck,
  ownerPolicy,auditPolicy,provenancePolicy};
