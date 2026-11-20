// Rosie 912: voluntary, first-party, per-day deduplicated interest receipts; no raw browsing surveillance.
import {getCurrentCustomerSession} from '../_lib/customer-session.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {UUID912} from '../../../assets/build912-retail-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestGet=denied,onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin account request required'},403);
 try{
  const session=await getCurrentCustomerSession({request,env}),p=session?.customer_profile;
  if(!p?.is_active||!UUID912.test(String(p.id||''))||!p.email_verified_at)
   return retailResponse912({ok:false,error:'A verified customer account is required'},401);
  const d=await retailRequestBody912(request,1000);
  if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).sort().join(',')!=='analytics_consent,interest_kind,product_id'||
   d.analytics_consent!==true||!UUID912.test(String(d.product_id||''))||
   !['view','save','cart'].includes(d.interest_kind))
   return retailResponse912({ok:false,error:'Explicit interest and consent are required'},400);
  const active=await retailRead912(env,'rosie_retail_products_v912?select=id&id=eq.'+d.product_id+
   '&active=eq.true&publish_approved=eq.true&limit=1');
  if(active.length!==1)return retailResponse912({ok:false,error:'Product not available'},404);
  const today=new Date().toISOString().slice(0,10);
  await retailRead912(env,'rosie_retail_interest_v912?on_conflict=customer_profile_id,product_id,interest_kind,event_day&select=id',{
   method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},
   body:JSON.stringify({customer_profile_id:p.id,product_id:d.product_id,
    interest_kind:d.interest_kind,event_day:today})});
  const proof=await retailRead912(env,'rosie_retail_interest_v912?select=id'+
   '&customer_profile_id=eq.'+p.id+'&product_id=eq.'+d.product_id+
   '&interest_kind=eq.'+d.interest_kind+'&event_day=eq.'+today+'&limit=1');
  if(proof.length!==1)return retailResponse912({ok:false,error:'Interest receipt not independently confirmed'},503);
  return retailResponse912({ok:true,first_party_receipt:true,no_advertising_pixel:true,
   no_social_share:true,no_customer_identity_in_public_analytics:true});
 }catch{return retailResponse912({ok:false,error:'Interest could not be recorded'},503)}
}
