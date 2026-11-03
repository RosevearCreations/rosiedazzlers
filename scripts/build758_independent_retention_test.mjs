import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sha256Receipt754} from '../functions/api/_lib/owner-receipt-verification-v754.js';
import {auditPlanHash758,canonicalRetentionReceipt758,canonicalOwnerMigration758,
  retentionReadbackURL758,readIndependentRetention758,verifyIndependentRetention758,
  verifyOwnerAuditMigrationReview758,reconcileClosure758,RETENTION_FIELDS758,OWNER_MIGRATION_FIELDS758} from '../functions/api/_lib/economic-retention-review-v758.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_retention_review_v758.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const encode=data=>Buffer.from(data).toString('base64');
const [owner,witness,custodian,providerKey]=await Promise.all([0,1,2,3].map(()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'private-fixture-only',
  ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL:'https://independent-retention.example',
  ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64:encode(await crypto.subtle.exportKey('raw',owner.publicKey)),
  ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID:'real-owner-key-758',
  ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64:encode(await crypto.subtle.exportKey('raw',witness.publicKey)),
  ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID:'real-source-witness-key-758',
  ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64:encode(await crypto.subtle.exportKey('raw',custodian.publicKey)),
  ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID:'real-history-key-758',
  ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64:encode(await crypto.subtle.exportKey('raw',providerKey.publicKey)),
  ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID:'real-provider-key-758'};
const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',recordId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const record={booking_id:booking,source_record_id:recordId};
const head='a'.repeat(64),now=Date.parse('2026-11-03T11:00:00Z');
const payload={schema:'rosie-independent-retention-proof-v758',booking_id:booking,source_record_id:recordId,
  history_head_sha256:head,object_version_id:'object-version-758',object_checksum_sha256:head,
  provider_id:'external-provider-758',retention_mode:'COMPLIANCE',retain_until:'2026-12-03T11:00:00Z',
  policy_reference:'external-policy-758',observed_at:'2026-11-03T10:57:00Z',
  expires_at:'2026-11-03T11:20:00Z',issuer_id:'independent-provider-signer-758',
  key_id:env.ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID};
const signRetention=async(p,key=providerKey.privateKey)=>({payload:p,signature_b64:encode(await crypto.subtle.sign('Ed25519',key,canonicalRetentionReceipt758(p)))});
const receipt=await signRetention(payload);
const provider={status:'PROVIDER_READBACK_RECEIVED',envelope:receipt};
const verify=async(changes={})=>verifyIndependentRetention758({env,record,head,provider,now,...changes});
const verified=await verify();
assert.equal(verified.retention_status,'SIGNED_PROVIDER_LOCK_CLAIM_MATCHED_IMMUTABILITY_AUDIT_PENDING');
assert.equal(verified.independent_provider_receipt_authenticated,true);
assert.equal(verified.provider_live_readback_matched,true);
assert.match(verified.retention_receipt_sha256,/^[a-f0-9]{64}$/);
assert.equal(verified.immutable_retention_verified,false);
assert.equal(verified.storage_immutability_independently_audited,false);
assert.equal((await verify({provider:{status:'HOLD_RETENTION_PROVIDER_UNAVAILABLE'}})).retention_status,'HOLD_RETENTION_PROVIDER_UNAVAILABLE');
assert.equal((await verify({provider:{status:'PROVIDER_READBACK_RECEIVED',envelope:await signRetention({...payload,history_head_sha256:'b'.repeat(64)})}})).retention_status,'HOLD_RETENTION_PROOF_SCOPE');
assert.equal((await verify({provider:{status:'PROVIDER_READBACK_RECEIVED',envelope:await signRetention({...payload,object_checksum_sha256:'b'.repeat(64)})}})).retention_status,'HOLD_RETENTION_PROOF_SCOPE');
assert.equal((await verify({provider:{status:'PROVIDER_READBACK_RECEIVED',envelope:await signRetention({...payload,observed_at:'2026-11-03T10:00:00Z'})}})).retention_status,'HOLD_RETENTION_PROOF_SCOPE');
assert.equal((await verify({provider:{status:'PROVIDER_READBACK_RECEIVED',envelope:await signRetention({...payload,retention_mode:'GOVERNANCE'})}})).retention_status,'HOLD_RETENTION_PROOF_SCOPE');
assert.equal((await verify({provider:{status:'PROVIDER_READBACK_RECEIVED',envelope:await signRetention(payload,owner.privateKey)}})).retention_status,'HOLD_RETENTION_SIGNATURE_INVALID');
assert.equal((await verify({env:{...env,ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).retention_status,'HOLD_RETENTION_PROVIDER_INDEPENDENCE');
assert.throws(()=>canonicalRetentionReceipt758({...payload,extra:'unsafe'}),/canonical/);
assert.equal(RETENTION_FIELDS758.length,14);

const url=retentionReadbackURL758(env,record,head);
assert.ok(url.startsWith('https://independent-retention.example/v1/economic-retention-proof?'));
assert.match(url,/source_record_id=bbbbbbbb/);
assert.equal(retentionReadbackURL758({...env,ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL:'http://internal.local'},record,head),null);
assert.equal(retentionReadbackURL758({...env,ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL:'https://example.com/x'},record,head),null);
assert.equal(retentionReadbackURL758(env,{...record,source_record_id:'some-text'},head),null);
let calls=0;
const actualRead=await readIndependentRetention758(env,record,head,async(input,opts)=>{
  calls++;assert.equal(input,url);assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
  return new Response(JSON.stringify(receipt),{status:200});
});
assert.equal(actualRead.status,'PROVIDER_READBACK_RECEIVED');assert.equal(calls,1);
assert.equal((await readIndependentRetention758(env,record,head,async()=>new Response('not-found',{status:404}))).status,'HOLD_RETENTION_PROVIDER_UNAVAILABLE');
assert.equal((await readIndependentRetention758({},record,head,async()=>{throw Error('no request');})).status,'HOLD_INDEPENDENT_RETENTION_PROVIDER_NOT_CONFIGURED');

const plan=await auditPlanHash758();assert.match(plan,/^[a-f0-9]{64}$/);
const ownerPayload={schema:'rosie-owner-migration-review-v758',booking_id:booking,source_record_id:recordId,
  history_head_sha256:head,retention_receipt_sha256:verified.retention_receipt_sha256,
  audit_plan_sha256:plan,decision:'request_independent_migration_review',owner_id:'owner-person-758',
  issued_at:'2026-11-03T10:58:00Z',expires_at:'2026-11-04T10:58:00Z',
  nonce:'b'.repeat(32),key_id:env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID};
const signOwner=async(p,key=owner.privateKey)=>({payload:p,signature_b64:encode(await crypto.subtle.sign('Ed25519',key,canonicalOwnerMigration758(p)))});
const ownerReview=await signOwner(ownerPayload);
const review=async(changes={})=>verifyOwnerAuditMigrationReview758({envelope:ownerReview,env,record,history_head:head,retention:verified,now,...changes});
const ownerResult=await review();
assert.equal(ownerResult.migration_review_status,'SIGNED_OWNER_DBA_REVIEW_REQUEST_ONLY');
assert.equal(ownerResult.owner_migration_signature_authenticated,true);
assert.equal(ownerResult.audit_migration_authorized,false);
assert.equal(ownerResult.audit_migration_executed,false);
assert.equal((await review({envelope:await signOwner({...ownerPayload,audit_plan_sha256:'f'.repeat(64)})})).migration_review_status,'HOLD_MIGRATION_REVIEW_SCOPE');
assert.equal((await review({envelope:await signOwner({...ownerPayload,retention_receipt_sha256:'f'.repeat(64)})})).migration_review_status,'HOLD_MIGRATION_REVIEW_SCOPE');
assert.equal((await review({envelope:await signOwner(ownerPayload,witness.privateKey)})).migration_review_status,'HOLD_MIGRATION_OWNER_SIGNATURE_INVALID');
assert.equal((await review({retention:{...verified,independent_provider_receipt_authenticated:false}})).migration_review_status,'HOLD_MIGRATION_REVIEW_SCOPE');
assert.throws(()=>canonicalOwnerMigration758({...ownerPayload,unreviewed:'bad'}),/canonical/);
assert.equal(OWNER_MIGRATION_FIELDS758.length,12);

const prior={preflight_sha256:'f'.repeat(64),history_verification:{history_chain_integrity_verified:true,
  independent_history_head_signature_verified:true}};
const closure=await reconcileClosure758({prior,retention:verified,migration:ownerResult,reviewed_at:'2026-11-03T11:01:00Z'});
assert.deepEqual(closure.follow_ups.map(x=>x.code),['IMMUTABLE_RETENTION_ENFORCEMENT_UNAUDITED',
  'DBA_SECURITY_MIGRATION_AUTHORIZATION_MISSING','CLOSURE_EVIDENCE_PERSISTENCE_NOT_AUTHORIZED']);
assert.match(closure.reconciliation_sha256,/^[a-f0-9]{64}$/);
for(const field of ['immutable_retention_verified','audit_migration_authorized','audit_migration_executed',
  'owner_closure_audit_persisted','closure_authorized','closure_recorded','closure_allowed','automatic_business_write'])
  assert.equal(closure[field],false,field);
const blocked=await reconcileClosure758({});assert.ok(blocked.blocking_count>=5);

const originalFetch=globalThis.fetch;let unauthorizedReads=0;
globalThis.fetch=async()=>{unauthorizedReads++;throw Error('Unexpected anonymous source read');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_retention_review_v758',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({period:'2026-11',booking_id:booking,source_record:record,
        history_manifest:{},owner_migration_review:ownerReview})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(unauthorizedReads,0);
}finally{globalThis.fetch=originalFetch;}
for(const method of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await method()).status,405);
for(const stem of ['admin-economic-retention-v758','admin-economic-history-v757','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror: ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-retention-v758\.html/);
assert.match(read('admin-economic-history-v757.html'),/admin-economic-retention-v758\.html/);
assert.match(read('assets/economic-retention-v758.js'),/credentials:'same-origin'/);
assert.match(read('docs/build758_independent_retention_owner_audit_migration_reconciliation.md'),/DESIGN|design-only/);
assert.doesNotMatch(read('functions/api/admin/economic_retention_review_v758.js'),/fetch\([^\n]*method:'(?:POST|PUT|PATCH|DELETE)'/);
console.log('Build 758 PASS: independent provider GET and fourth-key signature, exact locked-version claim, owner audit plan binding, immutable-enforcement HOLD, no migrations, no closure, private route parity.');
