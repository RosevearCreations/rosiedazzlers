import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {signEvidenceReceipt716} from '../assets/quote-followup-signature-v716.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {verifySignedEvidence720} from '../assets/quote-followup-recovery-v720.mjs';
import {ownerLedgerSecurityReview721,rotatedCustodyException721} from '../assets/quote-followup-governance-v721.mjs';
import {PRIVATE_LEDGER_DRY_RUN722,verifyScopedSignedReceipt722,privateLedgerDryRun722,
  rotationWitnessProvenance722,ownerRetentionReconciliation722} from '../assets/quote-followup-ledger-v722.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// Synthetic evidence and identities only. No real staff, owner, provider or signer data.
const now=new Date(),owner='f582a4c7-1000-4000-8000-111111111111',
  reviewer='f582a4c7-1000-4000-8000-222222222222',
  security='f582a4c7-1000-4000-8000-333333333333',
  signerStaff='f582a4c7-1000-4000-8000-444444444444';
const current=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']),
  previous=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']),
  witness=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const currentPrivate=await webcrypto.subtle.exportKey('jwk',current.privateKey),
  previousPrivate=await webcrypto.subtle.exportKey('jwk',previous.privateKey),
  previousPublic=await webcrypto.subtle.exportKey('jwk',previous.publicKey),
  witnessPublic=await webcrypto.subtle.exportKey('jwk',witness.publicKey);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(currentPrivate),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'fixture-current-signer',
  ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signerStaff,
  ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK:JSON.stringify(previousPublic),
  ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID:'fixture-previous-signer',
  ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT:now.toISOString(),
  ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:JSON.stringify(witnessPublic),
  ROSIE_EXPORT_CUSTODY_WITNESS_ID:'fixture-independent-witness',
  ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:reviewer,
  ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID:reviewer,
  ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID:security};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
const digest=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');
const act=id=>({id,role_code:'admin'}),
  signedReceipt=receipt=>signEvidenceReceipt716(receipt,env,webcrypto),
  verify=(envelope,kind,build)=>verifyScopedSignedReceipt722(
    envelope,kind,build,env,audit,webcrypto,now);

const gate={kind:'rosie_owner_evidence_ledger_approval_gate',build:720,
  reviewed_at:now.toISOString(),status:'LEDGER_APPROVAL_GATE_HELD',
  reviewer_staff_user_id:reviewer,owner_admin_staff_user_id:owner,
  signed_owner_request_sha256:'a'.repeat(64),proposed_retention_days:30,
  ledger_activated:false,hashes_persisted:false,security_and_rls_review_completed:false,
  proof_b_authorized:false},signedGate=await signedReceipt(gate),
  checkedGate=await verify(signedGate,gate.kind,720);
assert.equal(checkedGate.ok,true);
const securityReview=ownerLedgerSecurityReview721(
  await verifySignedEvidence720(signedGate,gate.kind,env,audit,webcrypto,now),
  act(security),env,{review_decision:'request_private_schema_review',
    review_note:'Inspect private schema with least-privilege roles before any migration.',
    acknowledge_no_activation:true},now);
assert.equal(securityReview.status,'OWNER_LEDGER_SECURITY_REVIEW_HELD');
const signedSecurity=await signedReceipt(securityReview),
  checkedSecurity=await verify(signedSecurity,securityReview.kind,721);
assert.equal(checkedSecurity.ok,true);
assert.equal((await verify({...signedSecurity,signature_base64:
  (signedSecurity.signature_base64[0]==='A'?'B':'A')+signedSecurity.signature_base64.slice(1)},
  securityReview.kind,721)).ok,false);
assert.equal((await verify(signedGate,gate.kind,721)).ok,false);
assert.equal((await verify(signedSecurity,securityReview.kind,721)).receipt_sha256.length,64);

const dryPolicy={acknowledge_rollback_only:true,
  review_note:'Review the rollback-only nonproduction script and independent DB role checks.'};
const dry=privateLedgerDryRun722(checkedSecurity,checkedGate,act(security),env,dryPolicy,now);
assert.equal(dry.status,'PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD');
assert.equal(dry.sql_executed,false);assert.equal(dry.transaction_rolled_back,false);
assert.equal(dry.migration_applied,false);assert.equal(dry.ledger_activated,false);
assert.equal(dry.blueprint.actual_migration_created,false);
assert.equal(privateLedgerDryRun722(checkedSecurity,checkedGate,act(owner),env,dryPolicy,now),null);
assert.equal(privateLedgerDryRun722(checkedSecurity,checkedGate,act(security),env,
  {...dryPolicy,acknowledge_rollback_only:false},now),null);
