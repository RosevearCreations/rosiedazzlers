import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {providerBindingDecision719} from '../assets/quote-followup-disposition-v719.mjs';
import {shiftConnectionTrial718} from '../assets/quote-followup-intake-v718.mjs';
import {signEvidenceReceipt716} from '../assets/quote-followup-signature-v716.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {verifySignedEvidence720,providerDriftComparison720,recoverCustodyDisposition720,
  ownerLedgerApprovalGate720} from '../assets/quote-followup-recovery-v720.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

// Disposable fixture keys, staff identities and provider only: not real owner/witness proof.
const now=new Date(),staff='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',
  reviewer='0c3f754c-b25e-4c60-9d55-5eeae784b319',
  owner='b58f7611-f980-4d79-8652-3ebf362d4899',
  signerStaff='c8d9241c-24c5-43c3-9c26-1cbd537931a6',
  planned=new Date(now.getTime()+86400000).toISOString(),
  window={start_at:planned,end_at:new Date(Date.parse(planned)+3600000).toISOString()};
const configured={ROSIE_STAFF_SHIFT_ROSTER_URL:'https://roster.example.test/approved',
  ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN:'https://roster.example.test',
  ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF:'test-only-company'};
const serverKey=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']),
  serverJwk=await webcrypto.subtle.exportKey('jwk',serverKey.privateKey),
  env={...configured,ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(serverJwk),
    ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'test-only-server-signer',
    ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID:signerStaff,
    ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID:reviewer,
    ROSIE_OWNER_EVIDENCE_LEDGER_REVIEWER_STAFF_ID:reviewer};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
const shift={source:'configured',provider_fetch_completed:true,shift_schedule_verified:true,
  source_revision:'approved-v1',generated_at:now.toISOString(),
  provider_source_account_ref:'test-only-company',provider_payload_sha256:'a'.repeat(64)};
const availability={hard_hold:false,requires_manager_override:false},
  trial=shiftConnectionTrial718(shift,availability,staff,window,true,now);
const originalBinding=await providerBindingDecision719(env,shift,availability,trial,webcrypto,now);
assert.equal(originalBinding.live_source_bound,true);
assert.equal(originalBinding.staff_user_id,staff);
assert.deepEqual(originalBinding.window,window);
const signedBinding=await signEvidenceReceipt716(originalBinding,env,webcrypto);
const verifiedBinding=await verifySignedEvidence720(signedBinding,
  'rosie_shift_provider_production_binding_readback',env,audit,webcrypto,now);
assert.equal(verifiedBinding.ok,true);
assert.equal(providerDriftComparison720(verifiedBinding.receipt,originalBinding,now).status,'NO_DRIFT_OBSERVED');
assert.equal(providerDriftComparison720(verifiedBinding.receipt,
  {...originalBinding,source_revision:'approved-v2'},now).status,'ROSTER_CONTENT_OR_REVISION_CHANGED_REVIEW');
assert.equal(providerDriftComparison720(verifiedBinding.receipt,
  {...originalBinding,pinned_origin_sha256:'b'.repeat(64)},now).status,'PROVIDER_OR_ACCOUNT_PIN_DRIFT');
assert.equal(providerDriftComparison720(verifiedBinding.receipt,
  {...originalBinding,live_source_bound:false},now).status,'CURRENT_PROVIDER_BINDING_HOLD');
assert.equal(providerDriftComparison720(verifiedBinding.receipt,
  {...originalBinding,source_generated_at:new Date(now.getTime()-86400000).toISOString()},now)
  .status,'CURRENT_PROVIDER_SOURCE_STALE');
assert.equal(providerDriftComparison720(verifiedBinding.receipt,
  {...originalBinding,staff_user_id:owner},now).status,'INVALID_OR_STALE_SIGNED_BASELINE');
const tampered={...signedBinding,signature_base64:signedBinding.signature_base64.replace(/^./,
  signedBinding.signature_base64.startsWith('a')?'b':'a')};
assert.equal((await verifySignedEvidence720(tampered,originalBinding.kind,env,audit,webcrypto,now)).ok,false);
const rotated=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const rotatedEnv={...env,ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:
  JSON.stringify(await webcrypto.subtle.exportKey('jwk',rotated.privateKey))};
assert.equal((await verifySignedEvidence720(signedBinding,originalBinding.kind,rotatedEnv,
  await signerCustodyAudit717(rotatedEnv,webcrypto),webcrypto,now)).ok,false);
