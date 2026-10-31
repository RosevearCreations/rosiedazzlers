import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {signEvidenceReceipt716} from '../assets/quote-followup-signature-v716.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {shiftConnectionTrial718} from '../assets/quote-followup-intake-v718.mjs';
import {providerBindingDecision719} from '../assets/quote-followup-disposition-v719.mjs';
import {verifySignedEvidence720,providerDriftComparison720} from '../assets/quote-followup-recovery-v720.mjs';
import {SOURCE_DRIFT_HISTORY_DESIGN721,sourceHistoryDesign721,rotatedCustodyException721,
  ownerLedgerSecurityReview721} from '../assets/quote-followup-governance-v721.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// All identities, keys, provider responses and receipts below are disposable test fixtures.
const now=new Date(),staff='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',
  reviewer='0c3f754c-b25e-4c60-9d55-5eeae784b319',
  owner='b58f7611-f980-4d79-8652-3ebf362d4899',
  security='e2dcc541-3d16-4424-a97c-7c804a51d36a',
  signerStaff='c8d9241c-24c5-43c3-9c26-1cbd537931a6',
  planned=new Date(now.getTime()+86400000).toISOString(),
  window={start_at:planned,end_at:new Date(Date.parse(planned)+3600000).toISOString()};
const currentKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']),
  previousKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']),
  witnessKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const currentPrivate=await webcrypto.subtle.exportKey('jwk',currentKey.privateKey),
  previousPrivate=await webcrypto.subtle.exportKey('jwk',previousKey.privateKey),
  previousPublic=await webcrypto.subtle.exportKey('jwk',previousKey.publicKey),
  witnessPublic=await webcrypto.subtle.exportKey('jwk',witnessKey.publicKey);
const conf={ROSIE_STAFF_SHIFT_ROSTER_URL:'https://roster.example.test/approved',
  ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN:'https://roster.example.test',
  ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF:'test-only-company'},
  env={...conf,ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(currentPrivate),
    ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'fixture-current-signer',
    ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signerStaff,
    ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK:JSON.stringify(previousPublic),
    ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID:'fixture-previous-signer',
    ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT:now.toISOString(),
    ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK:JSON.stringify(witnessPublic),
    ROSIE_EXPORT_CUSTODY_WITNESS_ID:'fixture-independent-rotation-witness',
    ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:reviewer,
    ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID:reviewer,
    ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID:security};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
const hex=async data=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',data))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');
const shift={source:'configured',provider_fetch_completed:true,shift_schedule_verified:true,
  source_revision:'current-revision',generated_at:now.toISOString(),
  provider_source_account_ref:'test-only-company',provider_payload_sha256:'a'.repeat(64)},
  availability={hard_hold:false,requires_manager_override:false},
  trial=shiftConnectionTrial718(shift,availability,staff,window,true,now);
const binding=await providerBindingDecision719(env,shift,availability,trial,webcrypto,now),
  signedBinding=await signEvidenceReceipt716(binding,env,webcrypto),
  checkedBinding=await verifySignedEvidence720(signedBinding,binding.kind,env,audit,webcrypto,now);
assert.equal(checkedBinding.ok,true);
const drift=providerDriftComparison720(checkedBinding.receipt,binding,now),
  historyPolicy={retention_days:30,review_note:'Fixture-only retention scope and private grants review are pending.',
    acknowledge_no_storage:true};
const design=sourceHistoryDesign721(checkedBinding,drift,{id:reviewer,role_code:'admin'},historyPolicy,now);
assert.equal(design.status,'HISTORY_PERSISTENCE_DESIGN_HELD');
assert.equal(design.database_deployed,false);
assert.equal(design.history_rows_persisted,0);
assert.equal(design.schema_design.schema_exposed_to_data_api,false);
assert.equal(design.schema_design.raw_provider_response_allowed,false);
assert.ok(SOURCE_DRIFT_HISTORY_DESIGN721.columns.includes('retention_expires_at'));
assert.equal(sourceHistoryDesign721(checkedBinding,drift,{id:reviewer,role_code:'admin'},
  {...historyPolicy,acknowledge_no_storage:false}),null);
assert.equal(sourceHistoryDesign721(checkedBinding,drift,{id:reviewer,role_code:'admin'},
  {...historyPolicy,retention_days:365}),null);
assert.equal(sourceHistoryDesign721(checkedBinding,
  {...drift,status:'INVALID_OR_STALE_SIGNED_BASELINE'},{id:reviewer,role_code:'admin'},historyPolicy),null);

const retiredReceipt={kind:'rosie_internal_export_custody_review_disposition',build:719,
  decided_at:new Date(now.getTime()-86400000).toISOString(),
  status:'INTERNAL_EXPORT_REVIEW_ACCEPTED',reviewer_staff_user_id:reviewer,
  receipt_saved_on_server:false,witness_signature_verified:true,
  witness_signed_payload_sha256:'b'.repeat(64),proof_b_authorized:false};