assert.equal(privateLedgerDryRun722({...checkedSecurity,receipt:{...securityReview,
  verified_signed_gate_sha256:'c'.repeat(64)}},checkedGate,act(security),env,dryPolicy,now),null);

const ownerPolicy={decision:'request_shorter_retention',retention_days:7,
  acknowledge_no_storage:true,
  review_note:'Minimize storage exposure pending separate RLS, backup and owner approvals.'};
const retained=ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(owner),env,ownerPolicy,now);
assert.equal(retained.status,'OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD');
assert.equal(retained.owner_requested_max_days,7);
assert.equal(retained.ledger_activated,false);
assert.equal(ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(security),env,ownerPolicy,now),null);
assert.equal(ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(owner),env,
  {...ownerPolicy,retention_days:90},now),null);
assert.equal(ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(owner),env,
  {...ownerPolicy,retention_days:30},now),null);
assert.equal(ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(owner),env,
  {...ownerPolicy,acknowledge_no_storage:false},now),null);
assert.equal(ownerRetentionReconciliation722(checkedGate,checkedSecurity,act(owner),env,
  {...ownerPolicy,decision:'reject_storage',retention_days:7},now).status,'OWNER_STORAGE_REJECTED_NO_ACTIVATION');

const retiredReceipt={kind:'rosie_internal_export_custody_review_disposition',build:719,
  decided_at:new Date(now.getTime()-86400000).toISOString(),
  status:'INTERNAL_EXPORT_REVIEW_ACCEPTED',reviewer_staff_user_id:reviewer,
  receipt_saved_on_server:false,witness_signature_verified:true,
  witness_signed_payload_sha256:'b'.repeat(64),proof_b_authorized:false};
const signedOld=await signEvidenceReceipt716(retiredReceipt,{
  ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(previousPrivate),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID},webcrypto);
const oldBytes=Uint8Array.from(Buffer.from(signedOld.receipt_base64,'base64'));
const witnessPayload={type:'rosie_export_signer_rotation_exception_witness',
  scope:'internal_export_custody_receipt_only',witness_id:env.ROSIE_EXPORT_CUSTODY_WITNESS_ID,
  previous_signer_id:env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID,
  previous_public_key_sha256:await digest(new TextEncoder().encode(JSON.stringify({
    kty:'OKP',crv:'Ed25519',x:previousPublic.x}))),
  current_signer_id:audit.signer_id,current_public_key_sha256:audit.public_key_sha256,
  subject_receipt_sha256:await digest(oldBytes),rotation_reviewer_staff_user_id:reviewer,
  witnessed_at:now.toISOString()};
const witnessBytes=new TextEncoder().encode(JSON.stringify(witnessPayload));
const witnessEnvelope={signature_algorithm:'Ed25519',
  payload_base64:Buffer.from(witnessBytes).toString('base64'),
  signature_base64:Buffer.from(await webcrypto.subtle.sign('Ed25519',
    witness.privateKey,witnessBytes)).toString('base64')};
const oldException=await rotatedCustodyException721(signedOld,witnessEnvelope,
  act(reviewer),env,audit,webcrypto,now);
assert.equal(oldException.ok,true);
const signedException=await signedReceipt(oldException),
  checkedException=await verify(signedException,oldException.kind,721);
assert.equal(checkedException.ok,true);
const provenancePolicy={acknowledge_no_external_identity:true,
  review_note:'The external witness identity and custody appointment require independent verification.'};
const provenance=rotationWitnessProvenance722(checkedException,oldException,act(reviewer),
  env,provenancePolicy,now);
assert.equal(provenance.status,'ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD');
assert.equal(provenance.independent_human_identity_verified,false);
assert.equal(provenance.evidence_persisted,false);
assert.equal(rotationWitnessProvenance722(checkedException,oldException,act(owner),env,
  provenancePolicy,now),null);
assert.equal(rotationWitnessProvenance722(checkedException,
  {...oldException,witness_payload_sha256:'d'.repeat(64)},act(reviewer),env,
  provenancePolicy,now),null);
assert.equal(rotationWitnessProvenance722(checkedException,oldException,act(reviewer),env,
  {...provenancePolicy,acknowledge_no_external_identity:false},now),null);