const staleBaseline={...originalBinding,checked_at:new Date(now.getTime()-31*86400000).toISOString()};
assert.equal((await verifySignedEvidence720(await signEvidenceReceipt716(staleBaseline,env,webcrypto),
  originalBinding.kind,env,audit,webcrypto,now)).ok,false);

const custody={kind:'rosie_internal_export_custody_review_disposition',build:719,
  status:'INTERNAL_EXPORT_REVIEW_ACCEPTED',decided_at:now.toISOString(),
  reviewer_staff_user_id:reviewer,receipt_saved_on_server:false,
  witness_signature_verified:true,witness_signed_payload_sha256:'b'.repeat(64),
  independent_evidence_reference:'TEST-ONLY-NO-REAL-WITNESS',proof_b_authorized:false};
const signedCustody=await signEvidenceReceipt716(custody,env,webcrypto);
const checkedCustody=await verifySignedEvidence720(signedCustody,custody.kind,env,audit,webcrypto,now);
assert.equal(checkedCustody.ok,true);
const recovery=recoverCustodyDisposition720(checkedCustody,{id:reviewer,role_code:'admin'},env,now);
assert.equal(recovery.status,'ORIGINAL_INTERNAL_SIGNATURE_AND_REVIEWER_MATCH');
assert.equal(recovery.server_record_found,false);
assert.equal(recovery.independent_human_identity_verified,false);
assert.equal(recoverCustodyDisposition720(checkedCustody,{id:owner,role_code:'admin'},env),null);

const requestReceipt={kind:'rosie_owner_device_evidence_retention_decision',build:719,
  decision_at:now.toISOString(),owner_admin_staff_user_id:owner,
  source_feedback_sha256:'1'.repeat(64),desktop_feedback_sha256:'2'.repeat(64),
  mobile_feedback_sha256:'3'.repeat(64),decision:'PROTECTED_HASH_LEDGER_REQUEST_HELD',
  hashes_persisted:false,proof_b_authorized:false};
const signedLedger=await signEvidenceReceipt716(requestReceipt,env,webcrypto);
const checkedLedger=await verifySignedEvidence720(signedLedger,requestReceipt.kind,env,audit,webcrypto,now);
assert.equal(checkedLedger.ok,true);
const policy={review_decision:'request_schema_security_review',retention_days:30,
  evidence_mode:'hashes_only',acknowledge_not_activated:true,
  review_note:'Test-only second-person review; await schema, security and RLS approval.'};
const gate=ownerLedgerApprovalGate720(checkedLedger,{id:reviewer,role_code:'admin'},env,policy,now);
assert.equal(gate.status,'LEDGER_APPROVAL_GATE_HELD');
assert.equal(gate.ledger_activated,false);
assert.equal(gate.hashes_persisted,false);
assert.equal(gate.security_and_rls_review_completed,false);
assert.equal(ownerLedgerApprovalGate720(checkedLedger,{id:owner,role_code:'admin'},env,policy),null);
assert.equal(ownerLedgerApprovalGate720(checkedLedger,{id:reviewer,role_code:'admin'},
  {...env,ROSIE_OWNER_EVIDENCE_LEDGER_REVIEWER_STAFF_ID:owner},policy),null);
assert.equal(ownerLedgerApprovalGate720(checkedLedger,{id:reviewer,role_code:'admin'},env,
  {...policy,acknowledge_not_activated:false}),null);
assert.equal(ownerLedgerApprovalGate720(checkedLedger,{id:reviewer,role_code:'admin'},env,
  {...policy,review_note:'Owner mobile +1 (555) 000-0000 should be kept'}),null);
assert.equal(ownerLedgerApprovalGate720(checkedLedger,{id:reviewer,role_code:'admin'},env,
  {...policy,review_decision:'reject_ledger_request'}).status,'LEDGER_REQUEST_REJECTED');

const apiEnv={...env,SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'do-not-expose',
  ADMIN_PASSWORD:'test-only-password',ALLOW_LEGACY_ADMIN_FALLBACK:'true',
  ROSIE_STAFF_SHIFT_ROSTER_BEARER:'secret-provider-token'},
  url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance',
  sessionHeaders={Cookie:'rd_staff_session=fixture-session'},
  post=body=>new Request(url,{method:'POST',headers:{...sessionHeaders,
    'Content-Type':'application/json'},body:JSON.stringify(body)});