const oldEnv={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(previousPrivate),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID};
const signedOld=await signEvidenceReceipt716(retiredReceipt,oldEnv,webcrypto);
const retiredBytes=Uint8Array.from(Buffer.from(signedOld.receipt_base64,'base64')),
  retiredHash=await hex(retiredBytes),oldPublicHash=await hex(new TextEncoder().encode(
    JSON.stringify({kty:'OKP',crv:'Ed25519',x:previousPublic.x})));
const witnessPayload={type:'rosie_export_signer_rotation_exception_witness',
  scope:'internal_export_custody_receipt_only',witness_id:env.ROSIE_EXPORT_CUSTODY_WITNESS_ID,
  previous_signer_id:env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID,
  previous_public_key_sha256:oldPublicHash,
  current_signer_id:audit.signer_id,current_public_key_sha256:audit.public_key_sha256,
  subject_receipt_sha256:retiredHash,rotation_reviewer_staff_user_id:reviewer,
  witnessed_at:now.toISOString()};
const witnessBytes=new TextEncoder().encode(JSON.stringify(witnessPayload)),
  signWitness=async payloadBytes=>({signature_algorithm:'Ed25519',
    payload_base64:Buffer.from(payloadBytes).toString('base64'),
    signature_base64:Buffer.from(await webcrypto.subtle.sign('Ed25519',witnessKey.privateKey,payloadBytes))
      .toString('base64')}),
  witnessEnvelope=await signWitness(witnessBytes);
const exception=await rotatedCustodyException721(signedOld,witnessEnvelope,
  {id:reviewer,role_code:'admin'},env,audit,webcrypto,now);
assert.equal(exception.ok,true);
assert.equal(exception.status,'PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD');
assert.equal(exception.independent_signature_valid,true);
assert.equal(exception.independent_person_verified,false);
assert.equal(exception.new_key_reissued_old_receipt,false);
assert.equal(exception.proof_b_authorized,false);
const deny=async(a,b,actor={id:reviewer,role_code:'admin'},config=env)=>
  (await rotatedCustodyException721(a,b,actor,config,audit,webcrypto,now)).ok;
assert.equal(await deny({...signedOld,signature_base64:'A'+signedOld.signature_base64.slice(1)},witnessEnvelope),false);
assert.equal(await deny(signedOld,{...witnessEnvelope,signature_base64:'B'+witnessEnvelope.signature_base64.slice(1)}),false);
assert.equal(await deny(signedOld,witnessEnvelope,{id:owner,role_code:'admin'}),false);
assert.equal(await deny(signedOld,witnessEnvelope,undefined,
  {...env,ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK:undefined}),false);
assert.equal(await deny(signedOld,witnessEnvelope,undefined,
  {...env,ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT:new Date(now.getTime()-95*86400000).toISOString()}),false);
const alteredWitness=await signWitness(new TextEncoder().encode(JSON.stringify({
  ...witnessPayload,subject_receipt_sha256:'c'.repeat(64)})));
assert.equal(await deny(signedOld,alteredWitness),false);

const gate={kind:'rosie_owner_evidence_ledger_approval_gate',build:720,
  reviewed_at:now.toISOString(),status:'LEDGER_APPROVAL_GATE_HELD',
  reviewer_staff_user_id:reviewer,owner_admin_staff_user_id:owner,
  signed_owner_request_sha256:'d'.repeat(64),proposed_retention_days:30,
  ledger_activated:false,hashes_persisted:false,security_and_rls_review_completed:false,
  proof_b_authorized:false},
  signedGate=await signEvidenceReceipt716(gate,env,webcrypto),
  checkedGate=await verifySignedEvidence720(signedGate,gate.kind,env,audit,webcrypto,now);
assert.equal(checkedGate.ok,true);
const securityPolicy={review_decision:'request_private_schema_review',
  review_note:'Fixture-only private schema and RLS requirements are not yet approved.',
  acknowledge_no_activation:true};
const review=ownerLedgerSecurityReview721(checkedGate,{id:security,role_code:'admin'},
  env,securityPolicy,now);
assert.equal(review.status,'OWNER_LEDGER_SECURITY_REVIEW_HELD');
assert.equal(review.schema_deployed,false);
assert.equal(review.rls_inspected_live,false);
assert.equal(review.ledger_activated,false);
assert.equal(ownerLedgerSecurityReview721(checkedGate,{id:reviewer,role_code:'admin'},
  env,securityPolicy),null);
assert.equal(ownerLedgerSecurityReview721(checkedGate,{id:security,role_code:'admin'},
  env,{...securityPolicy,acknowledge_no_activation:false}),null);
assert.equal(ownerLedgerSecurityReview721(checkedGate,{id:security,role_code:'admin'},
  env,{...securityPolicy,review_note:'Phone: +1 555 999 1111 must be copied'}),null);
