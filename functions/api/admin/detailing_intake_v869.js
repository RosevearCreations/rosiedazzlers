// Rosie 869: original Supabase private quick-quote review, storage meter and
// deliberate linkage to an EXISTING canonical booking. Never charges or reserves.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
const noStore={'Cache-Control':'no-store'};
const fail=(error,status=400)=>json({ok:false,build:869,error,
 booking_created:false,deposit_collected:false},status,noStore);
const str=(value,max=180)=>String(value??'').trim().slice(0,max);
function ready(env){return /^https:\/\//.test(env.SUPABASE_URL||'')&&
 Boolean(env.SUPABASE_SERVICE_ROLE_KEY);}
const budget=env=>{
 const x=Number(env.ROSIE_PRIVATE_MEDIA_BUDGET_BYTES);
 return Number.isSafeInteger(x)&&x>=104857600&&x<=10737418240?
  x:900*1024*1024; // pilot guard under 1 GiB; not a Supabase plan assertion
};
async function db(env,resource,{method='GET',query='',data}={}){
 const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+resource+query;
 const response=await fetch(url,{
  method,headers:{...serviceHeaders(env),
   ...(method==='GET'?{}:{Prefer:'return=representation'}),
   ...(data===undefined?{}:{'Content-Type':'application/json'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const out=await response.json().catch(()=>null);
 if(!response.ok||!Array.isArray(out))
  throw Error('Original Rosie private data authority unavailable');
 return out;
}
const draftColumns='id,temporary_label,display_title,notes,status,created_at,updated_at,expires_at,'+
 'customer_name,customer_email,customer_phone,contact_permission,private_photo_permission,'+
 'quote_cents,quote_review_state,linked_booking_id,linked_at';
async function draft(env,id){
 const rows=await db(env,'rosie_detailing_intake_v868',{query:
  '?select='+draftColumns+'&id=eq.'+encodeURIComponent(id)+'&limit=2'});
 if(rows.length!==1||rows[0].status!=='intake_draft')
  throw Error('Original private detailing request unavailable');
 return rows[0];
}
async function meter(env){
 const r=await db(env,'rpc/rosie869_storage_meter',{method:'POST',data:{}});
 if(r.length!==1)throw Error('Private quota source unavailable');
 const row=r[0],cap=budget(env),reserved=Number(row.reserved_bytes);
 if(!Number.isSafeInteger(reserved)||reserved<0)
  throw Error('Invalid private storage meter');
 return {storage_provider:'supabase_private',budget_bytes:cap,
  reserved_bytes:reserved,stored_bytes:Number(row.stored_bytes)||0,
  pending_bytes:Number(row.pending_bytes)||0,
  media_count:Number(row.file_count)||0,draft_count:Number(row.draft_count)||0,
  warning:reserved>=cap*0.8,uploads_on_hold:reserved>=cap,
  note:'Estimated reservation usage, not billed Supabase account storage'};
}
const money=cents=>cents===null?null:Number(cents)/100;
export const onRequestOptions=()=>new Response('',{status:204,headers:noStore});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Unsupported staff request',405);
 if(!ready(env))return fail('Private Supabase source unavailable',503);
 if(Number(request.headers.get('content-length'))>12000)return fail('Payload too large',413);
 let body={};
 if(request.method==='POST'){
  const raw=await request.text().catch(()=>'');
  if(raw.length>12000)return fail('Payload too large',413);
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required');}
 }
 const access=await requireStaffAccess({request,env,body,
  capability:'manage_bookings',allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session')return fail('Signed-in booking staff required',403);
 const actor=str(access.actor?.email||access.actor?.id,140);
 if(actor.length<3)return fail('Original staff identity required',403);
 try{
  if(request.method==='GET'){
   const id=new URL(request.url).searchParams.get('draft_id');
   if(id&&!isUuid(id))return fail('Invalid draft ID');
   const selected=id?await draft(env,id):null;
   return json({ok:true,build:869,
    draft:selected,storage:await meter(env),booking_created:false,
    deposit_collected:false,canonical_checkout_required:true},200,noStore);
  }
  const action=str(body.action,60);
  const id=str(body.draft_id,80);
  if(!isUuid(id))return fail('Original saved draft ID required');
  const current=await draft(env,id);
  if(Date.parse(current.expires_at)<=Date.now())
   return fail('Draft expired; owner retention review needed',409);
  if(action==='confirm_private_photo_permission'){
   if(body.confirm_private_photo_permission!==true)
    return fail('Permission for private estimate photos must be confirmed',400);
   const out=await db(env,'rosie_detailing_intake_v868',{method:'PATCH',
    query:'?id=eq.'+encodeURIComponent(id)+'&status=eq.intake_draft',
    data:{private_photo_permission:true,
     photo_permission_recorded_at:new Date().toISOString(),
     updated_at:new Date().toISOString()}});
   if(out.length!==1)throw Error('Photo permission not saved');
   return json({ok:true,build:869,private_photo_permission:true,
    booking_created:false,deposit_collected:false},200,noStore);
  }
  if(current.linked_booking_id)return fail('Already linked to a canonical booking',409);
  if(action==='save_quick_quote'){
   const name=str(body.customer_name,101),phone=str(body.customer_phone,33),
    email=str(body.customer_email,181).toLowerCase();
   const permission=body.contact_permission===true;
   if((name||phone||email)&&!permission)return fail('Customer contact permission required',400);
   if(name&&name.length<2||phone&&(!/^[+0-9().\s-]{7,32}$/.test(phone))||
    email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    return fail('Invalid customer contact details',400);
   if(name.length>100||phone.length>32||email.length>180)
    return fail('Customer contact details too long');
   const value=str(body.quote_cad,24),hasQuote=value!=='';
   if(hasQuote&&!/^(?:\d{1,5})(?:\.\d{1,2})?$/.test(value))
    return fail('Quote must be a Canadian dollar amount, maximum two decimals');
   const cents=hasQuote?Math.round(Number(value)*100):null;
   if(hasQuote&&(cents<1||cents>10000000))
    return fail('Quote outside allowable draft range');
   // This amount is a staff estimate only: checkout pricing remains canonical.
   const change={
    customer_name:permission&&name?name:null,
    customer_phone:permission&&phone?phone:null,
    customer_email:permission&&email?email:null,
    contact_permission:permission,
    quote_cents:cents,quote_review_state:hasQuote?'estimate_prepared':'needs_review',
    updated_at:new Date().toISOString()};
   const out=await db(env,'rosie_detailing_intake_v868',{method:'PATCH',
    query:'?id=eq.'+encodeURIComponent(id)+'&status=eq.intake_draft'+
     '&linked_booking_id=is.null',data:change});
   if(out.length!==1)throw Error('Original quote draft changed');
   return json({ok:true,build:869,draft:out[0],
    quote_cad:money(cents),estimate_not_checkout_price:true,
    booking_created:false,deposit_collected:false},200,noStore);
  }
  if(action==='link_existing_booking'){
   if(body.confirm_canonical_checkout_completed!==true||
    body.acknowledge_deposit_not_verified_here!==true)
    return fail('Confirm real booking exists and deposit status remains unverified',400);
   const bookingId=str(body.booking_id,80);
   if(!isUuid(bookingId))return fail('Exact canonical booking UUID required');
   const out=await db(env,'rpc/rosie869_link_existing_booking',{
    method:'POST',data:{p_draft_id:id,p_booking_id:bookingId,p_actor:actor}});
   if(out.length!==1||out[0].outcome!=='LINKED_NOT_PAYMENT_PROOF')
    throw Error('Verified canonical booking link unavailable');
   return json({ok:true,build:869,linked_booking_id:bookingId,
    quote_cad:money(current.quote_cents),
    canonical_booking_total_cad:money(out[0].booked_total_cents),
    canonical_planned_deposit_cad:money(out[0].booked_deposit_cents),
    booking_created:false,deposit_collected:false,
    payment_proof_requires_provider_verification:true,
    pricing_and_deposit_from_canonical_checkout:true},200,noStore);
  }
  return fail('Unsupported original staff quote action',405);
 }catch(e){return fail(e?.message||'Original Rosie private quote service unavailable',503);}
}
