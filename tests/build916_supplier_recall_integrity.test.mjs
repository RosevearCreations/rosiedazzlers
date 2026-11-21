import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRevocation916,classifyRecall916,validateDeviceEvidence916,financialIntegrity916} from '../assets/build916-revocation-recall-device-contract.mjs';
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const publication={id,publication_state:'revoked',channel:'youtube'};
const receipt={publication_id:id,provider_owner_id:'UC1234567890123456789012',provider_object_id:'abcdefghijk',channel:'youtube'};
const hash='a'.repeat(64);
test('916: only scoped original publication withdrawal reasons, no arbitrary payload',()=>{
 assert.deepEqual(validateRevocation916({publication_id:id,reason:'customer_consent_withdrawn'}),{publication_id:id,reason:'customer_consent_withdrawn'});
 assert.throws(()=>validateRevocation916({publication_id:id,reason:'customer_consent_withdrawn',private_email:'person@example.com'}));
 assert.throws(()=>validateRevocation916({publication_id:id,reason:'test_fixture'}));
 assert.throws(()=>validateRevocation916({publication_id:'bad',reason:'owner_publication_withdrawn'}));
});
test('916: original video still public => external recall failed / pending',()=>{
 const v=classifyRecall916({publication,receipt,probe:{ok:true,provider:{owner_id:receipt.provider_owner_id,id:receipt.provider_object_id,public:true}}});
 assert.equal(v.status,'ORIGINAL_POST_STILL_PUBLIC');assert.equal(v.external_recalled,false);
});
test('916: 404, unavailable tokens, wrong account or unknown status can NEVER certify global provider deletion',()=>{
 for(const probe of [{ok:false,reason:'PROVIDER_NETWORK_OR_RESPONSE_HOLD'},{ok:false,reason:'NOT_FOUND'},{ok:true,provider:{id:'wrong',owner_id:receipt.provider_owner_id,public:false}},null]){
  const v=classifyRecall916({publication,receipt,probe});assert.equal(v.status,'EXTERNAL_RECALL_UNVERIFIED');assert.equal(v.external_recalled,false);
 }
});
test('916: missing original provider receipt cannot certify recall',()=>{
 const v=classifyRecall916({publication,receipt:null,probe:{ok:false,reason:'NOT_FOUND'}});
 assert(v.blockers.includes('ORIGINAL_PROVIDER_RECEIPT_REQUIRED'));
});
test('916: mobile/desktop device evidence requires actual scoped SHA256, never independent by default',()=>{
 const e={publication_id:id,device_class:'mobile',role_tested:'admin',browser_family:'safari',scenario:'supplier_recall',outcome:'blocked',evidence_sha256:hash};
 const v=validateDeviceEvidence916(e);assert.equal(v.independent_witnessed,false);assert.equal(v.synthetic_not_accepted,true);
 for(const bad of [{...e,evidence_sha256:'fake'},{...e,role_tested:'superuser'},{...e,customer_name:'Jane'}, {...e,device_class:'robot'}])assert.throws(()=>validateDeviceEvidence916(bad));
});
test('916: original finance documentary review does not infer sales, ROAS or alter accounts',()=>{
 const v=financialIntegrity916({originalJournal:{id:other,status:'posted'},review:{publication_id:id,journal_entry_id:other}});
 assert.equal(v.eligible,true);assert.equal(v.attributed_revenue_cents,null);assert.equal(v.roas,null);
 assert.equal(financialIntegrity916({originalJournal:{id:other,status:'draft'},review:{publication_id:id,journal_entry_id:other}}).eligible,false);
 assert.equal(financialIntegrity916({originalJournal:{id:other,status:'posted'},review:{publication_id:id,journal_entry_id:id}}).eligible,false);
});
test('916: unique original revocation plus terminal guard RLS and isolated finance, device and recall tables',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261121140000_build916_supplier_revocation_recall_device_finance.sql',import.meta.url),'utf8');
 for(const table of ['rosie_supplier_revocations_v916','rosie_supplier_recall_observations_v916','rosie_supplier_device_evidence_v916','rosie_supplier_financial_reviews_v916']){
  assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'));
  assert.match(sql,new RegExp('revoke all on table public\\.'+table+' from public, anon, authenticated'));
 }
 assert.match(sql,/publication_id uuid not null unique references public\.rosie_supplier_publication_v914\(id\)/);
 assert.match(sql,/where id=p_publication_id for update/);
 assert.match(sql,/publication_state='revoked'/);
 assert.match(sql,/REVOKED_PUBLICATION_IS_TERMINAL/);
 assert.match(sql,/check \(revenue_attributed_cents is null\)/);
 assert.doesNotMatch(sql,/grant (select|insert|update|delete).* to anon/i);
});
test('916: original protected recall API blocks forged input and cannot declare provider deletion',()=>{
 const source=readFileSync(new URL('../functions/api/admin/supplier_recall_v916.js',import.meta.url),'utf8');
 assert.match(source,/allowLegacyAdminFallback:false/);
 assert.match(source,/a\.auth_mode!=='session'/);
 assert.match(source,/SAME_ORIGIN_REQUIRED/);
 assert.match(source,/ORIGINAL_CUSTOMER_CONSENT_WITHDRAWAL_NOT_RECORDED/);
 assert.match(source,/readOriginalProvider915/);
 assert.match(source,/provider_recall_verified:false/);
 assert.match(source,/financial_ledgers_unchanged:true/);
 assert.doesNotMatch(source,/method:'DELETE'/);
});
test('916: attribution remains fail-closed on revoked original publication',()=>{
 const attr=readFileSync(new URL('../functions/api/public/supplier_attribution_v915.js',import.meta.url),'utf8');
 assert.match(attr,/pub\.publication_state!=='provider_verified'/);
 assert.match(attr,/review\.received_verified!==true/);
 assert.match(attr,/ROSIE_ATTRIBUTION_ENABLED/);
});
test('916: device screenshot hashing is local and is not uploaded',()=>{
 const ui=readFileSync(new URL('../assets/build916-supplier-recall-ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(ui,/file.*\.files\[0\]/);
 assert.doesNotMatch(ui,/new FormData|new FileReader|body:.*bytes|object_key/);
});
