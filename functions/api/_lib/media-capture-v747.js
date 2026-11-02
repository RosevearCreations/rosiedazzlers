// Build 747: private, original-only field capture. Public R2 Photo Studio is a
// separate, explicitly approved workflow; job-media paths never enter it.
import { serviceHeaders } from './staff-auth.js';
import { loadOnsiteGate746, ONSITE_EVENT746 } from './onsite-setup-v746.js';

export const CAPTURE_STAGES747 = Object.freeze(['arrival','pre_existing','during','final','issue','general']);
const encodePath = path => encodeURIComponent(path).replace(/%2F/g,'/');

export function capturePolicy747(body={}) {
  const stage=String(body.stage||'').trim();
  if(!CAPTURE_STAGES747.includes(stage))return {ok:false,error:'Choose a valid original-photo stage.'};
  if(String(body.audience||body.visibility||'internal')!=='internal')return {ok:false,error:'Job photos remain private. Customer sharing, gallery and marketing require separate, verified approval.'};
  if(body.publication_approval||body.gallery_approved||body.marketing_approved)return {ok:false,error:'A private capture cannot grant publication approval.'};
  const privacy=body.privacy_review||{};
  if(privacy.faces_plates_addresses_checked!==true)return {ok:false,error:'Review faces, number plates and addresses before capturing private evidence.'};
  if(!['clear','sensitive_private'].includes(privacy.finding))return {ok:false,error:'Classify sensitive details as clear or private; nothing is published.'};
  return {ok:true,stage,privacy:{faces_plates_addresses_checked:true,finding:privacy.finding,redaction_status:'not_public',marketing_permission:'not_granted'}};
}

export async function verifyCaptureConsent747(env,bookingId){
  const {intake,receipt}=await loadOnsiteGate746(env,bookingId);
  const ok=!!intake && receipt?.event_type===ONSITE_EVENT746 &&
    receipt.payload?.intake_revision===intake.updated_at && receipt.payload?.photo_consent==='internal_job_evidence';
  return {ok,receipt_id:ok?receipt.id:null,revision:ok?intake.updated_at:null};
}

export async function loadCaptureSession747(env,bookingId,sessionId){
  const url=`${env.SUPABASE_URL}/rest/v1/live_upload_sessions?select=*&id=eq.${encodeURIComponent(sessionId)}&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`;
  const response=await fetch(url,{headers:serviceHeaders(env)});
  if(!response.ok)throw new Error('Could not verify current upload session. No changes were made.');
  const rows=await response.json();
  return Array.isArray(rows)?rows[0]||null:null;
}

export async function loadCaptureMedia747(env,bookingId,sessionId){
  const url=`${env.SUPABASE_URL}/rest/v1/job_media?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&upload_session_id=eq.${encodeURIComponent(sessionId)}&limit=2`;
  const response=await fetch(url,{headers:serviceHeaders(env)});
  if(!response.ok)throw new Error('Could not reconcile saved job media. Do not start another upload.');
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length>1)throw new Error('Multiple media records found. Owner review required.');
  return rows[0]||null;
}

export function sessionMatches747(session,body,actor){
  return !!session && String(session.storage_bucket)===String(body.storage_bucket) &&
    String(session.storage_path)===String(body.storage_path) &&
    String(session.content_type)===String(body.content_type) &&
    Number(session.file_size_bytes)===Number(body.file_size_bytes) &&
    (!session.staff_user_id || String(session.staff_user_id)===String(actor.id)) &&
    String(session.storage_path||'').startsWith(`jobs/${session.booking_id}/v747/${body.stage}/`) &&
    String(session.media_kind||'image')===(body.kind==='video'?'video':'image');
}

export async function verifyAuthenticCapture747(env,bookingId,stage,hash,kind){
  if(stage==='final'){
    const before=await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id&booking_id=eq.${encodeURIComponent(bookingId)}&stage=in.(arrival,pre_existing)&kind=eq.photo&upload_status=eq.complete&limit=1`,{headers:serviceHeaders(env)});
    if(!before.ok)throw new Error('Before-photo comparison could not be verified. No after-photo record was saved.');
    const rows=await before.json();
    if(!Array.isArray(rows)||!rows.length)return {ok:false,error:'Capture a genuine before-service photo first. An after image cannot create an authentic pair by itself.'};
  }
  if(kind==='photo'&&hash){
    const rowsResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=payload&booking_id=eq.${encodeURIComponent(bookingId)}&event_type=eq.detailer_original_photo_v747&order=created_at.desc&limit=100`,{headers:serviceHeaders(env)});
    if(!rowsResponse.ok)throw new Error('Original photo history could not be checked. Inspect before retrying.');
    const rows=await rowsResponse.json();
    if(!Array.isArray(rows))throw new Error('Original history unreadable; hold the capture.');
    if(rows.some(row=>String(row?.payload?.original_sha256||'')===String(hash).toLowerCase()))return {ok:false,error:'This exact original is already registered on this job. Select a genuinely different before/after image; no duplicate was saved.'};
  }
  return {ok:true};
}

export async function checkStorageObject747(env,session){
  // Metadata-only HEAD. A failed/unknown response is never proof of absence.
  const url=`${env.SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(session.storage_bucket)}/${encodePath(session.storage_path)}`;
  let response;
  try{response=await fetch(url,{method:'HEAD',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`}});}
  catch{return {state:'unknown'};}
  if(response.ok){
    const size=Number(response.headers.get('content-length'));
    if(Number.isFinite(size)&&size>0&&session.file_size_bytes&&size!==Number(session.file_size_bytes))return {state:'mismatch'};
    return {state:'present'};
  }
  return {state:response.status===404?'missing':'unknown'};
}

export async function claimCaptureSession747(env,session){
  const params=new URLSearchParams({id:`eq.${session.id}`,booking_id:`eq.${session.booking_id}`,status:'in.(prepared,uploading,failed)',updated_at:`eq.${session.updated_at}`,select:'id'});
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/live_upload_sessions?${params}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify({status:'committing',updated_at:new Date().toISOString()})});
  if(!res.ok)throw new Error('Upload session claim unconfirmed. Inspect before retry.');
  const rows=await res.json();
  return Array.isArray(rows)&&rows.length===1;
}
