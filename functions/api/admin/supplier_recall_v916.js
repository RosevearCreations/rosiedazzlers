// Rosie 916 — staff-only original supplier and public-creative revocation.
// Does not delete provider videos, customer originals or posted accounting journals.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {validateRevocation916,validateDeviceEvidence916,classifyRecall916,financialIntegrity916} from '../../../assets/build916-revocation-recall-device-contract.mjs';
import {readOriginalProvider915} from '../_lib/supplier-provider915.js';
const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const urlpath=(name,query)=>name+'?select=*'+(query?'&'+query:'')+'&limit=100';
async function db(env,path,options={}){
 if(!/^https:\/\//.test(env?.SUPABASE_URL||'')||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('ORIGINAL_DB_UNAVAILABLE');
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{...options,headers:{...serviceHeaders(env),'Content-Type':'application/json',...options.headers},redirect:'error',cache:'no-store'});
 if(!response.ok)throw Error('ORIGINAL_DB_DENIED_OR_CONFLICT');
 return response.status===204?null:response.json();
}
const get=(env,name,key,val)=>db(env,urlpath(name,key+'=eq.'+encodeURIComponent(val)));
async function one(env,name,id){
 if(!UUID914.test(id))throw Error('ORIGINAL_ID_REQUIRED');
 const a=await get(env,name,'id',id);
 if(!Array.isArray(a)||a.length!==1)throw Error('ORIGINAL_OBJECT_UNAVAILABLE');
 return a[0];
}
async function auth(request,env,write){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const actor=a.actor;
 const allowed=write?(hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage')):(hasActionAccess(actor,'daip.view')||hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage'));
 if(a.auth_mode!=='session'||!allowed||!UUID914.test(actor?.id))return {response:respond({ok:false,error:'CURRENT_STAFF_SESSION_REQUIRED'},403)};
 return {actor};
}
const hash=async value=>{
 const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
 return [...new Uint8Array(buffer)].map(v=>v.toString(16).padStart(2,'0')).join('');
};
export async function onRequestGet({request,env}){
 const a=await auth(request,env,false);if(a.response)return a.response;
 const id=new URL(request.url).searchParams.get('publication_id');
 if(!UUID914.test(id))return respond({ok:false,error:'PUBLICATION_ID_REQUIRED'},400);
 try{
  const pub=await one(env,'rosie_supplier_publication_v914',id);
  const [revocations,observations,devices,finance]=await Promise.all([
   get(env,'rosie_supplier_revocations_v916','publication_id',id),
   get(env,'rosie_supplier_recall_observations_v916','publication_id',id),
   get(env,'rosie_supplier_device_evidence_v916','publication_id',id),
   db(env,'rpc/rosie_supplier_finance_review_summary_v916',{method:'POST',body:JSON.stringify({p_publication_id:id})})
  ]);
  const revoked=pub.publication_state==='revoked'&&revocations.length===1;
  return respond({ok:true,build:916,publication_id:id,publication_state:pub.publication_state,
   internally_revoked:revoked,provider_recall_verified:false,external_recall_state:revoked?'EXTERNAL_RECALL_PENDING':'NOT_REVOKED',
   revocation:revoked?{reason:revocations[0].reason,at:revocations[0].created_at}:null,
   recent_observations:observations.slice(-20).map(o=>({status:o.provider_status,observed_at:o.observed_at,probe_reason:o.probe_reason})),
   staff_reported_device_evidence:devices.slice(-20).map(o=>({device_class:o.device_class,role:o.role_tested,scenario:o.scenario,outcome:o.outcome,evidence_state:'staff_reported_unverified'})),
   financial_review:{documents:finance?.[0]?.reviewed_documents||0,recognized_revenue_cents:null,incremental_sales:null,roas:null,causal_link:'UNVERIFIED'},
   source_no_pii:true,customer_consent_recheck_required:true});
 }catch{return respond({ok:false,error:'ORIGINAL_PRIVATE_SOURCE_HOLD'},503);}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return respond({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({ok:false,error:'JSON_REQUIRED'},415);
 const a=await auth(request,env,true);if(a.response)return a.response;
 let body;
 try{const txt=await request.text();if(txt.length>1100)return respond({ok:false,error:'INPUT_TOO_LARGE'},413);body=JSON.parse(txt)}catch{return respond({ok:false,error:'INVALID_JSON'},400);}
 if(!UUID914.test(body?.publication_id))return respond({ok:false,error:'ORIGINAL_PUBLICATION_REQUIRED'},400);
 try{
  const pub=await one(env,'rosie_supplier_publication_v914',body.publication_id);
  if(body.action==='revoke'){
   const normalized=validateRevocation916({publication_id:body.publication_id,reason:body.reason});
   if(normalized.reason==='customer_consent_withdrawn'){
    const project=await one(env,'creative_projects',pub.project_id);
    if(project.consent_status==='approved_public'&&project.public_publish_allowed===true)return respond({ok:false,state:'HOLD',error:'ORIGINAL_CUSTOMER_CONSENT_WITHDRAWAL_NOT_RECORDED'},409);
   }
   const receipt=await db(env,'rpc/rosie_supplier_revoke_v916',{method:'POST',body:JSON.stringify({p_publication_id:pub.id,p_reason:normalized.reason,p_actor:a.actor.id})});
   if(!UUID914.test(receipt))throw Error('DURABLE_REVOKE_RECEIPT_MISSING');
   return respond({ok:true,state:'INTERNAL_REVOKED',revocation_id:receipt,external_provider_recall:'PENDING_NATIVE_EVIDENCE',automatic_post_deletion:false,attribution_stopped:true},201);
  }
  if(body.action==='observe'){
   if(pub.publication_state!=='revoked')return respond({ok:false,state:'HOLD',error:'REVOCATION_REQUIRED_BEFORE_RECALL'},409);
   const entries=await get(env,'rosie_supplier_provider_receipts_v915','publication_id',pub.id);
   if(entries.length!==1)return respond({ok:false,state:'HOLD',error:'ORIGINAL_PROVIDER_RECEIPT_MISSING'},409);
   const receipt=entries[0];
   const probe=await readOriginalProvider915(env,pub.channel,receipt.provider_object_id);
   const verdict=classifyRecall916({publication:pub,receipt,probe});
   // Never accept browser-claimed deletion or equate inaccessible to successfully removed.
   const digest=await hash({publication_id:pub.id,provider_object_id:receipt.provider_object_id,status:verdict.status,probe,kind:'independent_owner_read_only'});
   const inserted=await db(env,'rosie_supplier_recall_observations_v916?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({publication_id:pub.id,observed_by_staff_id:a.actor.id,provider_status:verdict.status==='ORIGINAL_POST_STILL_PUBLIC'?'original_post_still_public':'external_recall_unverified',probe_reason:verdict.probe_reason||verdict.status,observation_digest:digest})});
   if(!Array.isArray(inserted)||inserted.length!==1||!UUID914.test(inserted[0].id))throw Error('RECALL_OBSERVATION_WRITE_HOLD');
   return respond({ok:true,state:verdict.status,provider_recall_verified:false,independent_native_takedown_receipt_required:true,observation_id:inserted[0].id},201);
  }
  if(body.action==='device'){
   const input=validateDeviceEvidence916({publication_id:pub.id,device_class:body.device_class,role_tested:body.role_tested,browser_family:body.browser_family,scenario:body.scenario,outcome:body.outcome,evidence_sha256:body.evidence_sha256});
   const row={publication_id:pub.id,witnessed_by_staff_id:a.actor.id,device_class:input.device_class,role_tested:input.role_tested,browser_family:input.browser_family,scenario:input.scenario,outcome:input.outcome,evidence_sha256:input.evidence_sha256};
   const inserted=await db(env,'rosie_supplier_device_evidence_v916?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
   if(!Array.isArray(inserted)||inserted.length!==1)throw Error('DEVICE_RECORD_NOT_RECORDED');
   return respond({ok:true,state:'STAFF_REPORTED_UNVERIFIED',id:inserted[0].id,independent_device_verified:false,original_device_witness_required:true},201);
  }
  if(body.action==='finance_review'){
   if(!UUID914.test(body.journal_entry_id))return respond({ok:false,error:'ORIGINAL_JOURNAL_ID_REQUIRED'},400);
   const journal=await one(env,'accounting_journal_entries',body.journal_entry_id);
   const check=financialIntegrity916({originalJournal:journal,review:{publication_id:pub.id,journal_entry_id:journal.id}});
   if(!check.eligible)return respond({ok:false,state:'HOLD',error:check.reason},409);
   const inserted=await db(env,'rosie_supplier_financial_reviews_v916?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({publication_id:pub.id,journal_entry_id:journal.id,reviewed_by_staff_id:a.actor.id})});
   if(!Array.isArray(inserted)||inserted.length!==1)throw Error('FINANCIAL_REVIEW_UNAVAILABLE');
   return respond({ok:true,state:'DOCUMENT_REVIEW_ONLY',id:inserted[0].id,revenue_attributed_cents:null,roas:null,financial_ledgers_unchanged:true},201);
  }
  return respond({ok:false,error:'ACTION_NOT_SUPPORTED'},400);
 }catch(e){
  const input=/INVALID|REQUIRED|SCOPE|REVOKE_SCOPE|EVIDENCE_HASH|CLASS_INVALID|ROLE_INVALID|OUTCOME_INVALID|SCENARIO_INVALID|BROWSER_INVALID/.test(e?.message||'');
  return respond({ok:false,state:'HOLD',error:input?e.message:'ORIGINAL_SOURCE_OR_WITNESS_CONFLICT'},input?400:409);
 }
}
export const onRequestPut=()=>respond({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPatch=onRequestPut;export const onRequestDelete=onRequestPut;export const onRequestOptions=onRequestPut;
