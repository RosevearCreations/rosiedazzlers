import { requireStaffAccess, json, methodNotAllowed } from '../_lib/staff-auth.js';
import { serviceHeaders } from '../_lib/inventory-posting.js';
import { buildOperationalProfitabilityReport } from '../_lib/accounting-gl.js';
import { buildMarginReview751 } from '../_lib/margin-review-v751.js';

const readOnly=()=>json({ok:false,error:'Build 751 is a read-only owner margin review; no price, travel, inventory, accounting, booking or seasonal rule can be changed here.'},405);
const safeDate=(value)=>String(value||'').slice(0,10);
async function read(env,table,query,limit){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`,{headers:serviceHeaders(env)});
  if(!res.ok)throw Error(`${table} source unavailable (${res.status}). Review remains unavailable.`);
  const rows=await res.json();
  if(!Array.isArray(rows)||rows.length>=limit)throw Error(`${table} source may be truncated; choose a smaller period or request an independently paginated evidence review.`);
  return rows;
}

export async function onRequestGet({request,env}){
  try{
    const access=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
    if(!access.ok)return access.response;
    if(access.auth_mode!=='session')return json({ok:false,error:'A signed-in inventory/finance manager is required.'},403);
    const url=new URL(request.url),month=Number(url.searchParams.get('month')),year=Number(url.searchParams.get('year'));
    if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2100)return json({ok:false,error:'Specify a valid month and year.'},400);
    const start=`${year}-${String(month).padStart(2,'0')}-01`,next=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);
    // The existing pricing-catalog module imports bundled JSON; load it after
    // authorization to keep unauthenticated requests independent of catalog I/O.
    const {loadPricingCatalog}=await import('../_lib/pricing-catalog.js');
    const [economics,catalog]=await Promise.all([buildOperationalProfitabilityReport(env,{month,year}),loadPricingCatalog(env)]);
    if(!Array.isArray(economics.rows)||economics.rows.length>=999)throw Error('Accounting source may be truncated; cannot infer completed-job margins.');
    const ids=[...new Set(economics.rows.map(row=>String(row.booking_id||'').trim()).filter(Boolean))];
    if(!ids.length)return json({ok:true,...buildMarginReview751({economics,catalog,source_status:{accounting:'available',bookings:'not_required',travel:'not_required',posting:'not_required',catalog:'app_management_or_bundled_fallback'}}),period:{month,year,start,next},read_only:true});
    if(ids.length>=150||ids.some(id=>!/^[0-9a-f-]{36}$/i.test(id)))throw Error('Booking review sample is too large or contains invalid references; review the accounting source first.');
    const keys=ids.join(',');
    const sourceQueries=[
      ['accounting_records',new URLSearchParams({select:'booking_id,package_code,vehicle_size,service_date',service_date:`gte.${start}`,and:`(service_date.lt.${next})`,limit:'500'}),500],
      ['bookings',new URLSearchParams({select:'id,package_code,vehicle_size,service_date,service_area_zone,service_area_county,service_area_municipality',id:`in.(${keys})`,limit:'150'}),150],
      ['job_time_entries',new URLSearchParams({select:'id,booking_id,staff_user_id,entry_type,event_time,created_at,source,minutes',booking_id:`in.(${keys})`,source:'eq.shift_v748',order:'event_time.asc,created_at.asc',limit:'500'}),500],
      ['catalog_inventory_posting_batches',new URLSearchParams({select:'id,booking_id,source_kind,source_reference_id,created_at,status,accounting_status,row_count',source_kind:'eq.booking',source_reference_id:`in.(${keys})`,limit:'250'}),250]
    ];
    const [accounts,bookings,punches,batches]=await Promise.all(sourceQueries.map(([table,query,limit])=>read(env,table,query,limit)));
    const batchIds=batches.map(row=>row.id);
    const rows=batchIds.length?await read(env,'catalog_inventory_posting_rows',new URLSearchParams({select:'id,batch_id,item_key,item_name,quantity,unit_label,unit_cost_cents,previous_qty,new_qty,movement_id,status',batch_id:`in.(${batchIds.join(',')})`,limit:'500'}),500):[];
    const review=buildMarginReview751({economics,accounting_rows:accounts,bookings,shift_punches:punches,posting_batches:batches,posting_rows:rows,catalog,
      source_status:{accounting:'available',bookings:'available',travel:'available',posting:'available',catalog:'app_management_or_bundled_fallback'}});
    return json({ok:true,...review,period:{month,year,start:safeDate(start),next:safeDate(next)},generated_at:new Date().toISOString(),read_only:true});
  }catch(err){return json({ok:false,build:751,error:String(err?.message||'Margin evidence unavailable.').slice(0,450),read_only:true},503);}
}
export async function onRequestPost(){return readOnly();}
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{'Access-Control-Allow-Methods':'GET,OPTIONS','Cache-Control':'no-store'}});}
