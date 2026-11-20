// Rosie 913: signed-staff retail finance, refund authorization and handoff custody.
import {requireStaffAccess} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {retailRpc913,stripe913} from '../_lib/retail-finance-v913.js';
import {financeGuard913,normalizeRefundCommand913,sha256Retail913} from '../../../assets/build913-retail-provider-contract.mjs';
import {UUID912} from '../../../assets/build912-retail-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
async function staff(request,env,action){
 const auth=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!auth.ok)return {response:auth.response};
 const finance=['finance.view','finance.reconcile'].every(k=>hasActionAccess(auth.actor,k));
 const operations=hasActionAccess(auth.actor,'operations.schedule.manage')||
  hasActionAccess(auth.actor,'admin.settings.manage');
 const refund=hasActionAccess(auth.actor,'finance.refund.manage');
 const permission=action==='read'?finance||operations:action==='handoff'?operations:finance&&refund;
 if(auth.auth_mode!=='session'||!permission||!UUID912.test(String(auth.actor?.id||'')))
  return {response:retailResponse912({ok:false,error:'Original signed staff authority required'},403)};
 return {actor:auth.actor};
}
export async function onRequestGet({request,env}){
 const auth=await staff(request,env,'read');if(auth.response)return auth.response;
 try{
  const [orders,finance,invoices,refunds,handoffs,events]=await Promise.all([
   retailRead912(env,'rosie_retail_order_requests_v912?select=id,mode,location_id,status,lines,subtotal_cents,estimated_hst_cents,created_at&order=created_at.desc&limit=50'),
   retailRead912(env,'rosie_retail_finance_v913?select=order_id,provider,payment_state,total_cents,amount_paid_cents,amount_refunded_cents,paid_at,updated_at&order=updated_at.desc&limit=50'),
   retailRead912(env,'rosie_retail_invoices_v913?select=id,order_id,invoice_number,subtotal_cents,hst_cents,total_cents,issued_at,tax_review_state&order=issued_at.desc&limit=50'),
   retailRead912(env,'rosie_retail_refunds_v913?select=id,order_id,amount_cents,reason,status,provider_refund_id,requested_at,succeeded_at&order=requested_at.desc&limit=50'),
   retailRead912(env,'rosie_retail_handoffs_v913?select=order_id,issued_at,expires_at,attempts,confirmed_by_staff_user_id,customer_present_attested,handoff_at,handoff_note&order=issued_at.desc&limit=50'),
   retailRead912(env,'rosie_retail_provider_events_v913?select=order_id,event_kind,occurred_at&order=occurred_at.desc&limit=100')
  ]);
  return retailResponse912({ok:true,source:'ORIGINAL_ROSIE_SUPABASE',orders,finance,invoices,refunds,handoffs,
   provider_event_counts:events.reduce((r,x)=>(r[x.event_kind]=(r[x.event_kind]||0)+1,r),{}),
   activation:financeGuard913(env,'checkout'),
   refund_activation:financeGuard913(env,'refund'),
   bank_settlement_confirmed:false,accountant_tax_filing_confirmed:false,
   terminal_pos_witnessed:false,physical_delivery_independently_witnessed:false});
 }catch{return retailResponse912({ok:false,error:'Original retail finance source unavailable; no accepted status'},503)}
}
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin signed staff session required'},403);
 let body;try{body=normalizeRefundCommand913(await retailRequestBody912(request,2000));}
 catch(e){return retailResponse912({ok:false,error:e.message||'Invalid privileged request'},400)}
 const action=body.action,scope=action==='handoff'?'handoff':'refund';
 const auth=await staff(request,env,scope);if(auth.response)return auth.response;
 try{
  if(action==='handoff'){
   // Handoff is only after the original paid-invoice state, independently rechecked in locked SQL.
   const receipt=await retailRpc913(env,'rosie_retail_confirm_handoff_v913',{
    p_order:body.order_id,p_staff:auth.actor.id,p_hash:await sha256Retail913(body.pin),
    p_attested:true,p_note:body.note});
   return retailResponse912({ok:true,receipt,staff_attested:true,
    independent_physical_witness:false,financial_posting:false,customer_contact:false});
  }
  const guard=financeGuard913(env,'refund');
  if(!guard.ok)return retailResponse912({ok:false,error:'Refund provider activation HOLD',
    reason:guard.reason,refund_attempted:false},503);
  if(action==='request_refund'){
   const receipt=await retailRpc913(env,'rosie_retail_request_refund_v913',{
    p_order:body.order_id,p_staff:auth.actor.id,p_amount:body.amount_cents,p_reason:body.reason});
   return retailResponse912({ok:true,receipt,refund_requested:true,
    provider_refund_attempted:false,refund_succeeded:false});
  }
  const list=await retailRead912(env,'rosie_retail_refunds_v913?select=id,order_id,amount_cents,status,provider_refund_id'+
   '&id=eq.'+body.refund_id+'&order_id=eq.'+body.order_id+'&limit=1');
  const refund=list[0];if(!refund||refund.status!=='requested')
   return retailResponse912({ok:false,error:'Only original requested refunds can reach Stripe'},409);
  const finance=await retailRead912(env,'rosie_retail_finance_v913?select=order_id,payment_state,provider_payment_intent_id,amount_paid_cents,amount_refunded_cents'+
   '&order_id=eq.'+body.order_id+'&limit=1');
  const f=finance[0];
  if(!f||!['paid','partial_refund'].includes(f.payment_state)||
   !/^pi_[A-Za-z0-9_]+$/.test(String(f.provider_payment_intent_id||''))||
   refund.amount_cents>f.amount_paid_cents-f.amount_refunded_cents)
   return retailResponse912({ok:false,error:'Provider paid balance has changed; refund HOLD'},409);
  const provider=await stripe913(env,'refunds',{method:'POST',idempotency:'rosie913-refund-'+refund.id,
   data:{payment_intent:f.provider_payment_intent_id,amount:String(refund.amount_cents),
    reason:'requested_by_customer','metadata[rosie_retail_refund_id]':refund.id}});
  if(provider.object!=='refund'||!/^re_[A-Za-z0-9_]+$/.test(String(provider.id||''))||
   provider.amount!==refund.amount_cents)
   return retailResponse912({ok:false,error:'Original Stripe refund readback invalid; inspect provider ledger'},503);
  const receipt=await retailRpc913(env,'rosie_retail_record_refund_provider_v913',{
   p_refund:refund.id,p_provider_refund:provider.id});
  return retailResponse912({ok:true,receipt,
   provider_refund_id:provider.id,provider_status:provider.status,
   refund_succeeded:false,await_signed_webhook:true,accounting_posted:false});
 }catch{
  return retailResponse912({ok:false,error:'Original staff/Stripe transaction not corroborated; review provider directly',
   refund_succeeded:false,checkout_paid_not_assumed:true},503);
 }
}