const previousFetch=globalThis.fetch;
let providerGets=0,writeAttempts=0;
globalThis.fetch=async(input,opts={})=>{
  const uri=new URL(String(input));
  if(opts.method==='POST'){writeAttempts++;throw Error('Unexpected persistence attempt');}
  if(uri.pathname.endsWith('/staff_auth_sessions'))return Response.json([{
    id:'fixture-session',staff_user_id:reviewer,revoked_at:null,
    expires_at:new Date(Date.now()+86400000).toISOString(),
    staff_user:{id:reviewer,role_code:'admin',is_active:true,can_manage_bookings:true}}]);
  if(uri.pathname.endsWith('/staff_users'))return Response.json([{
    id:staff,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(uri.pathname.endsWith('/staff_availability_blocks'))return Response.json([]);
  if(uri.hostname==='roster.example.test'){
    providerGets++;
    assert.equal(opts.headers.Authorization,'Bearer secret-provider-token');
    return Response.json({complete:true,source_revision:'approved-v1',
      source_account_ref:'test-only-company',generated_at:now.toISOString(),shifts:[{
        id:'fixture-approved-shift',staff_user_id:staff,
        start_at:new Date(Date.parse(planned)-3600000).toISOString(),
        end_at:new Date(Date.parse(planned)+3600000).toISOString(),
        status:'approved',approved_by:'fixture-reviewer'}]});
  }
  throw Error('Unexpected read '+uri.pathname);
};
try{
  const getUrl=url+`?audit=provider_binding&receipt=signed&staff_user_id=${staff}`+
    `&planned_followup_at=${encodeURIComponent(planned)}`;
  assert.equal((await onRequestGet({request:new Request(getUrl),env:apiEnv})).status,401);
  assert.equal((await onRequestGet({request:new Request(getUrl,{headers:{'x-admin-password':'test-only-password'}}),
    env:apiEnv})).status,403);
  let res=await onRequestGet({request:new Request(getUrl,{headers:sessionHeaders}),env:apiEnv});
  assert.equal(res.status,200);const baseline=await res.json();
  assert.equal(baseline.provider_binding.live_source_bound,true);
  assert.equal(baseline.signed_provider_binding.signature_algorithm,'Ed25519');
  assert.doesNotMatch(JSON.stringify(baseline),/secret-provider-token|test-only-company|do-not-expose/);
  res=await onRequestPost({request:post({action:'compare_provider_binding',
    signed_evidence:baseline.signed_provider_binding,staff_user_id:staff,
    planned_followup_at:planned}),env:apiEnv});
  assert.equal(res.status,200);const comparison=(await res.json()).receipt;
  assert.equal(comparison.status,'NO_DRIFT_OBSERVED');
  res=await onRequestPost({request:post({action:'recover_custody_disposition',
    signed_evidence:signedCustody}),env:apiEnv});
  assert.equal(res.status,200);
  assert.equal((await res.json()).receipt.server_record_found,false);
  res=await onRequestPost({request:post({action:'review_owner_ledger_gate',
    signed_evidence:signedLedger,...policy}),env:apiEnv});
  assert.equal(res.status,200);const response=await res.json();
  assert.equal(response.receipt.ledger_activated,false);
  assert.equal(response.signed_receipt.signature_algorithm,'Ed25519');
  assert.equal((await onRequestPost({request:post({action:'review_owner_ledger_gate',
    signed_evidence:signedLedger,...policy,acknowledge_not_activated:false}),env:apiEnv})).status,409);
  assert.ok(providerGets>=2);
  assert.equal(writeAttempts,0);
}finally{globalThis.fetch=previousFetch;}

const root=resolve(import.meta.dirname,'..'),read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['sourceBaseline720','previousBinding720','sourceDrift720','sourceDriftStatus720',
  'custodyRecoveryFile720','custodyRecovery720','custodyRecoveryStatus720','ledgerRequestFile720',
  'ledgerDisposition720','ledgerRetentionDays720','ledgerReviewNote720','ledgerInactiveAck720',
  'ledgerReview720','ledgerReviewStatus720'])assert.match(html,new RegExp(`id="${id}"`));
for(const name of ['captureProviderBaseline720','compareProviderDrift720','recoverCustody720','reviewLedgerGate720'])
  assert.match(js,new RegExp(name));
assert.match(html,/admin-followup-workload-v720\.css/);
assert.match(read('assets/admin-followup-workload-v720.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build720_source_drift_recovery_ledger_gate_test\.mjs/);
console.log('Build 720 PASS: verified on-demand provider drift, current-key custody receipt recovery, distinct owner ledger gate, zero persistence and responsive dashboard');
