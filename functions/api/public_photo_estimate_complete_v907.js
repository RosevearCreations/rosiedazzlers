// Rosie 907: confirm actual private object existence before claiming a photo is attached.
// A signed upload URL alone is NOT proof of upload or staff-visible quote linkage.
import {serviceHeaders} from './_lib/customer-session.js';
import {validUuid907,validProof907,sha256Receipt907,UPLOAD_PROOF_TTL_MS907} from './_lib/photo-quote-907.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
 'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const deny=()=>json({ok:false,error:'Use a same-origin POST to verify a new private upload.'},405);
export const onRequestGet=deny,onRequestOptions=deny,onRequestPut=deny,onRequestDelete=deny;
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({ok:false,error:'Same-origin upload verification required.'},403);
 if(Number(request.headers.get('content-length')||0)>700)return json({ok:false,error:'Invalid receipt body.'},413);
 let body;try{body=await request.json()}catch{return json({ok:false,error:'Valid receipt JSON required.'},400)}
 if(!body||Object.keys(body).some(k=>!['intake_id','proof'].includes(k))||
  !validUuid907(body.intake_id)||!validProof907(body.proof))return json({ok:false,error:'Invalid private upload receipt.'},400);
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,error:'Upload verification unavailable.'},503);
 try{
  const url=env.SUPABASE_URL+'/rest/v1/photo_estimate_uploads?select='+encodeURIComponent(
    'id,intake_id,upload_proof_hash,created_at,verified_at,status,lead_id,booking_id,bucket,object_path,media_url')+
    '&intake_id=eq.'+body.intake_id+'&limit=1';
  const found=await fetch(url,{headers:serviceHeaders(env),cache:'no-store'});
  if(!found.ok)return json({ok:false,error:'Private upload receipt lookup failed.'},503);
  const rows=await found.json().catch(()=>[]),row=Array.isArray(rows)?rows[0]:null;
  const digest=await sha256Receipt907(body.proof);
  if(!row||row.upload_proof_hash!==digest||!row.created_at||Date.now()-Date.parse(row.created_at)>UPLOAD_PROOF_TTL_MS907||
   Date.parse(row.created_at)>Date.now()+60000||row.lead_id||row.booking_id||
   !['signed','uploaded'].includes(row.status))
   return json({ok:false,error:'Upload receipt expired, unavailable or already linked.'},409);
  const path=row.object_path,bucket=row.bucket;
  if(typeof path!=='string'||!path.startsWith('photo-estimates/')||typeof bucket!=='string'||!bucket)
   return json({ok:false,error:'Invalid private storage reference.'},409);
  // Authenticated Storage HEAD confirms the bytes were received; never return the object body.
  const objectUrl=String(env.SUPABASE_URL).replace(/\/+$/,'')+'/storage/v1/object/authenticated/'+
    encodeURIComponent(bucket)+'/'+path.split('/').map(encodeURIComponent).join('/');
  const exists=await fetch(objectUrl,{method:'HEAD',cache:'no-store',
   headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY}});
  if(!exists.ok)return json({ok:false,error:'Original storage object could not be verified. The file is NOT attached.'},409);
  if(row.status==='signed'){
   const saved=await fetch(env.SUPABASE_URL+'/rest/v1/photo_estimate_uploads?id=eq.'+row.id+
      '&status=eq.signed&upload_proof_hash=eq.'+digest,{
     method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},
     body:JSON.stringify({status:'uploaded',verified_at:new Date().toISOString()})});
   if(!saved.ok)return json({ok:false,error:'Original upload confirmation could not be recorded.'},503);
   const patch=await saved.json().catch(()=>[]);if(!Array.isArray(patch)||patch.length!==1)
    return json({ok:false,error:'Upload confirmation needs original readback.'},409);
  }
  return json({ok:true,original_upload_verified:true,staff_quote_linked:false,
   intake_id:row.intake_id,media_ref:'storage://'+bucket+'/'+path,
   private_only:true,privacy_review_required:true,customer_media_published:false});
 }catch{return json({ok:false,error:'Original upload verification unavailable. No quote linkage claimed.'},503);}
}
