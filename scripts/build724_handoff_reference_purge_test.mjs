import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {signEvidenceReceipt716} from '../assets/quote-followup-signature-v716.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {verifyScopedSignedReceipt722} from '../assets/quote-followup-ledger-v722.mjs';
import {NONPRODUCTION_LEDGER_SQL723} from '../assets/quote-followup-authorization-v723.mjs';
import {ownerAuthorizationHandoff724,witnessReferenceConflict724,
  retentionBackupPurgeTrial724} from '../assets/quote-followup-handoff-v724.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// Synthetic fixtures are NOT independent approval, database evidence or actual owner action.
const now=new Date();
const owner='f7240000-0000-4000-8000-000000000001';
const execution='f7240000-0000-4000-8000-000000000002';
const security='f7240000-0000-4000-8000-000000000003';
const identity='f7240000-0000-4000-8000-000000000004';
const reference='f7240000-0000-4000-8000-000000000005';
const rotation='f7240000-0000-4000-8000-000000000006';
const custody='f7240000-0000-4000-8000-000000000007';
const signer='f7240000-0000-4000-8000-000000000008';
const digest=text=>createHash('sha256').update(text).digest('hex');
const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(
  await webcrypto.subtle.exportKey('jwk',key.privateKey)),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'fixture-build724',
  ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signer,
  ROSIE_LEDGER_NONPROD_PROJECT_REF:'disposablefixturebuild724',
  ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID:execution,
  ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:custody,
  ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID:rotation,
  ROSIE_EXPORT_WITNESS_IDENTITY_REVIEWER_STAFF_ID:identity,
  ROSIE_EXPORT_WITNESS_REFERENCE_REVIEWER_STAFF_ID:reference,
  SUPABASE_URL:'https://productionfixture.supabase.co'};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
const sign=r=>signEvidenceReceipt716(r,env,webcrypto);
const verify=async(r,kind,build)=>verifyScopedSignedReceipt722(await sign(r),kind,build,
  env,audit,webcrypto,now);
const actor=id=>({id,role_code:'admin'});
const note='Synthetic private review only, without independent approval or any live operation.';
const gate=await verify({kind:'rosie_owner_evidence_ledger_approval_gate',build:720,
  reviewed_at:now.toISOString(),status:'LEDGER_APPROVAL_GATE_HELD',
  owner_admin_staff_user_id:owner,signed_owner_request_sha256:digest('original owner request'),
  ledger_activated:false,proof_b_authorized:false},
  'rosie_owner_evidence_ledger_approval_gate',720);
const dry=await verify({kind:'rosie_private_ledger_schema_dry_run_review',build:722,
  reviewed_at:now.toISOString(),status:'PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD',
  security_reviewer_staff_user_id:security,signed_original_gate_sha256:gate.receipt_sha256,
  original_owner_request_sha256:gate.receipt.signed_owner_request_sha256,
  signed_security_review_sha256:digest('security review'),sql_executed:false,
  proof_b_authorized:false},'rosie_private_ledger_schema_dry_run_review',722);
const checklist=await verify({kind:'rosie_nonproduction_ledger_execution_authorization_checklist',
  build:723,reviewed_at:now.toISOString(),
  status:'NONPRODUCTION_LEDGER_EXECUTION_AUTHORIZATION_CHECKLIST_HELD',
  execution_reviewer_staff_user_id:execution,
  signed_dry_run_receipt_sha256:dry.receipt_sha256,
  signed_owner_gate_sha256:gate.receipt_sha256,
  signed_security_review_sha256:dry.receipt.signed_security_review_sha256,
  nonproduction_project_ref:env.ROSIE_LEDGER_NONPROD_PROJECT_REF,
  sql_artifact:{script:'docs/schema/build722_private_ledger_rollback_dry_run.sql',
    sha256:NONPRODUCTION_LEDGER_SQL723.sha256,transaction_end:'ROLLBACK'},
  checklist:{sql_execution_approved:false},connected_to_database:false,sql_executed:false,
  ledger_activated:false,proof_b_authorized:false},
  'rosie_nonproduction_ledger_execution_authorization_checklist',723);
