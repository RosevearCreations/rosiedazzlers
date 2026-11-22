import assert from 'node:assert/strict';
import {validate917,evaluate917} from '../assets/build917-source-evidence-contract.mjs';
import {readFileSync} from 'node:fs';
const a='123e4567-e89b-42d3-a456-426614174000';
const b='123e4567-e89b-42d3-a456-426614174001';
const c='123e4567-e89b-42d3-a456-426614174002';
const h='a'.repeat(64);
const original={id:a,publication_state:'revoked',channel:'youtube'};
const providers=[{id:b,publication_id:a,channel:'youtube'}];
const revocations=[{publication_id:a}];
const witness=[{id:b,publication_id:a,outcome:'passed',witnessed_by_staff_id:b}];
const native=[{publication_id:a,provider_receipt_id:b}];
const surfaces=[{publication_id:a,surface_kind:'origin',observed_state:'staff_reported_removed'},
{publication_id:a,surface_kind:'mirror',observed_state:'staff_reported_removed'}];
const second=[{publication_id:a,device_evidence_id:b,witnessed_by_staff_id:c}];
const financeReviews=[{publication_id:a,journal_entry_id:b}];
const financeChains=[{publication_id:a,journal_entry_id:b}];
const complete=evaluate917({publication:original,revocations,providerReceipts:providers,
nativeReceipts:native,surfaces,deviceReports:witness,secondWitnesses:second,financeReviews,financeChains});
assert.equal(complete.business_state,'HOLD');
assert.equal(complete.overall_green,false);
assert.equal(complete.provider_native_takedown_verified,false);
assert.equal(complete.worldwide_recall_verified,false);
assert.equal(complete.causal_revenue_verified,false);
assert.equal(complete.revenue_attributed_cents,null);
assert.equal(complete.counts.distinct_second_staff_reports,1);
assert.equal(evaluate917({}).overall_green,false);
assert.ok(evaluate917({publication:original,revocations,providerReceipts:providers,
 nativeReceipts:native,surfaces,deviceReports:witness,secondWitnesses:[{...second[0],witnessed_by_staff_id:b}]}).blockers.includes('DISTINCT_SECOND_DEVICE_WITNESS_REQUIRED'));
for(const input of [
 {action:'surface',publication_id:a,surface_kind:'mirror',surface_host:'evil.com/path',observed_state:'unavailable',evidence_sha256:h},
 {action:'native_receipt',publication_id:a,provider_receipt_id:b,provider_case_reference:'case1',receipt_sha256:h},
 {action:'second_witness',publication_id:a,device_evidence_id:b,evidence_sha256:'fake'},
 {action:'finance_chain',publication_id:a,journal_entry_id:b,payment_source_sha256:h,customer_source_sha256:h,amount:999}
])assert.throws(()=>validate917(input));
const valid=validate917({action:'surface',publication_id:a,surface_kind:'mirror',surface_host:'example.org',observed_state:'unavailable',evidence_sha256:h});
assert.equal(valid.observed_state,'unavailable');
const sql=readFileSync('sql/2026-11-21_build917_source_evidence_custody.sql','utf8');
for(const table of ['native_takedown','recall_surfaces','device_second_witness','finance_chain'])assert.ok(sql.includes('rosie_supplier_'+table+'_v917'));
for(const token of ['enable row level security','revoke all','grant select,insert','second_staff_attested_unverified','attributed_revenue_cents bigint check(attributed_revenue_cents is null)'])assert.ok(sql.includes(token));
console.log('Build917 fail-closed source custody, separate witnesses and null causal revenue PASS');
