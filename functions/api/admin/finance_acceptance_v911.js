// Build 911: original finance evidence, not a substitute for Stripe/PayPal/bank/accountant proof.
import {onRequestGet as getSource898} from './finance_reconciliation_v898.js';
import {buildFinanceAcceptance911} from '../../../assets/build911-finance-acceptance.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Vary':'Cookie'}});
const deny=()=>json({ok:false,error:'Read-only original finance evidence.'},405);
export const onRequestPost=deny,onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
export async function onRequestGet({request,env}){
 const original=await getSource898({request,env});
 if(!original.ok)return original;
 try{
  const body=await original.json();
  if(!body.ok||!body.report)return json({ok:false,error:'Original finance authority did not confirm a report.'},503);
  const acceptance=buildFinanceAcceptance911(body.report);
  return json({ok:true,acceptance,scope:{supplier_review_financial_posting:false,
   remote_location_pricing_authority:false,no_automatic_revenue_booking:true}});
 }catch{
  return json({ok:false,error:'Original finance acceptance source incomplete; no settlement claimed.'},503);
 }
}
