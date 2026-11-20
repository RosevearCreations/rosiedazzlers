// Rosie 915 — protected original-provider status and owner-supervised confirmation.
// Never uploads/publishes customer media; verification requires a LIVE provider API readback.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {workflowFor} from './daip_media_workflow.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {assessProviderReceipt915} from '../../../assets/build915-provider-proof-contract.mjs';
import {readOriginalProvider915} from '../_lib/supplier-provider915.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});
const table=(name,query)=>name+'?select=*' + (query?'&'+query:'')+'&limit=100';
async function rest(env,path,options={}){
 if(!/^https:\/\//.test(env?.SUPABASE_URL||'')||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('DB_HOLD');
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{...options,headers:{...serviceHeaders(env),'Content-Type':'application/json',...options.headers},redirect:'error',cache:'no-store'});
 if(!r.ok)throw Error('ORIGINAL_PRIVATE_READBACK_HOLD');
 return r.status===204?null:r.json();
}
async function one(env,name,id){
 if(!UUID914.test(id))throw Error('INVALID_ORIGINAL_ID');
 const rows=await rest(env,table(name,'id=eq.'+id));
 if(!Array.isArray(rows)||rows.length!==1)throw Error('ORIGINAL_RECORD_MISSING');
 return rows[0];
}
async function authorization(request,env,write){
 const r=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!r.ok)return {response:r.response};
 const actor=r.actor,allowed=write?(hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage')):(hasActionAccess(actor,'daip.view')||hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage'));
 if(r.auth_mode!=='session'||!allowed||!UUID914.test(actor?.id))return {response:reply({ok:false,error:'STAFF_SESSION_SCOPE_REQUIRED'},403)};
 return {actor};
}
async function originalApproval(env,pub){
 const [pr,sr,custody]=await Promise.all([
  one(env,'creative_projects',pub.project_id),
  one(env,'rosie_supplier_reviews_v911',pub.supplier_review_id),
  one(env,'rosie_supplier_custody_v914',pub.custody_id)
 ]);
 if(sr.daip_project_id!==pr.id||custody.supplier_review_id!==sr.id||sr.received_verified!==true)return {valid:false,reason:'PHYSICAL_CUSTODY_HOLD'};
 if(pr.consent_status!=='approved_public'||pr.consent_reviewed!==true||pr.public_publish_allowed!==true||pr.content_package_status!=='approved'||pr.archived_at||pr.consent_expires_at&&Date.parse(pr.consent_expires_at)<=Date.now())return {valid:false,reason:'CONSENT_NOT_CURRENT'};
 const [assets,jobs,sessions]=await Promise.all([
  rest(env,table('daip_project_media_assets','project_id=eq.'+pr.id)),
  rest(env,table('daip_media_processing_jobs','project_id=eq.'+pr.id)),
  rest(env,table('creative_project_sessions','project_id=eq.'+pr.id))
 ]);
 const wf=workflowFor({project:pr,assets:assets||[],jobs:jobs||[],sessions:sessions||[],drafts:[]});
 const selection=wf.handoff_manifest?.selected_private_asset_ids||[];
 const valid=wf.public_handoff_ready===true&&Array.isArray(pub.approved_asset_ids)&&pub.approved_asset_ids.length>0&&pub.approved_asset_ids.every(id=>selection.includes(id))&&pub.approved_asset_ids.length===new Set(pub.approved_asset_ids).size;
 return {valid,reason:valid?'VALID':'ORIGINAL_DAIP_CONSENT_HOLD'};
}
export async function onRequestGet({request,env}){
 const a=await authorization(request,env,false);if(a.response)return a.response;
 const id=new URL(request.url).searchParams.get('publication_id');
 if(!UUID914.test(id))return reply({ok:false,error:'PUBLICATION_ID_REQUIRED'},400);
 try{
  const pub=await one(env,'rosie_supplier_publication_v914',id);
  const [receipts,rollups]=await Promise.all([
   rest(env,table('rosie_supplier_provider_receipts_v915','publication_id=eq.'+id)),
   rest(env,'rpc/rosie_supplier_attribution_rollup_v915',{method:'POST',body:JSON.stringify({p_publication_id:id})})
  ]);
  const approval=await originalApproval(env,pub);
  return reply({ok:true,build:915,publication_id:id,channel:pub.channel,
   state:approval.valid?pub.publication_state:'CONSENT_OR_CUSTODY_HOLD',
   current_approval_valid:approval.valid,blocker:approval.valid?null:approval.reason,
   verified:approval.valid&&pub.publication_state==='provider_verified'&&Array.isArray(receipts)&&receipts.length===1,
   receipt:approval.valid&&receipts?.length===1?{
    id:receipts[0].id,channel:receipts[0].channel,provider_object_id:receipts[0].provider_object_id,
    provider_permalink:receipts[0].provider_permalink,provider_read_at:receipts[0].provider_read_at
   }:null,aggregates:approval.valid&&pub.publication_state==='provider_verified'?rollups:[],
   no_original_customer_or_media_identifiers:true,small_groups_suppressed:true,external_recall_not_claimed:true});
 }catch{return reply({ok:false,error:'ORIGINAL_PROVIDER_SOURCE_HOLD'},503);}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return reply({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 const a=await authorization(request,env,true);if(a.response)return a.response;
 let input;
 try{const s=await request.text();if(s.length>1200)return reply({ok:false,error:'INPUT_LIMIT'},413);input=JSON.parse(s);}catch{return reply({ok:false,error:'INVALID_JSON'},400);}
 if(input?.action!=='verify'||!UUID914.test(input.publication_id)||typeof input.provider_object_id!=='string'||!/^[A-Za-z0-9_-]{6,100}$/.test(input.provider_object_id))return reply({ok:false,error:'PROVIDER_ID_AND_VERIFY_ACTION_REQUIRED'},400);
 try{
  const pub=await one(env,'rosie_supplier_publication_v914',input.publication_id);
  if(pub.publication_state!=='approved_pending_provider')return reply({ok:false,state:'HOLD',blockers:['NOT_ORIGINAL_PENDING_APPROVAL']},409);
  const approval=await originalApproval(env,pub);
  if(!approval.valid)return reply({ok:false,state:'HOLD',blockers:[approval.reason]},409);
  const checked=await readOriginalProvider915(env,pub.channel,input.provider_object_id);
  if(!checked.ok)return reply({ok:false,state:'HOLD',blockers:[checked.reason]},409);
  const decision=assessProviderReceipt915({publication:pub,identity:checked.identity,provider:checked.provider,consentStillValid:true});
  if(!decision.verified)return reply({ok:false,state:'HOLD',blockers:decision.blockers},409);
  // Only original provider-retrieved fields enter the receipt, never browser URLs.
  const normalized=JSON.stringify({publication_id:pub.id,provider:checked.provider,identity:checked.identity});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));
  const hex=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const receipt=await rest(env,'rpc/rosie_supplier_confirm_provider_v915',{
   method:'POST',body:JSON.stringify({p_publication_id:pub.id,
    p_provider_object_id:checked.provider.id,p_provider_owner_id:checked.identity.owner_id,
    p_provider_permalink:checked.provider.canonical_url,p_response_hash:hex,p_staff_id:a.actor.id})
  });
  if(!UUID914.test(receipt))throw Error('DURABLE_RECEIPT_NOT_CONFIRMED');
  return reply({ok:true,state:'PROVIDER_VERIFIED',receipt_id:receipt,channel:pub.channel,
    original_provider_read_only:true,auto_posted:false,raw_customer_media_public:false,
    future_consent_withdrawal_requires_independent_recall:true},201);
 }catch{return reply({ok:false,error:'ORIGINAL_DB_OR_PROVIDER_ACCEPTANCE_HOLD'},503);}
}
export const onRequestPut=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPatch=onRequestPut;
export const onRequestDelete=onRequestPut;
export const onRequestOptions=onRequestPut;