// Exact protected route boundaries; all outbound requests must be read-only auth GETs.
const apiEnv={...env,SUPABASE_URL:'https://db.example.test',
  SUPABASE_SERVICE_ROLE_KEY:'fixture-service-only-secret'};
const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const post=(body,actor=owner)=>new Request(url,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+actor},
  body:JSON.stringify(body)});
const tokenHashes=Object.fromEntries(await Promise.all([owner,reviewer,security].map(async id=>[
  await digest(new TextEncoder().encode('fixture-'+id)),id])));
const originalFetch=globalThis.fetch;let dbWrites=0;
globalThis.fetch=async(input,opts={})=>{
  if(opts.method&&opts.method!=='GET'){dbWrites++;throw Error('Build 722 must not write to DB.');}
  const uri=new URL(String(input));
  if(uri.pathname.endsWith('/staff_auth_sessions')){
    const id=tokenHashes[uri.searchParams.get('token_hash')?.slice(3)];
    return Response.json(id?[{id:'fixture-session',staff_user_id:id,revoked_at:null,
      expires_at:new Date(now.getTime()+86400000).toISOString(),
      staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
  }
  throw Error('Unexpected remote request '+uri.pathname);
};
try{
  let response=await onRequestPost({request:post({action:'prepare_private_ledger_dry_run',
    signed_gate:signedGate,signed_security:signedSecurity,...dryPolicy},security),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.sql_executed,false);
  response=await onRequestPost({request:post({action:'reconcile_owner_retention',
    signed_gate:signedGate,signed_security:signedSecurity,...ownerPolicy},owner),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.ledger_activated,false);
  response=await onRequestPost({request:post({action:'verify_rotation_witness_provenance',
    signed_exception:signedException,previous_signed_evidence:signedOld,
    rotation_witness_envelope:witnessEnvelope,...provenancePolicy},reviewer),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.external_custody_accepted,false);
  assert.equal((await onRequestPost({request:post({action:'prepare_private_ledger_dry_run',
    signed_gate:signedGate,signed_security:signedSecurity,...dryPolicy},owner),env:apiEnv})).status,409);
  assert.equal((await onRequestPost({request:post({action:'reconcile_owner_retention',
    signed_gate:signedGate,signed_security:signedSecurity,...ownerPolicy},security),env:apiEnv})).status,409);
  assert.equal((await onRequestPost({request:post({action:'verify_rotation_witness_provenance',
    signed_exception:signedException,previous_signed_evidence:signedOld,
    rotation_witness_envelope:witnessEnvelope,...provenancePolicy},owner),env:apiEnv})).status,409);
  assert.equal(dbWrites,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=f=>readFileSync(resolve(root,f),'utf8');
const sql=read(PRIVATE_LEDGER_DRY_RUN722.artifact),
  html=read('admin-followup-workload.html'),ui=read('assets/admin-followup-workload-v713.js');
assert.match(sql,/^BEGIN;/m);assert.match(sql,/^ROLLBACK;/m);
assert.doesNotMatch(sql,/^COMMIT;/m);assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
assert.match(sql,/REVOKE ALL ON SCHEMA rosie_private FROM PUBLIC, anon, authenticated/);
assert.match(sql,/FORCE ROW LEVEL SECURITY/);
assert.doesNotMatch(sql,/\bGRANT\b\s+(?:ALL|INSERT|UPDATE|SELECT)\s+ON\s+/i);
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['rotationExceptionFile722','rotationProvenanceNote722','rotationNoIdentity722',
  'rotationProvenance722','ledgerSecurityReceipt722','ledgerDryRunNote722',
  'ledgerRollbackOnly722','ledgerDryRun722','ledgerRetentionDecision722','ledgerRetentionWindow722',
  'ledgerOwnerNote722','ledgerNoStorage722','ledgerReconcile722'])
  assert.match(html,new RegExp(`id="${id}"`));
for(const fn of ['verifyRotationProvenance722','prepareLedgerDryRun722','reconcileRetention722'])
  assert.match(ui,new RegExp(fn));
assert.match(html,/admin-followup-workload-v722\.css/);
assert.match(read('assets/admin-followup-workload-v722.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),
  /build722_ledger_dry_run_provenance_retention_test\.mjs/);
console.log('Build 722 PASS: rollback-only unexecuted private schema, independent cryptographic provenance, owner retention lineage, role separation, no DB writes or invented external approvals');
