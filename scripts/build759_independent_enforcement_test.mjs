import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditPlanHash758} from '../functions/api/_lib/economic-retention-review-v758.js';
import {canonicalEnforcement759,canonicalDba759,canonicalSecurity759,
  enforcementReadbackURL759,readIndependentEnforcement759,verifyEnforcement759,
  nonprodEnvironment759,verifyTrialApproval759,reconcileReadiness759,
  ENFORCEMENT_FIELDS759,DBA_FIELDS759,SECURITY_FIELDS759} from '../functions/api/_lib/economic-enforcement-audit-v759.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_enforcement_audit_v759.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const encode=value=>Buffer.from(value).toString('base64');
const identities=await Promise.all(Array.from({length:7},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const keyLabels=[
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID']
];
const env={SUPABASE_URL:'https://prod-rosie.supabase.co',ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'https://trial-rosie.supabase.co',
  ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID:'isolated-test-rosie-759',
  ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL:'https://auditor-independent.example'};
for(const [i,[keyName,idName]] of keyLabels.entries()){
  env[keyName]=encode(await crypto.subtle.exportKey('raw',identities[i].publicKey));
  env[idName]=`distinct-custodian-${i}-759`;
}
const record={booking_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',source_record_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const historyHead='a'.repeat(64),retentionHash='b'.repeat(64);
const now=Date.parse('2026-11-03T11:00:00Z');
const retention={independent_provider_receipt_authenticated:true,retention_receipt_sha256:retentionHash,
  object_version_id:'retained-version-759',provider_id:'provider-identity-759'};
const sign=async(payload,canonical,keyIndex)=>({payload,signature_b64:encode(await crypto.subtle.sign('Ed25519',
  identities[keyIndex].privateKey,canonical(payload)))});
const auditPayload={schema:'rosie-storage-enforcement-v759',booking_id:record.booking_id,
  source_record_id:record.source_record_id,history_head_sha256:historyHead,
  retention_receipt_sha256:retentionHash,object_version_id:retention.object_version_id,
  object_checksum_sha256:historyHead,provider_id:retention.provider_id,policy_reference:'policy-compliance-759',
  retention_mode:'COMPLIANCE',audit_scope:'NONPRODUCTION_ISOLATED',
  audit_environment_id:env.ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID,
  overwrite_denial:'DENIED',delete_denial:'DENIED',retention_bypass_denial:'DENIED',
  prior_version_recovered_sha256:historyHead,audited_at:'2026-11-03T10:57:00Z',
  expires_at:'2026-11-03T11:18:00Z',auditor_id:'auditor-independent-759',
  key_id:env.ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID};
const auditEnvelope=await sign(auditPayload,canonicalEnforcement759,4);
const auditReadback={status:'SIGNED_AUDIT_READBACK_RECEIVED',envelope:auditEnvelope};
const verify=async(changes={})=>verifyEnforcement759({env,record,historyHead,retention,readback:auditReadback,now,...changes});
const evidence=await verify();
assert.equal(evidence.status,'SIGNED_NONPROD_STORAGE_ENFORCEMENT_CLAIM_MATCHED');
assert.equal(evidence.independent_storage_audit_authenticated,true);
assert.equal(evidence.storage_enforcement_directly_reproduced,false);
assert.match(evidence.enforcement_receipt_sha256,/^[a-f0-9]{64}$/);
assert.equal(ENFORCEMENT_FIELDS759.length,20);
assert.throws(()=>canonicalEnforcement759({...auditPayload,ignore_me:'injected'}),/Noncanonical/);
for(const changes of [
  {delete_denial:'SUCCEEDED'},{retention_bypass_denial:'SKIPPED'},
  {prior_version_recovered_sha256:'c'.repeat(64)},{audit_scope:'PRODUCTION'},
  {history_head_sha256:'c'.repeat(64)},{retention_receipt_sha256:'c'.repeat(64)},
  {object_version_id:'different-retained-version'},{audited_at:'2026-11-03T09:00:00Z'}
]){
  const signed=await sign({...auditPayload,...changes},canonicalEnforcement759,4);
  assert.equal((await verify({readback:{status:'SIGNED_AUDIT_READBACK_RECEIVED',envelope:signed}})).status,
    'HOLD_STORAGE_AUDIT_SCOPE',JSON.stringify(changes));
}
assert.equal((await verify({readback:{status:'HOLD_STORAGE_AUDIT_PROVIDER_UNAVAILABLE'}})).status,'HOLD_STORAGE_AUDIT_PROVIDER_UNAVAILABLE');
assert.equal((await verify({readback:{status:'SIGNED_AUDIT_READBACK_RECEIVED',
  envelope:await sign(auditPayload,canonicalEnforcement759,0)}})).status,'HOLD_STORAGE_AUDIT_SIGNATURE_INVALID');
assert.equal((await verify({env:{...env,ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64}})).status,
  'HOLD_STORAGE_AUDITOR_INDEPENDENCE');
assert.equal((await verify({env:{...env,ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID:env.ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID}})).status,
  'HOLD_STORAGE_AUDITOR_INDEPENDENCE');
const readUrl=enforcementReadbackURL759(env,record,historyHead,retentionHash);
assert.ok(readUrl.startsWith('https://auditor-independent.example/v1/economic-storage-enforcement-audit?'));
assert.equal(enforcementReadbackURL759({...env,ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL:'https://example.net/path'},record,historyHead,retentionHash),null);
assert.equal(enforcementReadbackURL759({...env,ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL:'http://example.net'},record,historyHead,retentionHash),null);
assert.equal(enforcementReadbackURL759(env,{...record,booking_id:'invalid'},historyHead,retentionHash),null);
let fetched=0;
const readback=await readIndependentEnforcement759(env,record,historyHead,retentionHash,async(url,options)=>{
  fetched++;assert.equal(url,readUrl);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  return new Response(JSON.stringify(auditEnvelope),{status:200});
});
assert.equal(readback.status,'SIGNED_AUDIT_READBACK_RECEIVED');assert.equal(fetched,1);
assert.equal((await readIndependentEnforcement759({},record,historyHead,retentionHash,()=>{throw Error('should never fetch');})).status,
  'HOLD_STORAGE_AUDIT_PROVIDER_UNCONFIGURED');
assert.equal((await readIndependentEnforcement759(env,record,historyHead,retentionHash,
  async()=>new Response('fail',{status:503}))).status,'HOLD_STORAGE_AUDIT_PROVIDER_UNAVAILABLE');

const target=nonprodEnvironment759(env);assert.equal(target.configured,true);
assert.equal(nonprodEnvironment759({...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:env.SUPABASE_URL}).configured,false);
assert.equal(nonprodEnvironment759({...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:'http://local.invalid'}).configured,false);
const auditPlan=await auditPlanHash758();
const dbaPayload={schema:'rosie-dba-trial-review-v759',booking_id:record.booking_id,
  source_record_id:record.source_record_id,history_head_sha256:historyHead,
  retention_receipt_sha256:retentionHash,enforcement_receipt_sha256:evidence.enforcement_receipt_sha256,
  audit_plan_sha256:auditPlan,nonprod_environment_id:target.nonprod_environment_id,
  decision:'approve_nonproduction_trial_review_only',reviewer_id:'dba-custodian-759',
  issued_at:'2026-11-03T10:58:00Z',expires_at:'2026-11-04T10:58:00Z',
  nonce:'d'.repeat(32),key_id:env.ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID};
const signedDba=await sign(dbaPayload,canonicalDba759,5);
const verifyDba=async(changes={})=>verifyTrialApproval759({role:'dba',envelope:signedDba,env,record,
  historyHead,retention,enforcement:evidence,environment:target,now,...changes});
const dba=await verifyDba();assert.equal(dba.signature_authenticated,true);assert.equal(dba.permission_to_run_migration,false);
assert.match(dba.receipt_sha256,/^[a-f0-9]{64}$/);
assert.equal(DBA_FIELDS759.length,14);
assert.equal((await verifyDba({envelope:await sign({...dbaPayload,audit_plan_sha256:'f'.repeat(64)},canonicalDba759,5)})).status,
  'HOLD_APPROVAL_SCOPE');
assert.equal((await verifyDba({envelope:await sign(dbaPayload,canonicalDba759,3)})).status,'HOLD_APPROVAL_SIGNATURE_INVALID');
assert.equal((await verifyDba({env:{...env,ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64:env.ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64}})).status,
  'HOLD_REVIEW_KEY_INDEPENDENCE');
const secPayload={schema:'rosie-security-trial-review-v759',booking_id:record.booking_id,
  source_record_id:record.source_record_id,history_head_sha256:historyHead,
  retention_receipt_sha256:retentionHash,enforcement_receipt_sha256:evidence.enforcement_receipt_sha256,
  audit_plan_sha256:auditPlan,nonprod_environment_id:target.nonprod_environment_id,
  dba_receipt_sha256:dba.receipt_sha256,decision:'approve_nonproduction_trial_review_only',
  reviewer_id:'security-custodian-759',issued_at:'2026-11-03T10:59:00Z',
  expires_at:'2026-11-04T10:59:00Z',nonce:'e'.repeat(32),
  key_id:env.ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID};
const signedSec=await sign(secPayload,canonicalSecurity759,6);
const verifySec=async(changes={})=>verifyTrialApproval759({role:'security',envelope:signedSec,
  env,record,historyHead,retention,enforcement:evidence,environment:target,dba,now,...changes});
const security=await verifySec();assert.equal(security.signature_authenticated,true);
assert.equal(security.permission_to_run_migration,false);
assert.equal(SECURITY_FIELDS759.length,15);
assert.equal((await verifySec({envelope:await sign({...secPayload,dba_receipt_sha256:'f'.repeat(64)},canonicalSecurity759,6)})).status,
  'HOLD_APPROVAL_SCOPE');
assert.equal((await verifySec({envelope:await sign({...secPayload,issued_at:'2026-11-03T10:57:00Z'},canonicalSecurity759,6)})).status,
  'HOLD_APPROVAL_SCOPE');
assert.equal((await verifySec({envelope:await sign(secPayload,canonicalSecurity759,5)})).status,
  'HOLD_APPROVAL_SIGNATURE_INVALID');
assert.equal((await verifySec({dba:{signature_authenticated:false}})).status,'HOLD_APPROVAL_SCOPE');
const prior={history_head_sha256:historyHead,retention_review:retention,
  owner_migration_review:{owner_migration_signature_authenticated:true}};
const ready=await reconcileReadiness759({prior,enforcement:evidence,dba,security,environment:target,
  reviewed_at:'2026-11-03T11:01:00Z'});
assert.equal(ready.trial_readiness_status,'READY_FOR_SEPARATE_NONPROD_TRIAL_AUTHORIZATION');
assert.deepEqual(ready.follow_ups.map(item=>item.code),[
  'SEPARATE_TRIAL_EXECUTION_AUTHORIZATION_REQUIRED','LIVE_ENFORCEMENT_AND_OWNER_CLOSURE_REMAIN_UNVERIFIED'
]);
for(const field of ['storage_enforcement_directly_reproduced','migration_authorized','migration_executed',
  'owner_closure_audit_persisted','closure_allowed','automatic_business_write'])assert.equal(ready[field],false,field);
assert.match(ready.packet_sha256,/^[a-f0-9]{64}$/);
assert.equal((await reconcileReadiness759({})).trial_readiness_status,'HOLD_NONPROD_TRIAL_READINESS');
assert.equal((await reconcileReadiness759({prior,enforcement:evidence,dba,security,
  environment:nonprodEnvironment759({...env,ROSIE_ECONOMIC_NONPROD_SUPABASE_URL:env.SUPABASE_URL})})).trial_readiness_status,
  'HOLD_NONPROD_TRIAL_READINESS');
const originalFetch=globalThis.fetch;let anonymousReads=0;
globalThis.fetch=async()=>{anonymousReads++;throw Error('Unauthenticated external network read');};
try{
  for(const fn of [onRequestGet,onRequestPost]){
    const post=fn===onRequestPost;
    const request=new Request('https://rosiedazzlers.ca/api/admin/economic_enforcement_audit_v759',{
      method:post?'POST':'GET',headers:{Origin:'https://rosiedazzlers.ca','Content-Type':'application/json'},
      ...(post?{body:JSON.stringify({period:'2026-11',booking_id:record.booking_id,source_record:record,
        history_manifest:{},owner_migration_review:{},dba_review:signedDba,security_review:signedSec})}:{})});
    const response=await fn({request,env});assert.ok(response.status>=400);
  }
  assert.equal(anonymousReads,0);
}finally{globalThis.fetch=originalFetch;}
for(const fn of [onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);
for(const stem of ['admin-economic-enforcement-v759','admin-economic-retention-v758','admin-catalog'])
  assert.equal(read(`${stem}.html`),read(`${stem}/index.html`),`route mirror ${stem}`);
assert.match(read('admin-catalog.html'),/admin-economic-enforcement-v759\.html/);
assert.match(read('admin-economic-retention-v758.html'),/admin-economic-enforcement-v759\.html/);
assert.match(read('assets/economic-enforcement-v759.js'),/credentials:'same-origin'/);
assert.doesNotMatch(read('functions/api/admin/economic_enforcement_audit_v759.js'),/method:'(?:PUT|PATCH|DELETE)'/);
assert.match(read('docs/build759_independent_storage_enforcement_dba_trial_readiness.md'),/read-only|read.only/i);
console.log('Build 759 PASS: independent fifth-key GET; denied-op/recovery report binding; DBA→security independent signatures; distinct nonprod target; private read-only review and business closure HOLD.');