assert.equal(ownerLedgerSecurityReview721(checkedGate,{id:security,role_code:'admin'},env,
  {...securityPolicy,review_decision:'reject_ledger_proposal'}).status,
  'OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED');

const apiEnv={...env,SUPABASE_URL:'https://db.example.test',
  SUPABASE_SERVICE_ROLE_KEY:'fixture-secret-keep-private',
  ROSIE_STAFF_SHIFT_ROSTER_BEARER:'fixture-roster-secret'},
  url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance',
  post=(body,acting=reviewer)=>new Request(url,{method:'POST',
    headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+acting},
    body:JSON.stringify(body)});
const securityTokenHash=await hex(new TextEncoder().encode('fixture-'+security));
const previousFetch=globalThis.fetch;let providerGets=0,writes=0;
globalThis.fetch=async(input,opts={})=>{
  const uri=new URL(String(input));
  if(opts.method==='POST'){writes++;throw Error('Never write in Build 721 test.');}
  if(uri.pathname.endsWith('/staff_auth_sessions')){
    const actor=uri.searchParams.get('token_hash')==='eq.'+securityTokenHash?security:reviewer;
    return Response.json([{id:'fixture',staff_user_id:actor,revoked_at:null,
      expires_at:new Date(Date.now()+86400000).toISOString(),
      staff_user:{id:actor,role_code:'admin',is_active:true,can_manage_bookings:true}}]);
  }
  if(uri.pathname.endsWith('/staff_users'))return Response.json([{
    id:staff,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(uri.pathname.endsWith('/staff_availability_blocks'))return Response.json([]);
  if(uri.hostname==='roster.example.test'){
    providerGets++;
    assert.equal(opts.headers?.Authorization,'Bearer fixture-roster-secret');
    return Response.json({complete:true,source_revision:'current-revision',
      source_account_ref:'test-only-company',generated_at:now.toISOString(),
      shifts:[{id:'fixture-shift',staff_user_id:staff,
        start_at:new Date(Date.parse(planned)-3600000).toISOString(),
        end_at:new Date(Date.parse(planned)+3600000).toISOString(),
        status:'approved',approved_by:'fixture-approval'}]});
  }
  throw Error('Unexpected read '+uri.pathname);
};
try{
  let response=await onRequestPost({request:post({action:'review_source_history_design',
    signed_evidence:signedBinding,staff_user_id:staff,planned_followup_at:planned,
    ...historyPolicy}),env:apiEnv});
  assert.equal(response.status,200);const signedHistory=await response.json();
  assert.equal(signedHistory.receipt.database_deployed,false);
  assert.equal(signedHistory.signed_receipt.signature_algorithm,'Ed25519');
  assert.doesNotMatch(JSON.stringify(signedHistory),/fixture-roster-secret|fixture-secret-keep-private/);
  response=await onRequestPost({request:post({action:'recover_rotated_custody_exception',
    previous_signed_evidence:signedOld,rotation_witness_envelope:witnessEnvelope,
    acknowledge_not_approval:true}),env:apiEnv});
  assert.equal(response.status,200);
  assert.equal((await response.json()).receipt.new_key_reissued_old_receipt,false);
  assert.equal((await onRequestPost({request:post({action:'recover_rotated_custody_exception',
    previous_signed_evidence:signedOld,rotation_witness_envelope:witnessEnvelope}),env:apiEnv})).status,409);
  response=await onRequestPost({request:post({action:'review_owner_ledger_security',
    signed_evidence:signedGate,...securityPolicy},security),env:apiEnv});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).receipt.ledger_activated,false);
  assert.equal((await onRequestPost({request:post({action:'review_owner_ledger_security',
    signed_evidence:signedGate,...securityPolicy},reviewer),env:apiEnv})).status,409);
  assert.ok(providerGets>0);assert.equal(writes,0);
}finally{globalThis.fetch=previousFetch;}

const root=resolve(import.meta.dirname,'..'),read=f=>readFileSync(resolve(root,f),'utf8'),
  html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['historyRetention721','historyNote721','historyNoStorage721','historyDesign721',
  'historyDesignStatus721','oldCustodyReceipt721','rotationWitness721','rotationNotApproval721',
  'rotationRecover721','rotationRecoveryStatus721','ledgerSecurityFile721',
  'ledgerSecurityDisposition721','ledgerSecurityNote721','ledgerSecurityNoActivation721',
  'ledgerSecurityReview721','ledgerSecurityStatus721'])assert.match(html,new RegExp(`id="${id}"`));
for(const name of ['reviewSourceHistory721','recoverRotatedCustody721','reviewLedgerSecurity721'])
  assert.match(js,new RegExp(name));
assert.match(html,/admin-followup-workload-v721\.css/);
assert.match(read('assets/admin-followup-workload-v721.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build721_source_history_rotation_security_test\.mjs/);
console.log('Build 721 PASS: private source-history design HOLD, pinned old-key + independent witness exception, separate owner security review, no writes or false approvals');
