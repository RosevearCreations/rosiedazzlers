import { requireStaffAccess } from '../_lib/staff-auth.js';
import { loadMediaLibraryRows, loadAssignmentRows, publicUrlForKey, isApprovedImageKey } from '../_lib/photo-library.js';

const BUILD=260;
const SAMPLE_LIMIT=12;
const LARGE_BYTES=5*1024*1024;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
function safe(v,max=500){return String(v??'').trim().slice(0,max);}
function normalizeName(v){return safe(v,300).toLowerCase().replace(/\.[a-z0-9]{2,5}$/,'').replace(/[^a-z0-9]+/g,' ').trim();}
function photoSummary(row,assignmentCount=0){return {id:row.id||null,label:safe(row.label||row.filename||row.r2_key||'Website image',240),filename:safe(row.filename,260),r2_key:safe(row.r2_key,600),media_url:safe(row.media_url,1200),alt_text:safe(row.alt_text,300),decorative:row.decorative===true,width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),byte_size:row.byte_size==null?null:Number(row.byte_size),r2_etag:safe(row.r2_etag,240),source_status:safe(row.source_status,40),assignment_count:Number(assignmentCount||0),updated_at:row.updated_at||null,photo_studio_url:`/admin-photo-studio.html?photo_id=${encodeURIComponent(String(row.id||''))}`};}

async function load(env){
  const [library,assignments]=await Promise.all([
    loadMediaLibraryRows(env,{includeArchived:false,limit:1200}),
    loadAssignmentRows(env,{activeOnly:true,limit:1600})
  ]);
  const assignmentCount=new Map();
  for(const row of assignments.rows||[]){const id=String(row.media_id||'');if(id)assignmentCount.set(id,(assignmentCount.get(id)||0)+1);}
  const photos=(library.rows||[]).map(row=>photoSummary(row,assignmentCount.get(String(row.id||''))||0));
  return {library,assignments,photos};
}

function buildHealth(photos=[]){
  const missingAlt=photos.filter(p=>!p.decorative&&!safe(p.alt_text));
  const unassigned=photos.filter(p=>p.assignment_count===0);
  const large=photos.filter(p=>Number(p.byte_size||0)>LARGE_BYTES);
  const missingDimensions=photos.filter(p=>!Number(p.width||0)||!Number(p.height||0));
  const storageIdentity=photos.filter(p=>!p.r2_key||!p.r2_etag);
  const nameGroups=new Map(),etagGroups=new Map();
  for(const p of photos){
    const n=normalizeName(p.filename||p.label);if(n){if(!nameGroups.has(n))nameGroups.set(n,[]);nameGroups.get(n).push(p);}
    const e=safe(p.r2_etag,240);if(e){if(!etagGroups.has(e))etagGroups.set(e,[]);etagGroups.get(e).push(p);}
  }
  const duplicateNames=[...nameGroups.entries()].filter(([,rows])=>rows.length>1).map(([name,rows])=>({kind:'similar_name',name,count:rows.length,photos:rows.slice(0,6)})).slice(0,30);
  const duplicateEtags=[...etagGroups.entries()].filter(([,rows])=>rows.length>1).map(([etag,rows])=>({kind:'same_storage_signature',etag,count:rows.length,photos:rows.slice(0,6)})).slice(0,30);
  return {
    stats:{photos:photos.length,assigned:photos.filter(p=>p.assignment_count>0).length,unassigned:unassigned.length,missing_alt:missingAlt.length,large_files:large.length,missing_dimensions:missingDimensions.length,missing_storage_identity:storageIdentity.length,duplicate_candidates:duplicateNames.length+duplicateEtags.length},
    issues:{missing_alt:missingAlt.slice(0,80),large_files:large.slice(0,80),missing_dimensions:missingDimensions.slice(0,80),missing_storage_identity:storageIdentity.slice(0,80),unassigned:unassigned.slice(0,80),duplicate_candidates:[...duplicateEtags,...duplicateNames].slice(0,50)}
  };
}

async function deliverySample(env,photos=[]){
  const candidates=photos.filter(p=>isApprovedImageKey(p.r2_key)).slice(0,SAMPLE_LIMIT);
  const results=[];
  for(const p of candidates){
    const url=publicUrlForKey(env,p.r2_key);
    try{
      const response=await fetch(url,{method:'GET',headers:{Range:'bytes=0-0','User-Agent':'RosieMediaHealth/260'},redirect:'follow'});
      results.push({id:p.id,label:p.label,r2_key:p.r2_key,url,ok:response.ok||response.status===206,status:response.status,content_type:safe(response.headers.get('content-type'),120)});
      try{await response.body?.cancel();}catch{}
    }catch(error){results.push({id:p.id,label:p.label,r2_key:p.r2_key,url,ok:false,status:0,error:safe(error?.message||error,220)});}
  }
  return {checked:results.length,limit:SAMPLE_LIMIT,failed:results.filter(r=>!r.ok).length,results};
}

export async function onRequest({request,env}){
  if(request.method==='OPTIONS')return new Response('',{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}});
  const body=request.method==='POST'?await request.json().catch(()=>({})):{};
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const loaded=await load(env);
    const health=buildHealth(loaded.photos);
    const mode=safe(body.mode||new URL(request.url).searchParams.get('mode')||'summary',40);
    const sample=mode==='delivery_sample'?await deliverySample(env,loaded.photos):null;
    return json({ok:true,build:BUILD,scan_mode:'database_first',r2_scan:false,automatic_public_probe:false,library_ready:loaded.library.ready===true,assignments_ready:loaded.assignments.ready===true,...health,delivery_sample:sample,warnings:[loaded.library.warning,loaded.assignments.warning].filter(Boolean)});
  }catch(error){return json({ok:false,build:BUILD,error:safe(error?.message||error,400)},500);}
}
