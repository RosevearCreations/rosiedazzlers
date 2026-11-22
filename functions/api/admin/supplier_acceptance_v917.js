// Rosie 917 private original-source evidence review: no provider DELETE or ledger writes.
// Staff-submitted hashes do not establish independent verification or GREEN acceptance.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
import {validate917,evaluate917} from '../../../assets/build917-source-evidence-contract.mjs';
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const sourceMap={
 revocations:'rosie_supplier_revocations_v916',providerReceipts:'rosie_supplier_provider_receipts_v915',
 deviceReports:'rosie_supplier_device_evidence_v916',financeReviews:'rosie_supplier_financial_reviews_v916',
 nativeReceipts:'rosie_supplier_native_takedown_v917',surfaces:'rosie_supplier_recall_surfaces_v917',
 secondWitnesses:'rosie_supplier_device_second_witness_v917',financeChains:'rosie_supplier_finance_chain_v917'
};
async function db(env,path,options={}){
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(String(env?.SUPABASE_URL||'').replace(/\/+$/,''))||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('ORIGINAL_DB_UNAVAILABLE');
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{
  ...options,headers:{...serviceHeaders(env),'Content-Type':'application/json',...options.headers},cache:'no-store',redirect:'error'
 });
 if(!response.ok)throw Error('ORIGINAL_SOURCE_CONFLICT');
 if(response.status===204)return null;
 return response.json();
}
async function rows(env,table,key,id){
 const result=await db(env,table+'?select=*&'+key+'=eq.'+encodeURIComponent(id)+'&limit=101');
 if(!Array.isArray(result)||result.length>100)throw Error('SOURCE_HISTORY_INCOMPLETE');
 return result;
}
async function original(env,table,id){if(!UUID914.test(id))throw Error('ORIGINAL_ID_REQUIRED');const result=await rows(env,table,'id',id);if(result.length!==1)throw Error('ORIGINAL_RECORD_MISSING');return result[0];}
async function auth(request,env,write){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return {response:a.response};
 const actor=a.actor;
 const permission=write?(hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage')):(hasActionAccess(actor,'daip.view')||hasActionAccess(actor,'daip.manage')||hasActionAccess(actor,'admin.settings.manage'));
 if(a.auth_mode!=='session'||!permission||!actor?.is_active||!UUID914.test(actor?.id))return {response:respond({ok:false,error:'ACTIVE_ORIGINAL_STAFF_SESSION_REQUIRED'},403)};
 return {actor};
}
async function snapshot(env,id){
 const publication=await original(env,'rosie_supplier_publication_v914',id);
 const entries=await Promise.all(Object.entries(sourceMap).map(async([name,table])=>[name,await rows(env,table,'publication_id',id)]));
 return {publication,...Object.fromEntries(entries)};
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env,false);if(a.response)return a.response;
 const id=new URL(request.url).searchParams.get('publication_id');
 if(!UUID914.test(id))return respond({ok:false,error:'ORIGINAL_PUBLICATION_ID_REQUIRED'},400);
 try{return respond({ok:true,...evaluate917(await snapshot(env,id))});}
 catch{return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_UNAVAILABLE_OR_INCOMPLETE'},503);}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(origin!==new URL(request.url).origin||(site&&site!=='same-origin'&&site!=='none'))return respond({ok:false,error:'SAME_ORIGIN_REQUIRED'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({ok:false,error:'JSON_REQUIRED'},415);
 const a=await auth(request,env,true);if(a.response)return a.response;
 let v;
 try{const text=await request.text();if(text.length>1200)throw Error('INPUT_TOO_LARGE');v=validate917(JSON.parse(text));}
 catch{return respond({ok:false,error:'INVALID_OR_OUT_OF_SCOPE_EVIDENCE'},400);}
 try{
  const s=await snapshot(env,v.publication_id);
  if(s.publication.publication_state!=='revoked'||s.revocations.length!==1)return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_REVOCATION_REQUIRED'},409);
  let table,row;
  if(v.action==='native_receipt'){
   const receipt=s.providerReceipts.find(x=>x.id===v.provider_receipt_id&&x.channel===s.publication.channel);
   if(s.providerReceipts.length!==1||!receipt)return respond({ok:false,state:'HOLD',error:'ORIGINAL_PROVIDER_RECEIPT_REQUIRED'},409);
   table=sourceMap.nativeReceipts;row={publication_id:v.publication_id,provider_receipt_id:receipt.id,submitted_by_staff_id:a.actor.id,
    provider_case_reference:v.provider_case_reference,receipt_sha256:v.receipt_sha256};
  }else if(v.action==='surface'){
   table=sourceMap.surfaces;row={publication_id:v.publication_id,observed_by_staff_id:a.actor.id,surface_kind:v.surface_kind,
    surface_host:v.surface_host,observed_state:v.observed_state,evidence_sha256:v.evidence_sha256};
  }else if(v.action==='second_witness'){
   const originalDevice=s.deviceReports.find(x=>x.id===v.device_evidence_id);
   if(!originalDevice||originalDevice.outcome!=='passed'||originalDevice.witnessed_by_staff_id===a.actor.id)
    return respond({ok:false,state:'HOLD',error:'SEPARATE_ORIGINAL_PASSED_DEVICE_REPORT_REQUIRED'},409);
   table=sourceMap.secondWitnesses;row={publication_id:v.publication_id,device_evidence_id:v.device_evidence_id,
    witnessed_by_staff_id:a.actor.id,evidence_sha256:v.evidence_sha256};
  }else if(v.action==='finance_chain'){
   if(!s.financeReviews.some(x=>x.journal_entry_id===v.journal_entry_id))
    return respond({ok:false,state:'HOLD',error:'ORIGINAL_DOCUMENTARY_JOURNAL_REVIEW_REQUIRED'},409);
   const journal=await original(env,'accounting_journal_entries',v.journal_entry_id);
   if(!['posted','final','locked'].includes(journal.status))return respond({ok:false,state:'HOLD',error:'POSTED_ORIGINAL_JOURNAL_REQUIRED'},409);
   table=sourceMap.financeChains;row={publication_id:v.publication_id,journal_entry_id:v.journal_entry_id,reviewed_by_staff_id:a.actor.id,
    payment_source_sha256:v.payment_source_sha256,customer_source_sha256:v.customer_source_sha256};
  }
  const result=await db(env,table+'?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
  if(!Array.isArray(result)||result.length!==1||!UUID914.test(result[0].id))throw Error('CUSTODY_WRITE_NOT_CONFIRMED');
  return respond({ok:true,build:917,id:result[0].id,record_state:'STAFF_EVIDENCE_UNVERIFIED',business_state:'HOLD',
   independent_source_verified:false,provider_deleted:false,worldwide_recalled:false,financial_ledgers_unchanged:true},201);
 }catch{return respond({ok:false,state:'HOLD',error:'ORIGINAL_SOURCE_OR_CONFLICT'},409);}
}
const deny=()=>respond({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=deny;export const onRequestPatch=deny;export const onRequestDelete=deny;export const onRequestOptions=deny;
