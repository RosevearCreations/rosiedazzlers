import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {ownsBooking908,allowedReview908,summarizeMedia908,revision908} from '../functions/api/_lib/customer-account-review-v908.js';
import {safeProviderReference908,deliveryEvidenceState908,verifyWitnessSignature908,normalizeWitness908} from '../functions/api/_lib/recovery-deliverability-v908.js';
import {approvedProviderUrl908} from '../functions/api/checkout_recovery.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const profile='80e040ba-a17b-469f-8997-d62b69e95007';
const booking='c1d834eb-e99c-4266-9f40-8b1f168bad1c';
const other='992df6d5-663b-479a-8f91-bb0733490ccd';
const revision='a'.repeat(64);
test('908: profile-bound bookings never move across customers',()=>{
 assert.equal(ownsBooking908({id:booking,customer_profile_id:profile,customer_email:'wrong@example.com'},profile,'user@example.com'),true);
 assert.equal(ownsBooking908({id:booking,customer_profile_id:other,customer_email:'user@example.com'},profile,'user@example.com',true),false);
 assert.equal(ownsBooking908({id:booking,customer_profile_id:null,customer_email:'user@example.com'},profile,'user@example.com',false),false);
 assert.equal(ownsBooking908({id:booking,customer_profile_id:null,customer_email:'user@example.com'},profile,'user@example.com',true),true);
});
test('908: only exact-source explicit review acknowledgements accepted',async()=>{
 const valid={kind:'quote',subject_id:booking,revision,acknowledged:true};
 assert.equal(allowedReview908(valid),true);
 assert.equal(allowedReview908({...valid,acknowledged:false}),false);
 assert.equal(allowedReview908({...valid,consent:true}),false);
 assert.equal(allowedReview908({...valid,subject_id:other,kind:'public_media_release'}),false);
 assert.notEqual(await revision908(['quote',booking,'v1']),await revision908(['quote',booking,'v2']));
});
test('908: unverified private upload never receives a review receipt',()=>{
 const a=summarizeMedia908([
  {id:booking,status:'pending',content_type:'image/jpeg',verified_at:null},
  {id:other,status:'uploaded',content_type:'video/mp4',verified_at:'2026-11-18T12:00:00Z'}
 ]);
 assert.equal(a.count,1);assert.equal(a.images,0);assert.equal(a.videos,1);
});
test('908: only approved payment-provider HTTPS domains can be resumed',()=>{
 assert.equal(approvedProviderUrl908('https://checkout.stripe.com/pay/cs_123','stripe'),true);
 assert.equal(approvedProviderUrl908('https://www.paypal.com/checkoutnow?token=1','paypal'),true);
 for(const bad of ['https://checkout.stripe.com.evil.example/c','http://checkout.stripe.com/pay','javascript:alert(1)','https://evil.example/pay'])
  assert.equal(approvedProviderUrl908(bad,'stripe'),false);
 assert.equal(approvedProviderUrl908('https://www.paypal.com.evil.example/pay','paypal'),false);
});
test('908: provider HTTP acceptance is not independent delivery',()=>{
 assert.equal(deliveryEvidenceState908({ok:true,status:200,provider_response:{}}),'no_provider_reference');
 assert.equal(deliveryEvidenceState908({ok:false,status:503}),'provider_unavailable');
 assert.equal(deliveryEvidenceState908({ok:true,status:202,provider_response:{message_id:'provider-event-12345'}}),'provider_accepted');
 assert.equal(safeProviderReference908({provider_response:{message_id:'test@example.com'}}),'test@example.com'); 
 assert.equal(safeProviderReference908({provider_response:{message_id:'token with spaces'}}),null);
 assert.equal(normalizeWitness908({provider_reference:'provider-event-12345',status:'delivered',observed_at:new Date().toISOString()})?.status,'delivered');
 assert.equal(normalizeWitness908({provider_reference:'provider-event-12345',status:'accepted',observed_at:new Date().toISOString()}),null);
});
test('908: witness requires fresh independent HMAC, rejects tampering and replay window',async()=>{
 const secret='r'.repeat(48),timestamp=String(Math.floor(Date.now()/1000));
 const body=JSON.stringify({provider_reference:'provider-event-12345',status:'delivered',observed_at:new Date().toISOString()});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body)));
 const signature=[...signed].map(x=>x.toString(16).padStart(2,'0')).join('');
 assert.equal(await verifyWitnessSignature908({secret,timestamp,body,signature}),true);
 assert.equal(await verifyWitnessSignature908({secret,timestamp,body:body+' ',signature}),false);
 assert.equal(await verifyWitnessSignature908({secret,timestamp,body,signature,now:Date.now()+6*60*1000}),false);
 assert.equal(await verifyWitnessSignature908({secret:'',timestamp,body,signature}),false);
});
test('908: no direct media URL or secret returns from workspace; no email-only checkout recovery',()=>{
 const client=readFileSync(new URL('../functions/api/client/booking_reviews_v908.js',import.meta.url),'utf8');
 const resume=readFileSync(new URL('../functions/api/checkout_recovery.js',import.meta.url),'utf8');
 const witness=readFileSync(new URL('../functions/api/recovery_delivery_witness_v908.js',import.meta.url),'utf8');
 assert.match(client,/email_verification_required/);
 assert.match(client,/source_revision=eq/);
 assert.doesNotMatch(client,/checkout_url:/);
 assert.doesNotMatch(client,/object_path[,:]/);
 assert.match(resume,/owner!==current.customer_profile.id/);
 assert.match(resume,/ownership_required/);
 assert.match(witness,/NO_MATCHING_UNWITNESSED_DISPATCH/);
});
