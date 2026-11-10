// Build 832 — signed finance/admin-only, bounded source-only GET. No business writes.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {projectJobEconomics832} from '../../../assets/build832-job-economics.mjs';

const QUERY={
  bookings:'bookings?select=id,created_at,status&order=created_at.desc,id.desc&limit=40',
  finance:'accounting_records?select=id,booking_id,created_at,accounting_stage,subtotal_cad,total_cad,tax_cad,deposit_paid_cad,final_paid_cad,other_paid_cad,tip_cad,refund_cad,collected_total_cad,balance_due_cad&order=created_at.desc,id.desc&limit=40',
  inventory:'catalog_inventory_movements?select=id,booking_id,created_at,movement_type,qty_delta,reversal_of_movement_id&order=created_at.desc,id.desc&limit=200',
  time:'job_time_entries?select=id,booking_id,created_at,entry_type,minutes&order=created_at.desc,id.desc&limit=200',
  journals:'accounting_journal_entries?select=id,created_at,reference_type,reference_id,entry_type,status,total_cad,tax_cad&order=created_at.desc,id.desc&limit=200',
  payroll:'staff_payroll_runs?select=id,created_at,period_start,period_end,status&order=created_at.desc,id.desc&limit=40'
};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer'}});
const authorized=actor=>String(actor?.role_code||'').toLowerCase()==='admin'&&
  actor.can_manage_bookings===true&&actor.can_manage_staff===true&&
  hasActionAccess(actor,'operations.assignment.manage');
async function read(env,query,limit){
  const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+query,{method:'GET',
    headers:serviceHeaders(env),redirect:'error'});
  if(!r.ok)throw Error('Source query failed');
  const rows=await r.json();
  if(!Array.isArray(rows)||rows.length>limit)throw Error('Malformed source window');
  return rows;
}
export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);
export const onRequestPost=()=>respond({ok:false,error:'Read-only reconciliation.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!authorized(access.actor))return respond({ok:false,error:'Signed finance administrator required.'},403);
  try{
    const bookings=await read(env,QUERY.bookings,40);
    const ids=bookings.map(r=>r.id);
    if(ids.some(id=>typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)))throw Error('Malformed booking scope');
    const filter='in.('+ids.join(',')+')';
    const [finance,inventory,time,journals,payroll]=await Promise.all([
      ids.length?read(env,QUERY.finance+'&booking_id='+filter,40):[],
      ids.length?read(env,QUERY.inventory+'&booking_id='+filter,200):[],
      ids.length?read(env,QUERY.time+'&booking_id='+filter,200):[],
      ids.length?read(env,QUERY.journals+'&reference_id='+filter,200):[],
      read(env,QUERY.payroll,40)
    ]);
    const report=projectJobEconomics832({bookings,finance,inventory,time,journals,payroll,
      sampledAt:new Date().toISOString(),revision:env.CF_PAGES_COMMIT_SHA});
    return respond({ok:true,build:832,report,sourceAuthority:{
      signed_finance_admin_required:true,server_only_select:true,read_only:true,
      payroll_run_not_job_linked:true,no_customer_or_staff_identity_returned:true,
      no_payroll_inventory_finance_or_invoice_mutation:true,no_tax_filing:true,
      no_master_submission:true,canonical_hold_changed:false}});
  }catch{return respond({ok:false,error:'Private economics source unavailable or incomplete; no financial outcome inferred.'},503);}
}
