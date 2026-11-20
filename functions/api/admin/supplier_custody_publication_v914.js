// Build 914: authenticated, private staff supplier custody and signed-off publication QUEUE.
// Provider posting is deliberately NOT performed here: approved_pending_provider != published.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {normalizeCustody914,assessPublication914,UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {workflowFor} from './daip_media_workflow.js';
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});
async function db(env,path,opts={}){
 if(!/^https:\/\//.test(String(env?.SUPABASE_URL||''))||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('Original private database unavailable');
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{...opts,headers:{...serviceHeaders(env),'Content-Type':'application/json',...opts.headers},cache:'no-store',redirect:'error'});
 if(!r.ok)throw Error('Original private database rejected request');
 const value=await r.json();if(!Array.isArray(value))throw Error('Original private readback missing');
 return value;
}
const get=(env,table,filter,select='*')=>db(env,table+'?select='+select+'&'+filter+'&limit=100');
const one=async(env,table,id)=>{if(!UUID914.test(id))throw Error('Invalid original ID');const rows=await get(env,table,'id=eq.'+id);if(rows.length!==1)throw Error('Original record unavailable');return rows[0]};
const insert=async(env,table,row)=>{
 const rows=await db(env,table+'?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
 if(rows.length!==1||!UUID914.test(rows[0].id))throw Error('Original write receipt missing');
 return rows[0];
};
async function auth(request,env,write){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const actor=a.actor;
 const allowed=write?(hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage')):(hasActionAccess(actor,'daip.view')||hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage'));
 if(a.auth_mode!=='session'||!allowed||!UUID914.test(actor?.id))return {response:respond({ok:false,error:'Original authorized staff session required'},403)};
 return {actor};
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env,false);if(a.response)return a.response;
 const id=new URL(request.url).searchParams.get('supplier_review_id');
 if(!UUID914.test(id))return respond({ok:false,error:'Supplier review ID required'},400);
 try{
  await one(env,'rosie_supplier_reviews_v911',id);
  const [custody,publication]=await Promise.all([
   get(env,'rosie_supplier_custody_v914','supplier_review_id=eq.'+id),
   get(env,'rosie_supplier_publication_v914','supplier_review_id=eq.'+id)]);
  return respond({ok:true,custody,publication,published_verified:publication.some(p=>p.publication_state==='provider_verified'),
   approval_is_not_provider_publication:true,attribution_unsupported_until_provider_verified:true});
 }catch{return respond({ok:false,error:'Private source unavailable; not certified'},503)}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(!origin||origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))
  return respond({ok:false,error:'Same-origin required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({ok:false,error:'JSON required'},415);
 const a=await auth(request,env,true);if(a.response)return a.response;
 try{
  const body=await request.text();if(body.length>6000)return respond({ok:false,error:'Request too large'},413);
  const input=JSON.parse(body);
  if(input.action==='custody'){
   const v=normalizeCustody914(input.data);
   const review=await one(env,'rosie_supplier_reviews_v911',v.supplier_review_id);
   if(review.acquisition_kind!==v.custody_kind)throw Error('Supplier draft acquisition does not match original custody');
   const row=await insert(env,'rosie_supplier_custody_v914',{...v,witnessed_by_staff_id:a.actor.id});
   return respond({ok:true,id:row.id,state:'PRIVATE_CUSTODY_ATTESTED',physical_independent_witness:false},201);
  }
  if(input.action==='approve'){
   const x=input.data||{},review=await one(env,'rosie_supplier_reviews_v911',x.supplier_review_id);
   const custody=await one(env,'rosie_supplier_custody_v914',x.custody_id);
   const project=await one(env,'creative_projects',review.daip_project_id);
   const id=project.id;
   const [assets,jobs,sessions]=await Promise.all([
    get(env,'daip_project_media_assets','project_id=eq.'+id),
    get(env,'daip_media_processing_jobs','project_id=eq.'+id),
    get(env,'creative_project_sessions','project_id=eq.'+id)]);
   const workflow=workflowFor({project,assets,jobs,sessions,drafts:[]});
   const decision={approved:x.approved===true,approver_id:a.actor.id,channel:x.channel,
    supplier_review_id:review.id,project_id:id,consent_record_id:x.consent_record_id,
    disclosure_confirmed:x.disclosure_confirmed===true,creative_reviewed_at:x.creative_reviewed_at};
   const gate=assessPublication914({review,custody,project,workflow,decision,assetIds:x.asset_ids});
   if(!gate.ready)return respond({ok:false,state:'HOLD',blockers:gate.blockers},409);
   const row=await insert(env,'rosie_supplier_publication_v914',{
    supplier_review_id:review.id,custody_id:custody.id,project_id:id,consent_record_id:x.consent_record_id,
    channel:x.channel,approved_asset_ids:x.asset_ids,approved_by_staff_id:a.actor.id,
    creative_reviewed_at:x.creative_reviewed_at,disclosure_confirmed:x.disclosure_confirmed===true,
    publication_state:'approved_pending_provider'});
   return respond({ok:true,id:row.id,state:'APPROVED_PENDING_PROVIDER',published:false,auto_publish:false,raw_media_public:false},201);
  }
  return respond({ok:false,error:'Unsupported operation'},400);
 }catch(e){
  const validation=/Invalid|required|missing|match|Unsupported|custody|date|review|scope/i.test(e?.message||'');
  return respond({ok:false,error:validation?e.message:'Original source unavailable; no success claimed'},validation?400:503);
 }
}
export const onRequestPut=()=>respond({ok:false,error:'Method not allowed'},405);
export const onRequestDelete=onRequestPut;
export const onRequestPatch=onRequestPut;
export const onRequestOptions=onRequestPut;
