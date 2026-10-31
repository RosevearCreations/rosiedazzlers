import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {signEvidenceReceipt716} from '../assets/quote-followup-signature-v716.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {verifyScopedSignedReceipt722} from '../assets/quote-followup-ledger-v722.mjs';
import {NONPRODUCTION_LEDGER_SQL723,nonproductionExecutionChecklist723,
  witnessIdentityDisposition723,ownerRetentionExpiry723} from
  '../assets/quote-followup-authorization-v723.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// Disposable and entirely synthetic receipts. NOT external custodian, project or owner approval.
const now=new Date(),owner='a001d322-1000-4000-8000-000000000001',
  security='a001d322-1000-4000-8000-000000000002',
  rotation='a001d322-1000-4000-8000-000000000003',
  execution='a001d322-1000-4000-8000-000000000004',
  identity='a001d322-1000-4000-8000-000000000005',
  signer='a001d322-1000-4000-8000-000000000006',
  custody='a001d322-1000-4000-8000-000000000007';
const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(
    await webcrypto.subtle.exportKey('jwk',key.privateKey)),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'fixture-current-signer',
  ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signer,
  ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:custody,
  ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID:rotation,
  ROSIE_EXPORT_WITNESS_IDENTITY_REVIEWER_STAFF_ID:identity,
  ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID:execution,
  ROSIE_LEDGER_NONPROD_PROJECT_REF:'onlyfakenonprodproject',
  ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID:security,
  SUPABASE_URL:'https://productionfixture.supabase.co'};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
const digest=s=>createHash('sha256').update(s).digest('hex');
const sign=r=>signEvidenceReceipt716(r,env,webcrypto);
const verify=(r,kind,build)=>verifyScopedSignedReceipt722(r,kind,build,env,audit,webcrypto,now);
const actor=id=>({id,role_code:'admin'});
const script=readFileSync(resolve(import.meta.dirname,'..',NONPRODUCTION_LEDGER_SQL723.script));
assert.equal(digest(script),NONPRODUCTION_LEDGER_SQL723.sha256);
assert.match(script.toString(),/^ROLLBACK;/m);
assert.doesNotMatch(script.toString(),/^COMMIT;/m);

const dryReceipt={kind:'rosie_private_ledger_schema_dry_run_review',build:722,
  reviewed_at:now.toISOString(),status:'PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD',
  security_reviewer_staff_user_id:security,
  signed_original_gate_sha256:'a'.repeat(64),
  signed_security_review_sha256:'b'.repeat(64),
  blueprint:{artifact:NONPRODUCTION_LEDGER_SQL723.script,
    required_transaction_end:'ROLLBACK'},sql_executed:false,migration_applied:false,
  ledger_activated:false,owner_approval_verified:false,proof_b_authorized:false};
const signedDry=await sign(dryReceipt),checkedDry=await verify(signedDry,dryReceipt.kind,722);
assert.equal(checkedDry.ok,true);
const checklistPolicy={project_ref:env.ROSIE_LEDGER_NONPROD_PROJECT_REF,
  decision:'request_independent_nonproduction_approval',
  confirm_no_execution:true,confirm_sql_sha256_reviewed:true,
  review_note:'Fixture-only independent authorization is still pending for this rollback review.'};
const checklist=nonproductionExecutionChecklist723(checkedDry,actor(execution),env,checklistPolicy,now);
assert.equal(checklist.status,'NONPRODUCTION_LEDGER_EXECUTION_AUTHORIZATION_CHECKLIST_HELD');
assert.equal(checklist.checklist.independently_authorized_to_connect,false);
assert.equal(checklist.sql_executed,false);assert.equal(checklist.ledger_activated,false);
assert.equal(nonproductionExecutionChecklist723(checkedDry,actor(owner),env,checklistPolicy,now),null);
assert.equal(nonproductionExecutionChecklist723(checkedDry,actor(execution),env,
  {...checklistPolicy,project_ref:'productionfixture'},now),null);
assert.equal(nonproductionExecutionChecklist723(checkedDry,actor(execution),
  {...env,ROSIE_LEDGER_NONPROD_PROJECT_REF:'productionfixture'},
  {...checklistPolicy,project_ref:'productionfixture'},now),null);
assert.equal(nonproductionExecutionChecklist723(checkedDry,actor(execution),env,
  {...checklistPolicy,confirm_no_execution:false},now),null);
assert.equal(nonproductionExecutionChecklist723(checkedDry,actor(execution),env,
  {...checklistPolicy,decision:'reject_nonproduction_execution'},now).status,
  'NONPRODUCTION_LEDGER_EXECUTION_PROPOSAL_REJECTED');

