// Rosie 912: signed-staff retail products, pickup/stand/remote locations, specials, and internal handoff.
import {requireStaffAccess} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {normalizeProduct912,normalizeLocation912,normalizeSpecial912,UUID912} from '../../../assets/build912-retail-contract.mjs';
const fail=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestPut=fail,onRequestPatch=fail,onRequestDelete=fail,onRequestOptions=fail;
async function staff(request,env,write=false){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const canRead=['operations.schedule.view','finance.view','admin.settings.manage'].some(x=>hasActionAccess(a.actor,x));
 const canWrite=['operations.schedule.manage','admin.settings.manage'].some(x=>hasActionAccess(a.actor,x));
 if(a.auth_mode!=='session'||!(write?canWrite:canRead))
  return {response:retailResponse912({ok:false,error:'Signed-in staff permission required'},403)};
 return {actor:a.actor};
}
const select={
 products:'rosie_retail_products_v912?select=id,sku,title,description,category,price_cents,stock_on_hand,active,publish_approved,supplier_review_id,created_at&order=created_at.desc&limit=200',
 locations:'rosie_retail_locations_v912?select=id,name,mode,service_area,customer_directions,active,starts_at,ends_at&order=created_at.desc&limit=100',
 specials:'rosie_retail_specials_v912?select=id,code,title,location_id,percent_off,active,quote_required,starts_at,ends_at&order=created_at.desc&limit=100',
 orders:'rosie_retail_order_requests_v912?select=id,customer_profile_id,mode,location_id,lines,subtotal_cents,estimated_hst_cents,status,created_at&order=created_at.desc&limit=100',
 interest:'rosie_retail_interest_v912?select=product_id,interest_kind,event_day&order=created_at.desc&limit=1000'
};
const source=(env,key)=>retailRead912(env,select[key]);
export async function onRequestGet({request,env}){
 const access=await staff(request,env);if(access.response)return access.response;
 try{
  const [products,locations,specials,orders,interest]=await Promise.all(
   ['products','locations','specials','orders','interest'].map(key=>source(env,key)));
  const aggregated=new Map();
  for(const row of interest){
   const key=String(row.product_id)+':'+String(row.interest_kind);
   const previous=aggregated.get(key)||{product_id:row.product_id,kind:row.interest_kind,count:0};
   previous.count+=1;aggregated.set(key,previous);
  }
  return retailResponse912({ok:true,products,locations,specials,orders,
   interest_aggregate:[...aggregated.values()].sort((a,b)=>b.count-a.count).slice(0,50),
   interest_window:'latest_1000_source_receipts_only',source:'ORIGINAL_ROSIE_SUPABASE',
   money_collected:false,inventory_reserved:false,provider_settlement_verified:false,
   customer_identifiers_excluded_from_analytics:true,daip_auto_published:false});
 }catch{return retailResponse912({ok:false,error:'Original retail source unavailable; no completion assumed'},503)}
}
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin staff request required'},403);
 const access=await staff(request,env,true);if(access.response)return access.response;
 try{
  const body=await retailRequestBody912(request,6000);
  if(!body||typeof body!=='object'||Array.isArray(body)||!['product','location','special','order_review'].includes(body.action)
   ||Object.keys(body).some(x=>!['action','data'].includes(x)))
   return retailResponse912({ok:false,error:'Unknown staff retail action'},400);
  const d=body.data||{};
  let saved,action=body.action;
  if(action==='product'){
   const p=normalizeProduct912(d);
   if(p.supplier_review_id){
    const linked=await retailRead912(env,'rosie_supplier_reviews_v911?select=id,publication_status&id=eq.'+p.supplier_review_id+'&limit=1');
    if(linked.length!==1)return retailResponse912({ok:false,error:'Supplier source must exist in Rosie original private records'},409);
   }
   saved=await retailRead912(env,'rosie_retail_products_v912?on_conflict=sku&select=id,sku,title,active,publish_approved,supplier_review_id',{
    method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({
     ...p,created_by_staff_user_id:UUID912.test(String(access.actor?.id||''))?access.actor.id:null,
     updated_at:new Date().toISOString()})});
  }else if(action==='location'){
   saved=await retailRead912(env,'rosie_retail_locations_v912?select=id,name,mode,active',{
    method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(normalizeLocation912(d))});
  }else if(action==='special'){
   const s=normalizeSpecial912(d);
   const locations=await retailRead912(env,'rosie_retail_locations_v912?select=id,mode,active&id=eq.'+s.location_id+'&limit=1');
   if(locations.length!==1||locations[0].mode!=='remote_service')
    return retailResponse912({ok:false,error:'Special must refer to an original remote-service location'},409);
   saved=await retailRead912(env,'rosie_retail_specials_v912?on_conflict=code&select=id,code,title,active,quote_required',{
    method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(s)});
  }else{
   if(!d||Object.keys(d).some(k=>!['order_id','status'].includes(k))||
      !UUID912.test(String(d.order_id||''))||!['quoted','cancelled'].includes(d.status))
    return retailResponse912({ok:false,error:'Order review requires existing request and a safe disposition'},400);
   saved=await retailRead912(env,'rosie_retail_order_requests_v912?id=eq.'+d.order_id+
    '&status=eq.awaiting_staff_review&select=id,status,updated_at',{
    method:'PATCH',headers:{Prefer:'return=representation'},
    body:JSON.stringify({status:d.status,updated_at:new Date().toISOString()})});
   if(saved.length!==1)return retailResponse912({ok:false,error:'Request already reviewed or changed; reload'},409);
  }
  if(saved.length!==1||!UUID912.test(String(saved[0].id||'')))
   return retailResponse912({ok:false,error:'Original write readback not confirmed'},503);
  return retailResponse912({ok:true,action,item:saved[0],private_staff_write:true,
   charged:false,refund_issued:false,shipping_confirmed:false,stock_reserved:false,
   daip_published:false},201);
 }catch(e){
  const validation=/Invalid|Unknown|Unexpected|required|must|Stock|Price|SKU|Quantity|date|location|fields|limit|discount|Special|not approved|range|JSON|too large|supplier/i.test(e?.message||'');
  return retailResponse912({ok:false,error:validation?e.message:'Retail source unavailable; no write claimed'},validation?400:503);
 }
}
