// Rosie 913: supervised Stripe Checkout for previously staff-quoted original pickup/stand requests.
// Never reuse service-booking deposits, create synthetic payments or mark a cart paid from a browser redirect.
import {getCurrentCustomerSession} from '../_lib/customer-session.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {retailRpc913,stripe913,stripeCheckoutFields913} from '../_lib/retail-finance-v913.js';
import {financeGuard913} from '../../../assets/build913-retail-provider-contract.mjs';
import {UUID912} from '../../../assets/build912-retail-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestGet=denied,onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin customer account required'},403);
 const guard=financeGuard913(env,'checkout');
 if(!guard.ok)return retailResponse912({ok:false,error:'Retail payment activation HOLD',reason:guard.reason,
   payment_attempted:false},503);
 try{
  const session=await getCurrentCustomerSession({request,env}),p=session?.customer_profile;
  if(!p?.is_active||!p.email_verified_at||!UUID912.test(String(p.id||'')))
    return retailResponse912({ok:false,error:'Verified customer account required'},401);
  const body=await retailRequestBody912(request,1200);
  if(!body||Object.keys(body).sort().join(',')!=='order_id'||!UUID912.test(body.order_id))
   return retailResponse912({ok:false,error:'Valid original retail order ID required'},400);
  const order=await retailRead912(env,'rosie_retail_order_requests_v912?select=id,customer_profile_id,mode,location_id,lines,subtotal_cents,estimated_hst_cents,status'+
   '&id=eq.'+body.order_id+'&customer_profile_id=eq.'+p.id+'&limit=1');
  if(order.length!==1||order[0].status!=='quoted')
   return retailResponse912({ok:false,error:'Staff-quoted original order required before payment'},409);
  const original=order[0];
  // Current stock and location must still exist; an earlier customer quote is not a stock reservation.
  const [goods,places,finance]=await Promise.all([
   retailRead912(env,'rosie_retail_products_v912?select=id,stock_on_hand,active,publish_approved&limit=200'),
   retailRead912(env,'rosie_retail_locations_v912?select=id,mode,active,starts_at,ends_at&id=eq.'+original.location_id+'&limit=1'),
   retailRead912(env,'rosie_retail_finance_v913?select=order_id,provider_session_id,payment_state,total_cents&order_id=eq.'+original.id+'&limit=1')
  ]);
  const place=places[0],now=Date.now();
  if(!place||!place.active||place.mode!==original.mode||['pickup','stand'].includes(place.mode)===false||
   (place.starts_at&&Date.parse(place.starts_at)>now)||
   (place.ends_at&&Date.parse(place.ends_at)<=now))
   return retailResponse912({ok:false,error:'Selected handoff location is not available'},409);
  if(original.lines.some(line=>{
   const x=goods.find(g=>g.id===line.product_id);
   return !x||x.active!==true||x.publish_approved!==true||x.stock_on_hand<line.quantity;
  }))return retailResponse912({ok:false,error:'Original stock changed; staff must revise this quote'},409);
  const origin=new URL(request.url).origin;
  const total=original.subtotal_cents+original.estimated_hst_cents;
  const fields=stripeCheckoutFields913(original,origin,String(p.email||'').trim().toLowerCase());
  if(finance.length){
   const f=finance[0];
   if(f.total_cents!==total||f.payment_state!=='awaiting_provider')
    return retailResponse912({ok:false,error:'Order already paid or has conflicting checkout state'},409);
   const existing=await stripe913(env,'checkout/sessions/'+f.provider_session_id);
   if(existing.id!==f.provider_session_id||existing.client_reference_id!==original.id||
      existing.currency!=='cad'||existing.amount_total!==total||
      existing.status!=='open'||!existing.url)
    return retailResponse912({ok:false,error:'Original provider checkout is no longer open; staff review required'},409);
   return retailResponse912({ok:true,checkout_url:existing.url,provider:'stripe',replay:true,
     charged:false,payment_status:'awaiting_provider'});
  }
  const sessionStripe=await stripe913(env,'checkout/sessions',{
    method:'POST',data:fields,idempotency:'rosie913-retail-'+original.id});
  if(sessionStripe.object!=='checkout.session'||sessionStripe.client_reference_id!==original.id||
   sessionStripe.currency!=='cad'||sessionStripe.amount_total!==total||
   !/^cs_[A-Za-z0-9_]+$/.test(sessionStripe.id)||!/^https:\/\/checkout\.stripe\.com\//.test(sessionStripe.url||''))
    return retailResponse912({ok:false,error:'Stripe session readback failed; no checkout URL released'},503);
  await retailRpc913(env,'rosie_retail_register_checkout_v913',{
   p_order:original.id,p_session:sessionStripe.id,p_total:total});
  return retailResponse912({ok:true,checkout_url:sessionStripe.url,
   provider:'stripe',replay:false,charged:false,payment_status:'awaiting_provider',
   provider_webhook_required:true,invoice_issued:false,stock_reserved:false},201);
 }catch{
  return retailResponse912({ok:false,error:'Original payment source unavailable; no payment acceptance claimed',
   payment_status:'HOLD'},503);
 }
}