const ownerPolicy={decision:'prepare_private_owner_handoff',review_note:note,
  acknowledge_private_transfer_only:true};
const packet=ownerAuthorizationHandoff724(checklist,dry,gate,actor(owner),env,ownerPolicy,now);
assert.equal(packet.status,'OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD');
assert.equal(packet.external_authorization_received,false);
assert.equal(packet.protected_file_transmitted,false);
assert.equal(ownerAuthorizationHandoff724(checklist,dry,gate,actor(execution),env,ownerPolicy,now),null);
assert.equal(ownerAuthorizationHandoff724(checklist,dry,gate,actor(owner),
  {...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},ownerPolicy,now),null);
assert.equal(ownerAuthorizationHandoff724({...checklist,receipt:{...checklist.receipt,
  signed_dry_run_receipt_sha256:digest('tampered')}},dry,gate,actor(owner),env,ownerPolicy,now),null);
assert.equal(ownerAuthorizationHandoff724(checklist,dry,gate,actor(owner),env,
  {...ownerPolicy,acknowledge_private_transfer_only:false},now),null);
assert.equal(ownerAuthorizationHandoff724(checklist,dry,gate,actor(owner),env,
  {...ownerPolicy,decision:'reject_owner_handoff'},now).status,'OWNER_NONPROD_HANDOFF_REJECTED');

const exception=await verify({kind:'rosie_rotated_custody_receipt_exception',build:721,
  checked_at:now.toISOString(),status:'PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD',
  witness_id:'fixture-independent-witness',witness_payload_sha256:digest('witness payload'),
  subject_receipt_sha256:digest('subject'),current_signer_fingerprint:audit.public_key_sha256,
  previous_signer_fingerprint:digest('old signer'),proof_b_authorized:false},
  'rosie_rotated_custody_receipt_exception',721);
const provenance=await verify({kind:'rosie_rotation_witness_provenance_intake',build:722,
  reviewed_at:now.toISOString(),status:'ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD',
  reviewer_staff_user_id:rotation,original_exception_sha256:exception.receipt_sha256,
  pinned_witness_id:exception.receipt.witness_id,
  witness_payload_sha256:exception.receipt.witness_payload_sha256,
  subject_receipt_sha256:exception.receipt.subject_receipt_sha256,
  current_signer_fingerprint:exception.receipt.current_signer_fingerprint,
  previous_signer_fingerprint:exception.receipt.previous_signer_fingerprint,
  proof_b_authorized:false},'rosie_rotation_witness_provenance_intake',722);
const identityReceipt=await verify({kind:'rosie_independent_witness_identity_disposition',build:723,
  reviewed_at:now.toISOString(),status:'WITNESS_IDENTITY_EXTERNAL_VERIFICATION_PENDING',
  identity_reviewer_staff_user_id:identity,
  signed_provenance_receipt_sha256:provenance.receipt_sha256,
  signed_rotation_exception_sha256:exception.receipt_sha256,
  pinned_witness_id:exception.receipt.witness_id,
  signed_witness_payload_sha256:exception.receipt.witness_payload_sha256,
  external_human_identity_verified:false,independent_authority_accepted:false,
  proof_b_authorized:false},'rosie_independent_witness_identity_disposition',723);
const referencePolicy={observed_witness_id:exception.receipt.witness_id,
  observed_witness_payload_sha256:exception.receipt.witness_payload_sha256,
  decision:'compare_reference',acknowledge_reference_is_not_identity:true,review_note:note};
const match=witnessReferenceConflict724(identityReceipt,provenance,exception,
  actor(reference),env,referencePolicy,now);
assert.equal(match.status,'WITNESS_REFERENCE_CRYPTOGRAPHIC_MATCH_IDENTITY_HELD');
assert.equal(match.external_human_identity_verified,false);
assert.equal(witnessReferenceConflict724(identityReceipt,provenance,exception,
  actor(reference),env,{...referencePolicy,observed_witness_id:'different-id'},now).status,
  'WITNESS_REFERENCE_CONFLICT_PENDING_EXTERNAL_REVIEW');
