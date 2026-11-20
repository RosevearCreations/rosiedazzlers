// Rosie 913: ORIGINAL Stripe-signed webhook only. Browser/customer/staff cannot declare a sale or refund.
import {retailResponse912} from '../_lib/retail-store-v912.js';
import {retailRpc913} from '../_lib/retail-finance-v913.js';
import {financeGuard913,providerEvent913,verifyStripeSignature913} from '../../../assets/build913-retail-provider-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestGet=denied,onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
export async function onRequestPost({request,env}){
 const guard=financeGuard913(env,'webhook');
 if(!guard.ok)return retailResponse912({ok:false,error:'Retail webhook not enrolled',reason:guard.reason},503);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return retailResponse912({ok:false,error:'Original JSON provider event required'},415);
 const raw=await request.text();
 const original=await verifyStripeSignature913(raw,request.headers.get('stripe-signature'),
  env.STRIPE_RETAIL_WEBHOOK_SECRET_913).catch(()=>false);
 if(!original)return retailResponse912({ok:false,error:'Invalid original Stripe signature'},400);
 let event;try{event=providerEvent913(JSON.parse(raw));}
 catch{return retailResponse912({ok:false,error:'Original Stripe event did not satisfy retail invariants'},400);}
 if(event.kind==='ignored')return retailResponse912({ok:true,ignored:true});
 try{
  if(event.kind==='checkout_paid'){
   const result=await retailRpc913(env,'rosie_retail_settle_stripe_v913',{
    p_order:event.order_id,p_session:event.session_id,
    p_payment_intent:event.payment_intent,p_amount:event.amount_cents,p_event:event.event_id});
   return retailResponse912({ok:true,kind:'checkout_paid',replay:!!result.replay,
    invoice_created:!result.replay,original_db_committed:true});
  }
  if(event.kind==='refund_succeeded'){
   const result=await retailRpc913(env,'rosie_retail_settle_refund_v913',{
    p_refund:event.refund_id,p_amount:event.amount_cents,p_event:event.event_id});
   return retailResponse912({ok:true,kind:'refund_succeeded',replay:!!result.replay,
    original_db_committed:true});
  }
  return retailResponse912({ok:true,ignored:true});
 }catch{return retailResponse912({ok:false,error:'Original provider event not reconciled; Stripe should retry'},503);}
}
