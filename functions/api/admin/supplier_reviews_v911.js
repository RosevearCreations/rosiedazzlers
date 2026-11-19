// Build 911: signed-staff, private supplier review drafts. Never an automatic promotion or social post.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {normalizeSupplierReview911,summarizeSupplierReview911} from '../../../assets/build911-supplier-review.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Vary':'Cookie'}});
const denied=()=>respond({ok:false,error:'Method not allowed'},405);
export const onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
async function authorized(request,env,write=false){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const actor=a.actor;
 const canView=hasActionAccess(actor,'daip.view')||hasActionAccess(actor,'socials.view')||
  hasActionAccess(actor,'admin.settings.manage');
 const canWrite=hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'socials.manage')||
  hasActionAccess(actor,'admin.settings.manage');
 if(a.auth_mode!=='session'||!(write?canWrite:canView))return {response:respond({ok:false,error:'Signed-in DAIP/social authorization required'},403)};
 return {actor};
}
async function data(env,path,options={}){
 if(!/^https:\/\//.test(String(env?.SUPABASE_URL||''))||!env?.SUPABASE_SERVICE_ROLE_KEY)
  throw Error('Source not configured');
 const res=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{
  ...options,headers:{...serviceHeaders(env),'Content-Type':'application/json',...options.headers},redirect:'error',cache:'no-store'});
 if(!res.ok)throw Error('Original supplier review source unavailable');
 const body=await res.json();if(!Array.isArray(body))throw Error('Original source readback invalid');
 return body;
}
export async function onRequestGet({request,env}){
 const access=await authorized(request,env);if(access.response)return access.response;
 try{
  const rows=await data(env,'rosie_supplier_reviews_v911?select=id,supplier,product_name,product_url,acquisition_kind,video_platform,video_url,daip_project_id,review_notes,publication_status,created_at&order=created_at.desc&limit=50');
  return respond({ok:true,items:rows.map(summarizeSupplierReview911),
   source:'ORIGINAL_ROSIE_SUPABASE',read_only_preview:true,
   original_receipt_verified:false,public_publication_authorized:false,
   daip_consent_witnessed:false,third_party_embed_requires_click:true});
 }catch{return respond({ok:false,error:'Supplier review source not available. Do not assume an item was saved.'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(!origin||origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))
  return respond({ok:false,error:'Same-origin staff session required'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return respond({ok:false,error:'JSON body required'},415);
 const access=await authorized(request,env,true);if(access.response)return access.response;
 try{
  const text=await request.text();
  if(text.length>5000)return respond({ok:false,error:'Request too large'},413);
  const normalized=normalizeSupplierReview911(JSON.parse(text));
  if(normalized.daip_project_id){
   const match=await data(env,'creative_projects?select=id&id=eq.'+normalized.daip_project_id+'&limit=1');
   if(match.length!==1)return respond({ok:false,error:'DAIP project not found in original source'},409);
  }
  const row={...normalized,created_by_staff_user_id:uuid.test(String(access.actor?.id||''))?access.actor.id:null};
  delete row.third_party_embed_consent_required;
  const rows=await data(env,'rosie_supplier_reviews_v911?select=*',{
   method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
  if(rows.length!==1||!uuid.test(String(rows[0].id||''))||rows[0].publication_status!=='draft')
   return respond({ok:false,error:'Original save readback incomplete; no success claimed'},503);
  return respond({ok:true,item:summarizeSupplierReview911(rows[0]),
   write_scope:'STAFF_PRIVATE_DRAFT_ONLY',published:false,received_verified:false,
   no_cost_or_ledger_post:true,no_social_publish:true,no_daip_media_release:true},201);
 }catch(e){
  const validation=/Invalid|Unknown|Unapproved|required|unsupported|status|VEVOR|supplier|Social|URL|Acquisition|video|fields|Product|Build 911|platform|HTTPS/i.test(e?.message||'');
  return respond({ok:false,error:validation?e.message:'Supplier source unavailable; no success claimed'},validation?400:503);
 }
}