const exceptionReceipt={kind:'rosie_rotated_custody_receipt_exception',build:721,
  checked_at:now.toISOString(),status:'PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD',
  reviewer_staff_user_id:rotation,subject_receipt_sha256:'c'.repeat(64),
  witness_payload_sha256:'d'.repeat(64),witness_id:'synthetic-independent-witness',
  current_signer_fingerprint:audit.public_key_sha256,
  previous_signer_fingerprint:'e'.repeat(64),proof_b_authorized:false};
const signedException=await sign(exceptionReceipt),
  verifiedException=await verify(signedException,exceptionReceipt.kind,721);
const provenanceReceipt={kind:'rosie_rotation_witness_provenance_intake',build:722,
  reviewed_at:now.toISOString(),status:'ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD',
  reviewer_staff_user_id:rotation,original_exception_sha256:verifiedException.receipt_sha256,
  subject_receipt_sha256:exceptionReceipt.subject_receipt_sha256,
  witness_payload_sha256:exceptionReceipt.witness_payload_sha256,
  pinned_witness_id:exceptionReceipt.witness_id,
  current_signer_fingerprint:exceptionReceipt.current_signer_fingerprint,
  previous_signer_fingerprint:exceptionReceipt.previous_signer_fingerprint,
  cryptographic_provenance_rechecked:true,proof_b_authorized:false};
const signedProvenance=await sign(provenanceReceipt),
  verifiedProvenance=await verify(signedProvenance,provenanceReceipt.kind,722);
const identityPolicy={decision:'request_external_identity_review',
  acknowledge_no_identity_acceptance:true,
  review_note:'Fixture evidence only; independently verified witness human identity has not arrived.'};
const identityDisposition=witnessIdentityDisposition723(verifiedProvenance,verifiedException,
  actor(identity),env,identityPolicy,now);
assert.equal(identityDisposition.status,'WITNESS_IDENTITY_EXTERNAL_VERIFICATION_PENDING');
assert.equal(identityDisposition.external_human_identity_verified,false);
assert.equal(identityDisposition.custody_approved,false);
assert.equal(witnessIdentityDisposition723(verifiedProvenance,verifiedException,
  actor(rotation),env,identityPolicy,now),null);
assert.equal(witnessIdentityDisposition723({...verifiedProvenance,receipt:{...provenanceReceipt,
  original_exception_sha256:'f'.repeat(64)}},verifiedException,actor(identity),env,identityPolicy,now),null);
assert.equal(witnessIdentityDisposition723(verifiedProvenance,verifiedException,
  actor(identity),env,{...identityPolicy,acknowledge_no_identity_acceptance:false},now),null);
assert.equal(witnessIdentityDisposition723(verifiedProvenance,verifiedException,
  actor(identity),env,{...identityPolicy,decision:'reject_witness_identity_evidence'},now).status,
  'WITNESS_IDENTITY_EVIDENCE_REJECTED');

const gateReceipt={kind:'rosie_owner_evidence_ledger_approval_gate',build:720,
  reviewed_at:now.toISOString(),status:'LEDGER_APPROVAL_GATE_HELD',
  owner_admin_staff_user_id:owner,signed_owner_request_sha256:'1'.repeat(64),
  proposed_retention_days:30,proof_b_authorized:false};
const signedGate=await sign(gateReceipt),checkedGate=await verify(signedGate,gateReceipt.kind,720);
const securityReceipt={kind:'rosie_owner_evidence_ledger_security_review',build:721,
  reviewed_at:now.toISOString(),status:'OWNER_LEDGER_SECURITY_REVIEW_HELD',
  verified_signed_gate_sha256:checkedGate.receipt_sha256,
  source_owner_request_sha256:gateReceipt.signed_owner_request_sha256,
  independent_security_reviewer_staff_user_id:security,proof_b_authorized:false};
const signedSecurity=await sign(securityReceipt),
  checkedSecurity=await verify(signedSecurity,securityReceipt.kind,721);
const reconciliationReceipt={kind:'rosie_owner_ledger_retention_reconciliation',build:722,
  reviewed_at:now.toISOString(),status:'OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD',
  owner_staff_user_id:owner,original_gate_sha256:checkedGate.receipt_sha256,
  independent_security_review_sha256:checkedSecurity.receipt_sha256,
  original_owner_request_sha256:gateReceipt.signed_owner_request_sha256,
  independent_security_reviewer_staff_user_id:security,
  owner_requested_max_days:7,decision:'request_shorter_retention',
  ledger_activated:false,hashes_persisted:false,proof_b_authorized:false};
const signedReconciliation=await sign(reconciliationReceipt),
  checkedReconciliation=await verify(signedReconciliation,reconciliationReceipt.kind,722);
