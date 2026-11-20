// Rosie 913: original customer-owned paid invoices, refund states and 15-minute pickup/stand handoff PIN.
import {getCurrentCustomerSession} from '../_lib/customer-session.js';
import {retailRead912,retailResponse912,retailSameOrigin912,retailRequestBody912} from '../_lib/retail-store-v912.js';
import {retailRpc913} from '../_lib/retail-finance-v913.js';
import {sha256Retail913} from '../../../assets/build913-retail-provider-contract.mjs';
import {UUID912} from '../../../assets/build912-retail-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
async function account(request,env){
 const s=await getCurrentCustomerSession({request,env}),p=s?.customer_profile;
 return p?.is_active&&p.email_verified_at&&UUID912.test(String(p.id||''))?
  {id:p.id,email:String(p.email||'').trim().toLowerCase()}:null;
}
async function ownedOrder(env,p,id){
 const rows=await retailRead912(env,
  'rosie_retail_order_requests_v912?select=id,customer_profile_id,mode,location_id,status,subtotal_cents,estimated_hst_cents'+
  '&id=eq.'+id+'&customer_profile_id=eq.'+p.id+'&limit=1');
 return rows[0]||null;
}
export async function onRequestGet({request,env}){
 try{
  const a=await account(request,env);if(!a)return retailResponse912({ok:false,error:'Verified account required'},401);
  const requested=new URL(request.url).searchParams.get('order_id');
  if(!UUID912.test(String(requested||'')))return retailResponse912({ok:false,error:'Order ID required'},400);
  const o=await ownedOrder(env,a,requested);if(!o)return retailResponse912({ok:false,error:'Order not found in this account'},404);
  const [finance,invoices,refunds,handoff]=await Promise.all([
   retailRead912(env,'rosie_retail_finance_v913?select=payment_state,amount_paid_cents,amount_refunded_cents,paid_at,total_cents'+
    '&order_id=eq.'+o.id+'&limit=1'),
   retailRead912(env,'rosie_retail_invoices_v913?select=invoice_number,subtotal_cents,hst_cents,total_cents,issued_at,tax_review_state'+
    '&order_id=eq.'+o.id+'&limit=1'),
   retailRead912(env,'rosie_retail_refunds_v913?select=amount_cents,status,requested_at,succeeded_at'+
    '&order_id=eq.'+o.id+'&order=requested_at.desc&limit=10'),
   retailRead912(env,'rosie_retail_handoffs_v913?select=handoff_at,issued_at,expires_at'+
    '&order_id=eq.'+o.id+'&limit=1')
  ]);
  return retailResponse912({ok:true,order_id:o.id,mode:o.mode,location_id:o.location_id,
   finance:finance[0]||null,invoice:invoices[0]||null,
   refunds,fulfillment:{staff_handoff_recorded:!!handoff[0]?.handoff_at,
    handoff_at:handoff[0]?.handoff_at||null,customer_code_available:false},
   provider_payout_verified:false,tax_filing_confirmed:false});
 }catch{return retailResponse912({ok:false,error:'Original paid receipt currently unavailable'},503)}
}
export async function onRequestPost({request,env}){
 if(!retailSameOrigin912(request))return retailResponse912({ok:false,error:'Same-origin account required'},403);
 try{
  const a=await account(request,env);if(!a)return retailResponse912({ok:false,error:'Verified customer required'},401);
  const body=await retailRequestBody912(request,500);
  if(!body||Object.keys(body).sort().join(',')!=='action,order_id'||
   body.action!=='issue_handoff_code'||!UUID912.test(String(body.order_id||'')))
   return retailResponse912({ok:false,error:'Invalid original handoff request'},400);
  const o=await ownedOrder(env,a,body.order_id);
  if(!o||o.status!=='quoted')return retailResponse912({ok:false,error:'Quoted original order not found'},404);
  const random=new Uint8Array(12);crypto.getRandomValues(random);
  const token=[...random].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
  await retailRpc913(env,'rosie_retail_issue_handoff_pin_v913',{
   p_order:o.id,p_hash:await sha256Retail913(token)});
  return retailResponse912({ok:true,order_id:o.id,one_time_handoff_code:token,
   valid_minutes:15,show_to_staff_only_in_person:true,code_not_recoverable:true,
   fulfillment_not_confirmed:true});
 }catch{return retailResponse912({ok:false,error:'Original paid invoice or handoff not verified'},503)}
}
