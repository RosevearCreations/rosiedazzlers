import test from 'node:test';
import assert from 'node:assert/strict';
import {assessProviderReceipt915,summarizeAttribution915} from '../assets/build915-provider-proof-contract.mjs';
const id='11111111-1111-4111-8111-111111111111',asset='22222222-2222-4222-8222-222222222222';
const publication={id,publication_state:'approved_pending_provider',channel:'youtube',consent_record_id:asset,approved_asset_ids:[asset]};
const identity={channel:'youtube',owner_id:'channel-123456'};
const provider={channel:'youtube',owner_id:'channel-123456',id:'video_123456',public:true,published:true,observed_at:new Date().toISOString(),canonical_url:'https://www.youtube.com/watch?v=video_123456',media_type:'video'};
test('915: matched independently read original provider video, current consent is necessary',()=>{
 assert.equal(assessProviderReceipt915({publication,identity,provider,consentStillValid:true}).verified,true);
});
test('915: missing consent, stale probe, unpublished post, wrong provider and draft cannot become VERIFIED',()=>{
 const cases=[
 {consentStillValid:false},{provider:{...provider,public:false}},{provider:{...provider,owner_id:'other-owner'}},
 {provider:{...provider,observed_at:'2020-01-01T00:00:00Z'}},{publication:{...publication,publication_state:'provider_verified'}},
 {provider:{...provider,media_type:'image'}},{identity:{...identity,channel:'facebook'}}
 ];
 for(const x of cases)assert.equal(assessProviderReceipt915({publication,identity,provider,consentStillValid:true,...x}).verified,false);
});
test('915: attribution suppresses small groups and rejects identifying fields',()=>{
 const event={publication_id:id,source:'youtube',event_kind:'landing',event_day:'2026-11-20'};
 assert.deepEqual(summarizeAttribution915(Array(4).fill(event)),[]);
 assert.equal(summarizeAttribution915(Array(5).fill(event))[0].count,5);
 assert.throws(()=>summarizeAttribution915([{...event,customer_email:'private@example.com'}]));
 assert.throws(()=>summarizeAttribution915([{...event,ip_address:'10.1.1.1'}]));
});
