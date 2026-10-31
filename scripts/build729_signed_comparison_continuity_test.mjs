import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor728 as f} from './build727_exception_queue_witness_audit_provenance_test.mjs';
import {ownerFollowupAgingReview728,witnessAuditExceptionReview728,
  nonproductionProvenanceGapTracking728} from '../assets/quote-followup-gaps-v728.mjs';
import {ownerAgingDelta729,witnessExceptionContinuity729,
  nonproductionGapDrift729} from '../assets/quote-followup-comparison-v729.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const witnessId='f7280000-0000-4000-8000-000000000001';
const gapId='f7280000-0000-4000-8000-000000000002';
const env={...f.env,
  ROSIE_EXPORT_WITNESS_AUDIT_EXCEPTION_REVIEWER_STAFF_ID:witnessId,
  ROSIE_LEDGER_NONPROD_EVIDENCE_GAP_REVIEWER_STAFF_ID:gapId};
const queue=await f.verify(f.exception,'rosie_owner_exception_evidence_followup_queue',727);
const audit=await f.verify(f.audit,'rosie_witness_priority_disposition_audit',727);
const recheck=await f.verify(f.recheck,'rosie_nonproduction_trial_source_provenance_recheck',727);
assert.ok(queue.ok&&audit.ok&&recheck.ok);
const at=(seconds)=>new Date(f.now.getTime()+seconds*1000);
const policy={acknowledge_local_comparison_only:true,review_note:f.note};
const ownerPolicy={decision:'flag_aged_external_receipt_gap',review_window_hours:24,
  acknowledge_local_receipt_age_only:true,review_note:f.note};
const witnessPolicy={decision:'flag_external_resolution_missing',
  acknowledge_no_original_external_witness_resolution:true,review_note:f.note};
const gapPolicy={decision:'request_original_provenance',
  acknowledge_gaps_not_live_verification:true,review_note:f.note};

const ownerA=ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,ownerPolicy,at(20));
const ownerB=ownerFollowupAgingReview728(queue,f.signedException,f.reconciled,
  f.actor(f.owner),env,ownerPolicy,at(60));
const witnessA=witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(witnessId),env,witnessPolicy,at(20));
const witnessB=witnessAuditExceptionReview728(audit,f.signedPriority,f.overdue,
  f.actor(witnessId),env,{...witnessPolicy,decision:'defer_exception'},at(60));
const gapA=nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapId),env,gapPolicy,at(20));
const gapB=nonproductionProvenanceGapTracking728(recheck,f.signedIntake,f.readiness,
  f.actor(gapId),env,{...gapPolicy,decision:'quarantine_gaps'},at(60));
assert.ok(ownerA&&ownerB&&witnessA&&witnessB&&gapA&&gapB);

const verified=(r,kind)=>f.verify(r,kind,728);
const [oa,ob,wa,wb,ga,gb]=await Promise.all([
  verified(ownerA,'rosie_owner_followup_aging_review'),
  verified(ownerB,'rosie_owner_followup_aging_review'),
  verified(witnessA,'rosie_witness_audit_exception_review'),
  verified(witnessB,'rosie_witness_audit_exception_review'),
  verified(gapA,'rosie_nonproduction_provenance_evidence_gap_tracking'),
  verified(gapB,'rosie_nonproduction_provenance_evidence_gap_tracking')]);
assert.ok([oa,ob,wa,wb,ga,gb].every(x=>x.ok));
const owner=ownerAgingDelta729(oa,ob,queue,f.actor(f.owner),env,policy,at(70));
assert.equal(owner.local_age_delta_hours,0);
assert.equal(owner.authentic_delivery_verified,false);
assert.equal(ownerAgingDelta729(ob,oa,queue,f.actor(f.owner),env,policy,at(70)),null);
assert.equal(ownerAgingDelta729(oa,ob,queue,f.actor(f.execution),env,policy,at(70)),null);
assert.equal(ownerAgingDelta729(oa,{...ob,receipt:{...ob.receipt,
  local_queue_age_hours:999}},queue,f.actor(f.owner),env,policy,at(70)),null);
