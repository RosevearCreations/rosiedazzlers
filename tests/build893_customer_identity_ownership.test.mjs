import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCheckoutCustomerIdentity} from '../functions/api/_lib/checkout-customer-identity.js';

const profileId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const selectedId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const request=(cookie='')=>new Request('https://rosiedazzlers.ca/api/checkout',{headers:cookie?{cookie}:{}});
const signed=async()=>({customer_profile:{id:profileId}});
const noSession=async()=>({customer_profile:null});
const loader=async()=>({id:selectedId,customer_profile_id:profileId,vehicle_name:'Synthetic test vehicle'});
const query=(body={},sessionResolver=signed,vehicleLoader=loader,req=request())=>
  resolveCheckoutCustomerIdentity({request:req,env:{},body,sessionResolver,vehicleLoader});

test('server never trusts a browser-supplied profile ID, even with matching session',async()=>{
 const r=await query({customer_profile_id:profileId});
 assert.equal(r.ok,false);assert.equal(r.reason,'client_profile_id_rejected');
});
test('saved vehicle must be scoped to the actual authenticated customer session',async()=>{
 const ok=await query({customer_vehicle_id:selectedId});
 assert.equal(ok.ok,true);
 assert.equal(ok.customer_profile_id,profileId);
 assert.equal(ok.customer_vehicle_id,selectedId);
 assert.equal(ok.source,'authenticated_saved_vehicle');
 const wrong=await query({customer_vehicle_id:selectedId},signed,
   async()=>({id:selectedId,customer_profile_id:otherId}));
 assert.equal(wrong.ok,false);
 assert.equal(wrong.reason,'saved_vehicle_ownership_failed');
 const absent=await query({customer_vehicle_id:selectedId},signed,async()=>null);
 assert.equal(absent.ok,false);
});
test('forged garage cookie and signed-out saved vehicle fail closed',async()=>{
 const cookie=request('rd_booking_vehicle_selector='+encodeURIComponent(selectedId));
 const unauth=await query({},noSession,loader,cookie);
 assert.equal(unauth.ok,false);
 assert.equal(unauth.reason,'saved_vehicle_requires_session');
 const forged=await query({customer_vehicle_id:otherId},signed,loader,cookie);
 assert.equal(forged.ok,false);
 assert.equal(forged.reason,'saved_vehicle_selector_conflict');
 const cookieOnly=await query({},signed,loader,cookie);
 assert.equal(cookieOnly.ok,true);
 assert.equal(cookieOnly.customer_vehicle_id,selectedId);
});
test('guest booking stays possible without pretending garage ownership',async()=>{
 const guest=await query({},noSession);
 assert.equal(guest.ok,true);assert.equal(guest.authenticated,false);
 assert.equal(guest.customer_profile_id,null);
 assert.equal(guest.customer_vehicle_id,null);
});
