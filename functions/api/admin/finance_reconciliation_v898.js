// Rosie 898: original signed-session finance-only GET; never settle, refund, issue or post.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {projectFinance898,LIMITS898} from '../../../assets/build898-finance-reconciliation.mjs';
const QUERY={
 payments:'quote_deposit_payment_requests?select=id,booking_id,confirmed_booking_id,provider,payment_status,status,provider_status,amount_cents,paid_amount_cents,refunded_amount_cents,processor_fee_cents,currency,provider_event_id,paid_at,updated_at&order=updated_at.desc&limit=60',
 refunds:'quote_deposit_refund_records?select=id,quote_deposit_payment_request_id,booking_id,provider,provider_event_id,refund_status,refund_amount_cents,currency,refunded_at,created_at&order=created_at.desc&limit=100',
 events:'quote_payment_webhook_events?select=id,quote_deposit_payment_request_id,provider,provider_event_id,provider_event_type,status,replay_status,created_at&order=created_at.desc&limit=150',
 applications:'payment_applications?select=id,source_type,source_id,target_type,target_id,booking_id,amount_cents,currency,application_status,created_at&order=created_at.desc&limit=100',
 accounting:'accounting_records?select=id,booking_id,accounting_stage,total_cad,tax_cad,deposit_paid_cad,final_paid_cad,refund_cad,balance_due_cad,created_at&order=created_at.desc&limit=100',
 finalBalances:'final_balance_payment_requests?select=id,booking_id,provider,status,amount_cents,paid_amount_cents,provider_event_id,paid_at,updated_at&order=updated_at.desc&limit=60'
};
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const no=()=>answer({ok:false,error:'Read-only finance reconciliation.'},405);
export const onRequestOptions=no;export const onRequestPost=no;export const onRequestPut=no;export const onRequestPatch=no;export const onRequestDelete=no;
async function read(env,name,path){
 if(!/^https:\/\//.test(String(env?.SUPABASE_URL||'')))throw Error('Private finance authority missing');
 const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{method:'GET',headers:serviceHeaders(env),redirect:'error'});
 if(!res.ok)throw Error('Original '+name+' source unavailable');
 const rows=await res.json();
 if(!Array.isArray(rows)||rows.length>LIMITS898[name])throw Error('Unexpected '+name+' source window');
 return rows;
}
export async function onRequestGet({request,env}){
 const access=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||!hasActionAccess(access.actor,'finance.view')||!hasActionAccess(access.actor,'finance.reconcile'))
  return answer({ok:false,error:'Signed-in finance reconciliation permission required.'},403);
 try{
  const names=Object.keys(QUERY);
  const data=await Promise.all(names.map(name=>read(env,name,QUERY[name])));
  const report=projectFinance898({...Object.fromEntries(names.map((name,i)=>[name,data[i]])),
   sampledAt:new Date().toISOString(),revision:env.CF_PAGES_COMMIT_SHA||null});
  return answer({ok:true,report,authority:{original_signed_finance_session:true,read_only:true,
   payment_capture:false,refund_initiation:false,invoice_issue:false,accounting_post:false,
   tax_filing:false,provider_settlement_certified:false,bank_reconciliation_certified:false,
   master_export:false,customer_contact:false}});
 }catch{return answer({ok:false,error:'Original finance evidence unavailable or inconsistent. Reconciliation HOLD.'},503)}
}