assert.equal(witnessReferenceConflict724(identityReceipt,provenance,exception,
  actor(reference),env,{...referencePolicy,observed_witness_payload_sha256:digest('other')},now)
  .reference_conflict_detected,true);
assert.equal(witnessReferenceConflict724(identityReceipt,provenance,exception,
  actor(identity),env,referencePolicy,now),null);
assert.equal(witnessReferenceConflict724(identityReceipt,provenance,exception,
  actor(reference),env,{...referencePolicy,acknowledge_reference_is_not_identity:false},now),null);
assert.equal(witnessReferenceConflict724({...identityReceipt,receipt:{...identityReceipt.receipt,
  signed_rotation_exception_sha256:digest('wrong')}},provenance,exception,
  actor(reference),env,referencePolicy,now),null);

const reconciliation=await verify({kind:'rosie_owner_ledger_retention_reconciliation',build:722,
  reviewed_at:now.toISOString(),status:'OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD',
  owner_staff_user_id:owner,original_gate_sha256:gate.receipt_sha256,
  independent_security_review_sha256:digest('security'),owner_requested_max_days:30,
  ledger_activated:false,proof_b_authorized:false},
  'rosie_owner_ledger_retention_reconciliation',722);
const expiry=await verify({kind:'rosie_owner_retention_expiry_policy_verification',build:723,
  reviewed_at:now.toISOString(),status:'RETENTION_EXPIRY_POLICY_PREVIEW_HELD',
  owner_staff_user_id:owner,
  original_signed_reconciliation_sha256:reconciliation.receipt_sha256,
  original_signed_gate_sha256:gate.receipt_sha256,
  original_signed_security_review_sha256:reconciliation.receipt.independent_security_review_sha256,
  maximum_retention_days:30,illustrative_only:true,
  illustrative_new_row_timestamp_utc:now.toISOString(),
  illustrative_expiry_utc:new Date(now.getTime()+30*86400000).toISOString(),
  actual_rows_queried:0,actual_row_expiration_verified:false,
  retention_purge_job_verified:false,backup_purge_verified:false,
  ledger_activated:false,proof_b_authorized:false},
  'rosie_owner_retention_expiry_policy_verification',723);
const purgePolicy={decision:'request_independent_trial',backup_scope:'unverified',
  acknowledge_no_live_purge_or_backup_access:true,review_note:note};
const purge=retentionBackupPurgeTrial724(expiry,reconciliation,actor(owner),purgePolicy,now);
assert.equal(purge.status,'RETENTION_BACKUP_PURGE_TRIAL_PRECONDITIONS_HELD');
assert.equal(purge.real_purge_executed,false);
assert.equal(purge.trial_preconditions.backup_inventory_verified,false);
assert.equal(retentionBackupPurgeTrial724(expiry,reconciliation,actor(reference),purgePolicy,now),null);
assert.equal(retentionBackupPurgeTrial724({...expiry,receipt:{...expiry.receipt,
  illustrative_expiry_utc:new Date(now.getTime()+2*86400000).toISOString()}},
  reconciliation,actor(owner),purgePolicy,now),null);
assert.equal(retentionBackupPurgeTrial724(expiry,reconciliation,actor(owner),
  {...purgePolicy,acknowledge_no_live_purge_or_backup_access:false},now),null);
assert.equal(retentionBackupPurgeTrial724(expiry,reconciliation,actor(owner),
  {...purgePolicy,backup_scope:'verified'},now),null);
const rejectedReconciliation=await verify({...reconciliation.receipt,
  status:'OWNER_STORAGE_REJECTED_NO_ACTIVATION'},
  'rosie_owner_ledger_retention_reconciliation',722);
const rejectedExpiry=await verify({...expiry.receipt,
  status:'OWNER_STORAGE_REJECTION_CONFIRMED_NO_EXPIRY_REQUIRED',
  original_signed_reconciliation_sha256:rejectedReconciliation.receipt_sha256,
  illustrative_expiry_utc:null},'rosie_owner_retention_expiry_policy_verification',723);
