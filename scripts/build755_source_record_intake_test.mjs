import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalSourceRecord755,reviewEconomicSourceRecord755,SOURCE_RECORD_FIELDS755} from '../functions/api/_lib/economic-source-intake-v755.js';
import {canonicalEconomicReceipt754,sha256Receipt754,verifyOwnerEconomicProof754} from '../functions/api/_lib/owner-receipt-verification-v754.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_source_intake_v755.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const b64=buf=>Buffer.from(buf).toString('base64');
const [ownerKey,sourceKey]=await Promise.all([1,2].map(()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const env={ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64:b64(await crypto.subtle.exportKey('raw',ownerKey.publicKey)),
  ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64:b64(await crypto.subtle.exportKey('raw',sourceKey.publicKey)),
  ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID:'owner-key-fixture-755',ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID:'source-key-fixture-755'};
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',old='a'.repeat(64),newer='b'.repeat(64),now=Date.parse('2026-11-03T10:00:00Z');
const record={schema:'rosie-economic-source-record-v755',booking_id:id,period:'2026-11',
  source_correction_reference:'audit-review-755-123',source_system:'catalog_inventory_posting_rows',
  source_record_id:'posting-row-755',source_revision_id:'posting-revision-755',
  source_recorded_at:'2026-11-03T08:45:00Z',source_actor_id:'source-operator-755',
  correction_kind:'consumable_cost_reconciliation',baseline_snapshot_sha256:old,retest_snapshot_sha256:newer,
  original_provenance_reference:'source-audit-755-123'};
const recordHash=await sha256Receipt754(canonicalSourceRecord755(record));
const sourcePayload={schema:'rosie-source-correction-attestation-v754',booking_id:id,period:'2026-11',
  baseline_snapshot_sha256:old,retest_snapshot_sha256:newer,
  source_correction_reference:record.source_correction_reference,source_record_sha256:recordHash,
  issuer_id:'source-witness-755',issuer_role:'inventory_reviewer',issued_at:'2026-11-03T09:00:00Z',
  expires_at:'2026-11-04T09:00:00Z',nonce:'c'.repeat(32),key_id:env.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID};
const ownerPayload={schema:'rosie-owner-economic-receipt-v754',booking_id:id,period:'2026-11',
  baseline_snapshot_sha256:old,retest_snapshot_sha256:newer,
  source_attestation_sha256:await sha256Receipt754(canonicalEconomicReceipt754(sourcePayload,'source')),
  source_correction_reference:record.source_correction_reference,owner_id:'owner-person-755',owner_role:'owner',
  decision:'approve_for_manual_closure_review',issued_at:'2026-11-03T09:10:00Z',
  expires_at:'2026-11-04T09:10:00Z',nonce:'d'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signed=async(payload,kind,key)=>({payload,signature_b64:b64(await crypto.subtle.sign('Ed25519',key,canonicalEconomicReceipt754(payload,kind)))});
const source_attestation=await signed(sourcePayload,'source',sourceKey.privateKey),owner_receipt=await signed(ownerPayload,'owner',ownerKey.privateKey);
const live={ok:true,build:753,source_build:752,period:{year:2026,month:11},snapshot_sha256:newer,
  read_at:'2026-11-03T10:00:00Z',rows:[{booking_id:id,decision_gate:'owner_review_candidate'}],exceptions:[]};
const verdict=await verifyOwnerEconomicProof754({owner_receipt,source_attestation,live,env,now});
assert.equal(verdict.closure_gate,'ELIGIBLE_FOR_MANUAL_CLOSURE_REVIEW');
const test=async(changes={})=>reviewEconomicSourceRecord755({record,owner_receipt,source_attestation,receipt_verification:verdict,
  live,reviewed_at:'2026-11-03T10:05:00Z',...changes});
const valid=await test();
assert.equal(valid.evidence_status,'MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD');
assert.equal(valid.source_record_content_hash_matched,true);
assert.equal(valid.source_record_sha256,recordHash);
assert.equal(valid.owner_receipt_authenticated,true);
assert.equal(valid.source_attestation_authenticated,true);
assert.equal(valid.decision_audit.length,5);
assert.equal(valid.decision_audit.at(-1).status,'not_recorded_source_custody_and_owner_write_pending');
assert.deepEqual(valid.follow_ups.map(x=>x.code),['VERIFY_SOURCE_CUSTODY','RECORD_AUTHORITATIVE_OWNER_DECISION','RETEST_ANY_SUBSEQUENT_DRIFT']);
for(const blocked of ['source_correction_record_verified','source_record_custody_verified','owner_closure_audit_persisted','closure_recorded','closure_allowed','automatic_business_write'])assert.equal(valid[blocked],false,blocked);
assert.match(valid.review_packet_sha256,/^[0-9a-f]{64}$/);
assert.equal((await test({record:{...record,source_record_id:'tampered-row-755'}})).evidence_status,'HOLD_SOURCE_RECORD_HASH_MISMATCH');
assert.equal((await test({record:{...record,period:'2026-10'}})).evidence_status,'HOLD_SOURCE_RECORD_SCOPE');
assert.equal((await test({record:{...record,source_recorded_at:'2026-11-03T09:30:00Z'}})).evidence_status,'HOLD_SOURCE_RECORD_SCOPE');
assert.equal((await test({record:{...record,source_system:'arbitrary_external_table'}})).evidence_status,'HOLD_SOURCE_RECORD_FORMAT');
assert.equal((await test({record:{...record,extra:'invalid'}})).evidence_status,'HOLD_SOURCE_RECORD_FORMAT');
assert.equal((await test({record:null})).evidence_status,'HOLD_SOURCE_RECORD_FORMAT');
const driftVerdict=await verifyOwnerEconomicProof754({owner_receipt,source_attestation,live:{...live,snapshot_sha256:'e'.repeat(64)},env,now});
assert.equal((await test({receipt_verification:driftVerdict})).evidence_status,'HOLD_RECEIPT_OR_SOURCE_RECHECK');
const ownerHold=await signed({...ownerPayload,decision:'retain_hold'},'owner',ownerKey.privateKey);
const retained=await verifyOwnerEconomicProof754({owner_receipt:ownerHold,source_attestation,live,env,now});
assert.equal((await test({owner_receipt:ownerHold,receipt_verification:retained})).evidence_status,'HOLD_RECEIPT_OR_SOURCE_RECHECK');
assert.equal(SOURCE_RECORD_FIELDS755.length,13);
assert.throws(()=>canonicalSourceRecord755({...record,unapproved_extra:'bad'}),/canonical/);

let fetches=0;const priorFetch=globalThis.fetch;globalThis.fetch=async()=>{fetches++;throw Error('Unauthenticated source access');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_source_intake_v755',{
      method:fn===onRequestPost?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(fn===onRequestPost?{body:JSON.stringify({booking_id:id,period:'2026-11',record,source_attestation,owner_receipt})}:{})});
    const response=await fn({request,env:{...env,SUPABASE_URL:'https://invalid.example',SUPABASE_SERVICE_ROLE_KEY:'test-only'}});
    assert.ok(response.status>=400);
  }
  assert.equal(fetches,0);
}finally{globalThis.fetch=priorFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-intake-v755','admin-economic-verify-v754','admin-catalog'])assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`${stem} pretty route`);
assert.match(read('admin-catalog.html'),/admin-economic-intake-v755\.html/);
assert.match(read('admin-economic-verify-v754.html'),/admin-economic-intake-v755\.html/);
assert.match(read('functions/api/admin/economic_source_intake_v755.js'),/sourceRead753/);
assert.doesNotMatch(read('functions/api/admin/economic_source_intake_v755.js'),/fetch\(.*\{method:'(?:POST|PUT|PATCH|DELETE)'/s);
assert.match(read('assets/economic-intake-v755.js'),/credentials:'same-origin'/);
console.log('Build 755 PASS: canonical source-record hash, two independent authentic signatures, derived owner audit, drift/exception HOLD, privacy, read-only route parity.');