assert.equal(ownerAgingDelta729(oa,ob,queue,f.actor(f.owner),env,
  {...policy,acknowledge_local_comparison_only:false},at(70)),null);

const witness=witnessExceptionContinuity729(wa,wb,audit,f.actor(witnessId),env,
  policy,at(70));
assert.equal(witness.decision_changed,true);
assert.equal(witness.authentic_witness_identity_verified,false);
assert.equal(witnessExceptionContinuity729(wa,wb,audit,f.actor(f.auditor),env,policy,at(70)),null);
assert.equal(witnessExceptionContinuity729(wa,{...wb,receipt:{...wb.receipt,
  witness_identity_verified:true}},audit,f.actor(witnessId),env,policy,at(70)),null);
const gap=nonproductionGapDrift729(ga,gb,recheck,f.actor(gapId),env,policy,at(70));
assert.equal(gap.decision_changed,true);
assert.equal(gap.gaps_still_unresolved.length,5);
assert.equal(gap.actual_records_deleted,0);
assert.equal(nonproductionGapDrift729(ga,gb,recheck,f.actor(f.provenance),env,policy,at(70)),null);
assert.equal(nonproductionGapDrift729(ga,{...gb,receipt:{...gb.receipt,
  external_provenance_verified:true}},recheck,f.actor(gapId),env,policy,at(70)),null);

// Full API path: original signed envelopes, authenticated synthetic GET-only
// sessions, and no writes or outside reviewers.
const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const ids=[f.owner,witnessId,gapId];
const hashes=Object.fromEntries(ids.map(id=>[f.digest('fixture-'+id),id]));
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected Build 729 write');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected staff source');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(Date.now()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const apiCases=[
  [f.owner,'compare_owner_aging_delta',ownerA,ownerB,queue],
  [witnessId,'compare_witness_exception_continuity',witnessA,witnessB,audit],
  [gapId,'compare_nonproduction_gap_drift',gapA,gapB,recheck]];
try{
  for(const [id,action,before,after,source] of apiCases){
    const body={action,signed_before:await f.sign(before),
      signed_after:await f.sign(after),signed_source:await f.sign(source.receipt),...policy};
    const response=await onRequestPost({request:request(id,body),env:apiEnv});
    assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
    const output=await response.json();
    assert.equal(output.receipt.proof_b_authorized,false);
    assert.equal(output.signed_receipt.signature_algorithm,'Ed25519');
    const swapped=await onRequestPost({request:request(id,{...body,
      signed_before:body.signed_after,signed_after:body.signed_before}),env:apiEnv});
    assert.equal(swapped.status,409);
    const mismatched=await onRequestPost({request:request(id,{...body,
      signed_source:await f.sign({...source.receipt,reviewed_at:at(1).toISOString()})}),env:apiEnv});
    assert.equal(mismatched.status,409);
  }
  assert.ok(reads>=9);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['ledgerDeltaBefore729','ledgerDeltaAfter729','ledgerDeltaNote729',
  'ledgerDeltaLocal729','ledgerDeltaReview729','ledgerDeltaStatus729',
  'witnessContinuityBefore729','witnessContinuityAfter729','witnessContinuityNote729',
  'witnessContinuityLocal729','witnessContinuityReview729','witnessContinuityStatus729',
  'trialDriftBefore729','trialDriftAfter729','trialDriftNote729','trialDriftLocal729',
  'trialDriftReview729','trialDriftStatus729'])assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const method of ['compareOwnerAging729','compareWitnessContinuity729',
  'compareTrialGapDrift729'])assert.match(client,new RegExp(method));
assert.match(html,/admin-followup-workload-v729\.css/);
assert.match(read('assets/admin-followup-workload-v729.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build729_signed_comparison_continuity_test\.mjs/);
console.log('Build 729 PASS: chronological signed comparisons, reviewer separation, unchanged ancestry, zero external approvals or writes');
