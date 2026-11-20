// Rosie 912: verified-account, server-priced pickup/stand intent. This does not charge or reserve stock.
import {getCurrentCustomerSession} from '../_lib/customer-session.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {priceRetailIntent912,UUID912} from '../../../assets/build912-retail-contract.mjs';
const disabled=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestPut=disabled,onRequestPatch=disabled,onRequestDelete=disabled,onRequestOptions=disabled;
async function account(request,env){
 const session=await getCurrentCustomerSession({request,env}),p=session?.customer_profile;
 return p?.is_active&&UUID912.test(String(p.id||''))?{id:p.id,verified:!!p.email_verified_at}:null;
}
const orderPath=id=>'rosie_retail_order_requests_v912?select=id,mode,location_id,lines,subtotal_cents,estimated_hst_cents,status,request_digest,created_at'+
 '&customer_profile_id=eq.'+id+'&order=created_at.desc&limit=25';
const publicOrder=row=>({id:row.id,mode:row.mode,location_id:row.location_id,
 lines:row.lines,subtotal_cents:row.subtotal_cents,estimated_hst_cents:row.estimated_hst_cents,
 status:row.status,created_at:row.created_at,payment_status:'NOT_ATTEMPTED'});
export async function onRequestGet({request,env}){
 try{
  const p=await account(request,env);
  if(!p)return retailResponse912({ok:false,error:'Sign in to see your pickup/stand requests'},401);
  const rows=await retailRead912(env,orderPath(p.id));
  return retailResponse912({ok:true,requests:rows.map(publicOrder),payment_attempted:false,
   completed_sales:false,stock_reserved:false});
 }catch{return retailResponse912({ok:false,error:'Your retail history is currently unavailable'},503)}
}
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin verified account required'},403);
 try{
  const p=await account(request,env);
  if(!p)return retailResponse912({ok:false,error:'Sign in before placing a request'},401);
  if(!p.verified)return retailResponse912({ok:false,error:'Verify your account email before placing a retail request'},403);
  const raw=await retailRequestBody912(request,4000);
  const [products,locations]=await Promise.all([
   retailRead912(env,'rosie_retail_products_v912?select=id,sku,title,price_cents,stock_on_hand,active,publish_approved&active=eq.true&publish_approved=eq.true&limit=200'),
   retailRead912(env,'rosie_retail_locations_v912?select=id,name,mode,active,starts_at,ends_at&active=eq.true&limit=100')
  ]);
  let cart;try{cart=priceRetailIntent912(raw,products,locations);}catch(e){
   return retailResponse912({ok:false,error:e.message||'Cart requires review',paid:false},409);
  }
  const source=JSON.stringify({mode:cart.mode,location_id:cart.location_id,lines:cart.lines});
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source)))]
   .map(b=>b.toString(16).padStart(2,'0')).join('');
  const idempotency=String(raw.idempotency_key);
  const existing=await retailRead912(env,'rosie_retail_order_requests_v912?select=id,mode,location_id,lines,subtotal_cents,estimated_hst_cents,status,request_digest,created_at'+
   '&customer_profile_id=eq.'+p.id+'&idempotency_key=eq.'+idempotency+'&limit=1');
  if(existing.length){
   if(existing[0].request_digest!==digest)return retailResponse912({ok:false,error:'Request key was already used for a different cart'},409);
   return retailResponse912({ok:true,replay:true,request:publicOrder(existing[0]),payment_attempted:false,stock_reserved:false});
  }
  const rows=await retailRead912(env,'rosie_retail_order_requests_v912?select=id,mode,location_id,lines,subtotal_cents,estimated_hst_cents,status,request_digest,created_at',{
   method:'POST',headers:{Prefer:'return=representation'},
   body:JSON.stringify({customer_profile_id:p.id,idempotency_key:idempotency,request_digest:digest,
    mode:cart.mode,location_id:cart.location_id,lines:cart.lines,
    subtotal_cents:cart.subtotal_cents,estimated_hst_cents:cart.estimated_hst_cents,
    status:'awaiting_staff_review'})});
  if(rows.length!==1||!UUID912.test(String(rows[0].id||''))||rows[0].request_digest!==digest||
   rows[0].status!=='awaiting_staff_review')
   return retailResponse912({ok:false,error:'Original retail request persistence not verified'},503);
  return retailResponse912({ok:true,replay:false,request:publicOrder(rows[0]),
   payment_attempted:false,inventory_reserved:false,estimated_hst_only:true,
   total_due_confirmed:false,staff_contact_required:true},201);
 }catch(e){
  const validation=/JSON|body|Invalid|missing/i.test(e?.message||'');
  return retailResponse912({ok:false,error:validation?'Invalid retail request body':'Original retail source unavailable; no request accepted'},
   validation?400:503);
 }
}