const expiryPolicy={acknowledge_no_rows_or_purge_execution:true,
  review_note:'Check UTC policy arithmetic without claiming an actual database row or purge.'};
const expiry=ownerRetentionExpiry723(checkedReconciliation,checkedGate,checkedSecurity,
  actor(owner),env,expiryPolicy,now);
assert.equal(expiry.status,'RETENTION_EXPIRY_POLICY_PREVIEW_HELD');
assert.equal(expiry.illustrative_expiry_utc,new Date(now.getTime()+7*86400000).toISOString());
assert.equal(expiry.actual_row_expiration_verified,false);
assert.equal(expiry.retention_purge_job_verified,false);
assert.equal(ownerRetentionExpiry723(checkedReconciliation,checkedGate,checkedSecurity,
  actor(security),env,expiryPolicy,now),null);
assert.equal(ownerRetentionExpiry723({...checkedReconciliation,receipt:{...reconciliationReceipt,
  original_gate_sha256:'f'.repeat(64)}},checkedGate,checkedSecurity,
  actor(owner),env,expiryPolicy,now),null);
assert.equal(ownerRetentionExpiry723(checkedReconciliation,checkedGate,checkedSecurity,
  actor(owner),env,{...expiryPolicy,acknowledge_no_rows_or_purge_execution:false},now),null);
const rejected=await verify(await sign({...reconciliationReceipt,
  status:'OWNER_STORAGE_REJECTED_NO_ACTIVATION',decision:'reject_storage'}),
  reconciliationReceipt.kind,722);
assert.equal(ownerRetentionExpiry723(rejected,checkedGate,checkedSecurity,
  actor(owner),env,expiryPolicy,now).illustrative_expiry_utc,null);

const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'fixture-secret-never-send-to-browser'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance',
  post=(body,id)=>new Request(url,{method:'POST',
    headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
    body:JSON.stringify(body)});
const tokenHashMap=Object.fromEntries([owner,security,rotation,execution,identity].map(id=>[
  digest('fixture-'+id),id]));
const originalFetch=globalThis.fetch;let writes=0,reads=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Build 723 must never write.');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected remote call '+uri.pathname);
  const id=tokenHashMap[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture-session',staff_user_id:id,revoked_at:null,
    expires_at:new Date(now.getTime()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
try{
  let response=await onRequestPost({request:post({action:'review_nonproduction_execution_checklist',
    signed_dry_run:signedDry,...checklistPolicy},execution),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.sql_executed,false);
  response=await onRequestPost({request:post({action:'review_external_witness_identity',
    signed_provenance:signedProvenance,signed_exception:signedException,...identityPolicy},identity),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.independent_authority_accepted,false);
  response=await onRequestPost({request:post({action:'verify_owner_retention_expiry',
    signed_reconciliation:signedReconciliation,signed_gate:signedGate,
    signed_security:signedSecurity,...expiryPolicy},owner),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.ledger_activated,false);
  assert.equal((await onRequestPost({request:post({action:'review_nonproduction_execution_checklist',
    signed_dry_run:signedDry,...checklistPolicy},owner),env:apiEnv})).status,409);
  assert.equal((await onRequestPost({request:post({action:'review_external_witness_identity',
    signed_provenance:signedProvenance,signed_exception:signedException,...identityPolicy},rotation),env:apiEnv})).status,409);
  assert.equal((await onRequestPost({request:post({action:'verify_owner_retention_expiry',
    signed_reconciliation:signedReconciliation,signed_gate:signedGate,
    signed_security:signedSecurity,...expiryPolicy},identity),env:apiEnv})).status,409);
  assert.ok(reads>=6);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8'),
  html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['witnessIdentityProvenance723','witnessIdentityDecision723',
  'witnessIdentityNote723','witnessNoIdentity723','witnessIdentityReview723',
  'ledgerDryRunReceipt723','ledgerNonprodProject723','ledgerExecutionDecision723',
  'ledgerExecutionNote723','ledgerSqlReviewed723','ledgerNoSqlExecution723',
  'ledgerExecutionReview723','ledgerOwnerDecisionFile723','ledgerExpiryNote723',
  'ledgerNoRows723','ledgerExpiryVerify723'])assert.match(html,new RegExp(`id="${id}"`));
for(const method of ['reviewExecutionChecklist723','reviewWitnessIdentity723','verifyExpiry723'])
  assert.match(js,new RegExp(method));
assert.match(html,/admin-followup-workload-v723\.css/);
assert.match(read('assets/admin-followup-workload-v723.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build723_nonprod_witness_identity_expiry_test\.mjs/);
console.log('Build 723 PASS: exact rollback SQL hash, pinned nonprod authority checklist, separate witness identity disposition, UTC retention expiry, no SQL/writes/external approval');
