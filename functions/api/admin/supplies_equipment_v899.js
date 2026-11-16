// Rosie 899: signed operations supervisor, private source review and append-only evidence.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {LIMITS899,normalizeReview899,projectSupplies899} from '../../../assets/build899-supplies-equipment.mjs';
const paths={
 items:'catalog_inventory_items?select=id,item_type,name,qty_on_hand,reorder_point,reorder_qty,unit_label,assigned_station,is_active&order=updated_at.desc&limit=150',
 purchaseOrders:'catalog_purchase_orders?select=id,item_id,status,qty_ordered,ordered_at,received_at,reminder_at&order=created_at.desc&limit=100',
 movements:'catalog_inventory_movements?select=id,item_id,movement_type,qty_delta,is_reversed,created_at&order=created_at.desc&limit=150',
 service:'rosie_equipment_service_v899?select=id,inventory_item_id,event_kind,service_type,due_date,recorded_at,staff_report_unverified,owner_verified&order=recorded_at.desc&limit=80',
 counts:'rosie_inventory_count_reviews_v899?select=id,inventory_item_id,review_kind,observed_qty,catalog_qty_snapshot,observed_on,recorded_at,staff_report_unverified,owner_approved,stock_adjustment_applied&order=recorded_at.desc&limit=80'
};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const readonly=()=>respond({ok:false,error:'Unsupported maintenance operation.'},405);
export const onRequestOptions=readonly;
export const onRequestPatch=readonly;
export const onRequestPut=readonly;
export const onRequestDelete=readonly;
async function authorize(request,env){
 const access=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!access.ok)return access;
 const role=String(access.actor?.role_code||'').toLowerCase();
 if(access.auth_mode!=='session'||!isUuid(access.actor?.id)||
  !['admin','operations_manager'].includes(role)||!hasActionAccess(access.actor,'operations.assignment.manage'))
  return {ok:false,response:respond({ok:false,error:'Original signed operations supervisor access required.'},403)};
 return access;
}
async function read(env,path,limit){
 if(!/^https:\/\//.test(String(env.SUPABASE_URL||'')))throw Error('Private inventory database unavailable');
 const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{method:'GET',headers:serviceHeaders(env),redirect:'error'});
 if(!res.ok)throw Error('Private inventory query unavailable');
 const rows=await res.json().catch(()=>null);
 if(!Array.isArray(rows)||rows.length>limit)throw Error('Malformed source window');
 return rows;
}
export async function onRequestGet({request,env}){
 const access=await authorize(request,env);if(!access.ok)return access.response;
 try{
  const names=Object.keys(paths),data=await Promise.all(names.map(k=>read(env,paths[k],LIMITS899[k])));
  const report=projectSupplies899({...Object.fromEntries(names.map((n,i)=>[n,data[i]])),
   revision:env.CF_PAGES_COMMIT_SHA||null,now:new Date()});
  return respond({ok:true,report,authority:{signed_session:true,source_is_original:true,
   staff_report_not_owner_verified:true,service_not_physical_certification:true,
   quantity_not_adjusted:true,orders_not_placed:true,no_accounting_or_master_calls:true}});
 }catch{return respond({ok:false,error:'Original inventory or private maintenance schema unavailable. Evidence HOLD.'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return respond({ok:false,error:'Same-origin staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return respond({ok:false,error:'JSON is required.'},415);
 const access=await authorize(request,env);if(!access.ok)return access.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1300)return respond({ok:false,error:'Review is too large.'},413);
 let input;try{input=JSON.parse(raw)}catch{return respond({ok:false,error:'Invalid JSON.'},400)}
 const plan=normalizeReview899(input);
 if(!plan.ok)return respond({ok:false,error:plan.error},400);
 const table=plan.kind==='service'?'rosie_equipment_service_v899':'rosie_inventory_count_reviews_v899';
 try{
  const item=await read(env,'catalog_inventory_items?select=id,item_type,is_active,qty_on_hand&id=eq.'+plan.inventory_item_id+'&limit=1',1);
  if(!item[0]||item[0].is_active!==true)return respond({ok:false,error:'Active inventory item not found.'},404);
  if(plan.kind==='service'&&item[0].item_type!=='tool')return respond({ok:false,error:'Equipment maintenance is restricted to original tool assets.'},409);
  const prev=await read(env,table+'?select=*&client_request_id=eq.'+plan.client_request_id+'&limit=1',1);
  if(prev.length){
   const x=prev[0],same=x.inventory_item_id===plan.inventory_item_id&&x.staff_user_id===access.actor.id&&
    (plan.kind==='service'?x.event_kind===plan.event_kind&&x.service_type===plan.service_type&&
      x.due_date===plan.due_date&&x.service_note===plan.service_note:
      x.review_kind===plan.review_kind&&x.observed_on===plan.observed_on&&
      Number(x.observed_qty)===Number(plan.observed_qty)&&x.staff_note===plan.staff_note);
   return same?respond({ok:true,duplicate:true,review_id:x.id,source_recorded:true,
    owner_verified:false,stock_adjusted:false,messages_sent:0}):
    respond({ok:false,error:'Request ID is already used for a different observation.'},409);
  }
  let saved={
   client_request_id:plan.client_request_id,inventory_item_id:plan.inventory_item_id,
   staff_user_id:access.actor.id,staff_report_unverified:true
  };
  if(plan.kind==='service')saved={...saved,event_kind:plan.event_kind,service_type:plan.service_type,
   due_date:plan.due_date,service_note:plan.service_note,owner_verified:false,actual_equipment_service_certified:false};
  else{
   const qty=String(item[0].qty_on_hand??'');
   if(!/^-?\d{1,10}(?:\.\d{1,3})?$/.test(qty))return respond({ok:false,error:'Original catalog count cannot be snapshotted safely.'},503);
   saved={...saved,review_kind:plan.review_kind,observed_qty:plan.observed_qty,
    catalog_qty_snapshot:qty,observed_on:plan.observed_on,staff_note:plan.staff_note,
    owner_approved:false,stock_adjustment_applied:false};
  }
  const res=await fetch(env.SUPABASE_URL+'/rest/v1/'+table+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([saved])});
  if(res.status===409)return respond({ok:false,error:'Concurrent request key used. Refresh before retry.'},409);
  if(!res.ok)return respond({ok:false,error:'Original review log write unavailable. No inventory or service authority changed.'},503);
  const rows=await res.json().catch(()=>null);
  if(!Array.isArray(rows)||!isUuid(rows[0]?.id))return respond({ok:false,error:'Original evidence readback missing. Refresh before retry.'},503);
  return respond({ok:true,review_id:rows[0].id,kind:plan.kind,source_recorded:true,
   staff_report_unverified:true,owner_verified:false,stock_adjusted:false,accounting_posted:false,orders_placed:0},201);
 }catch{return respond({ok:false,error:'Original private source unavailable. No inventory/maintenance conclusion inferred.'},503)}
}
