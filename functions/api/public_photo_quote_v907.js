// Rosie 907 — explicit private PHOTO-TO-QUOTE staff lead, no checkout or auto-send.
// Verifies original object receipt custody and binds uploads to the real original staff queue.
import {serviceHeaders} from './_lib/customer-session.js';
import {cleanQuote907,sha256Receipt907,validOriginalUpload907} from './_lib/photo-quote-907.js';
const reply=(obj,code=200)=>new Response(JSON.stringify(obj),{status:code,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
 'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const deny=()=>reply({ok:false,error:'Only explicit customer quote requests are accepted.'},405);
export const onRequestGet=deny,onRequestPut=deny,onRequestDelete=deny,onRequestOptions=deny;
async function lookup(env,intake_id){
 const url=String(env.SUPABASE_URL).replace(/\/+$/,'')+
  '/rest/v1/photo_estimate_uploads?select='+encodeURIComponent(
   'id,intake_id,upload_proof_hash,created_at,verified_at,status,lead_id,booking_id,bucket,object_path,content_type')+
  '&intake_id=eq.'+intake_id+'&limit=1';
 const res=await fetch(url,{headers:serviceHeaders(env),cache:'no-store'});
 if(!res.ok)throw Error('Original upload custody temporarily unavailable.');
 const rows=await res.json().catch(()=>[]);return Array.isArray(rows)?rows[0]||null:null;
}
async function prior(env,client_request_id){
 const res=await fetch(env.SUPABASE_URL+'/rest/v1/public_inquiry_leads?select='+encodeURIComponent(
  'id,client_request_id,full_name,email,source_path,status')+
  '&client_request_id=eq.'+client_request_id+'&limit=1',{
  headers:serviceHeaders(env),cache:'no-store'});
 if(!res.ok)throw Error('Prior request readback unavailable.');
 const x=await res.json().catch(()=>[]);return Array.isArray(x)?x[0]||null:null;
}
async function linkedCount(env,leadId){
 const res=await fetch(env.SUPABASE_URL+'/rest/v1/photo_estimate_uploads?select=id&lead_id=eq.'+
 leadId+'&limit=6',{headers:serviceHeaders(env),cache:'no-store'});
 if(!res.ok)return null;
 const a=await res.json().catch(()=>null);return Array.isArray(a)?a.length:null;
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return reply({ok:false,error:'Same-origin quote request required.'},403);
 const size=Number(request.headers.get('content-length')||0);
 if(size>7000)return reply({ok:false,error:'Quote request too large.'},413);
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)
  return reply({ok:false,error:'Quote request service is unavailable; no quote saved.'},503);
 let raw;try{raw=await request.json()}catch{return reply({ok:false,error:'Valid JSON required.'},400)}
 const x=cleanQuote907(raw);
 if(!x.ok)return reply({ok:false,error:x.error},400);
 if(x.website)return reply({ok:true,lead_recorded:false,ignored:true,no_contact_sent:true});
 try{
  const previous=await prior(env,x.client_request_id);
  if(previous){
   if(previous.source_path!==((x.topic==='manual_custom')?'/book-custom':'/booking-planner')||
    previous.full_name!==x.full_name||previous.email!==x.email)
    return reply({ok:false,error:'Original quote request ID conflicts with another request.'},409);
   const count=await linkedCount(env,previous.id);
   return reply({ok:true,lead_recorded:true,duplicate:true,lead_id:previous.id,
    linked_upload_count:count,linkage_verified:count!==null,
    automatic_send:false,quote_approved:false,booking_created:false});
  }
  const originals=[];
  for(const receipt of x.photo_receipts){
   const row=await lookup(env,receipt.intake_id);
   if(!validOriginalUpload907(row,receipt)||row.upload_proof_hash!==await sha256Receipt907(receipt.proof))
    return reply({ok:false,error:'Original private photo receipt is unverified, expired or already linked. No quote created.'},409);
   originals.push(row);
  }
  const message=[
   x.message,
   x.vehicle_size?'Requested vehicle size (not verified): '+x.vehicle_size:'',
   x.requested_service_codes.length?'Requested service codes for staff review (NOT priced or approved): '+x.requested_service_codes.join(', '):'',
   originals.length?'Original verified private upload intake IDs: '+originals.map(r=>r.intake_id).join(', '):'',
   'Photos require staff privacy review before any public use. No quote or appointment approved.'
  ].filter(Boolean).join('\n').slice(0,1800);
  const payload={client_request_id:x.client_request_id,topic:x.topic==='manual_custom'?'general':'photo_estimate',
   full_name:x.full_name,email:x.email,phone:x.phone,service_area:x.service_area,
   vehicle_count:1,source_path:x.topic==='manual_custom'?'/book-custom':'/booking-planner',
   message,photo_estimate_links:x.photo_estimate_links,status:'new',
   created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  const res=await fetch(env.SUPABASE_URL+'/rest/v1/public_inquiry_leads?select=id,client_request_id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify([payload])});
  if(res.status===409)return reply({ok:false,error:'Quote request already exists. Recheck the original staff queue before resubmitting.'},409);
  if(!res.ok)return reply({ok:false,error:'Quote could not be recorded. No upload linkage claimed.'},503);
  const inserted=await res.json().catch(()=>[]),lead=Array.isArray(inserted)?inserted[0]:null;
  if(!lead?.id)return reply({ok:false,error:'Quote was sent to the staff queue but original readback is missing. Contact Rosie before retrying.'},503);
  let linked=0;
  for(const original of originals){
   const patch=await fetch(env.SUPABASE_URL+'/rest/v1/photo_estimate_uploads?id=eq.'+original.id+
    '&lead_id=is.null&status=eq.uploaded&upload_proof_hash=eq.'+original.upload_proof_hash,{
     method:'PATCH',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
     body:JSON.stringify({lead_id:lead.id,linked_at:new Date().toISOString()})});
   const rows=patch.ok?await patch.json().catch(()=>[]):[];
   if(Array.isArray(rows)&&rows.length===1&&rows[0].lead_id===lead.id)linked++;
  }
  const complete=linked===originals.length;
  return reply({ok:true,lead_recorded:true,lead_id:lead.id,
   original_upload_count:originals.length,linked_upload_count:linked,linkage_verified:complete,
   staff_review_required:true,photo_privacy_review_required:true,
   automatic_send:false,quote_approved:false,booking_created:false,payment_attempted:false,
   message:complete?'Your request has entered Rosie staff quote review. No appointment or payment was created.':
    'Your quote request was saved, but some media links need staff reconciliation. Contact Rosie with your quote reference; do not resubmit.'},201);
 }catch{return reply({ok:false,error:'The original private quote/attachment source is unavailable. No delivery claimed.'},503);}
}