assert.equal(retentionBackupPurgeTrial724(rejectedExpiry,rejectedReconciliation,
  actor(owner),{...purgePolicy,decision:'reject_trial'},now).status,
  'OWNER_STORAGE_REJECTED_PURGE_TRIAL_NOT_APPLICABLE');
assert.equal(retentionBackupPurgeTrial724(rejectedExpiry,rejectedReconciliation,
  actor(owner),purgePolicy,now),null);

const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'fixture-only'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const originalFetch=globalThis.fetch;let writes=0,reads=0;
const hashIds=Object.fromEntries([owner,reference,execution].map(id=>[digest('fixture-'+id),id]));
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected write in Build 724');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected table read');
  const id=hashIds[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
const request=(id,body)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
try{
  let r=await onRequestPost({request:request(owner,{action:'prepare_owner_nonproduction_handoff',
    signed_checklist:await sign(checklist.receipt),signed_dry_run:await sign(dry.receipt),
    signed_gate:await sign(gate.receipt),...ownerPolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.protected_file_transmitted,false);
  r=await onRequestPost({request:request(reference,{action:'review_witness_reference_conflict',
    signed_identity:await sign(identityReceipt.receipt),
    signed_provenance:await sign(provenance.receipt),
    signed_exception:await sign(exception.receipt),...referencePolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.custody_approved,false);
  r=await onRequestPost({request:request(owner,{action:'review_retention_backup_purge_trial',
    signed_expiry:await sign(expiry.receipt),
    signed_reconciliation:await sign(reconciliation.receipt),...purgePolicy}),env:apiEnv});
  assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  assert.equal((await r.json()).receipt.real_purge_executed,false);
  r=await onRequestPost({request:request(execution,{action:'prepare_owner_nonproduction_handoff',
    signed_checklist:await sign(checklist.receipt),signed_dry_run:await sign(dry.receipt),
    signed_gate:await sign(gate.receipt),...ownerPolicy}),env:apiEnv});
  assert.equal(r.status,409);
  r=await onRequestPost({request:request(owner,{action:'review_witness_reference_conflict',
    signed_identity:await sign(identityReceipt.receipt),
    signed_provenance:await sign(provenance.receipt),
    signed_exception:await sign(exception.receipt),...referencePolicy}),env:apiEnv});
  assert.equal(r.status,409);
  assert.ok(reads>=5);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['ledgerChecklistReceipt724','ledgerOwnerHandoffDecision724',
  'ledgerOwnerHandoffNote724','ledgerHandoffPrivate724','ledgerOwnerHandoff724',
  'witnessIdentityReceipt724','witnessReferenceId724','witnessReferenceHash724',
  'witnessReferenceDecision724','witnessReferenceNote724','witnessReferenceNoIdentity724',
  'witnessReferenceReview724','ledgerExpiryReceipt724','ledgerBackupScope724',
  'ledgerPurgeDecision724','ledgerPurgeNote724','ledgerNoPurge724','ledgerPurgeReview724'])
  assert.match(html,new RegExp(`id="${id}"`));
const client=read('assets/admin-followup-workload-v713.js');
for(const name of ['prepareOwnerHandoff724','reviewWitnessReference724','reviewPurgeTrial724'])
  assert.match(client,new RegExp(name));
assert.match(html,/admin-followup-workload-v724\.css/);
assert.match(read('assets/admin-followup-workload-v724.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build724_handoff_reference_purge_test\.mjs/);
console.log('Build 724 PASS: original signed chains, owner handoff, independent witness conflict, retention/backup trial review, zero writes or approvals');
// Reusable disposable fixtures for successor security regressions; no real owner evidence.
export const fixtureFor725={now,owner,execution,security,identity,reference,rotation,
  custody,signer,env,audit,sign,verify,actor,note,digest,gate,dry,checklist,
  exception,provenance,identityReceipt,referencePolicy,match,reconciliation,expiry,
  packet,purge};
