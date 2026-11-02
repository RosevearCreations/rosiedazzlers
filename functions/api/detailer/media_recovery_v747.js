// Build 747: operator-triggered reconciliation. Never auto-replay a private image.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {loadCaptureSession747,loadCaptureMedia747,checkStorageObject747,verifyCaptureConsent747} from '../_lib/media-capture-v747.js';

export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const bookingId=String(body.booking_id||'').trim(),sessionId=String(body.upload_session_id||'').trim();
    if(!isUuid(bookingId)||!isUuid(sessionId))return json({ok:false,error:'Valid job and upload session are required.'},400);
    if(!['inspect','reopen'].includes(body.action))return json({ok:false,error:'Choose inspect or reopen.'},400);
    const access=await requireStaffAccess({request,env,body,capability:'work_booking',bookingId,allowLegacyAdminFallback:false});
    if(!access.ok)return access.response;
    if(access.auth_mode!=='session'||request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,error:'Signed-in same-origin staff access required.'},403);
    const session=await loadCaptureSession747(env,bookingId,sessionId);
    if(!session||!String(session.storage_path||'').startsWith(`jobs/${bookingId}/v747/`)||
      session.staff_user_id&&String(session.staff_user_id)!==String(access.actor.id))return json({ok:false,error:'This private upload is not assigned to the signed-in staff member.'},403);
    const media=await loadCaptureMedia747(env,bookingId,sessionId);
    if(media)return json({ok:true,state:'media_saved',media_id:media.id,upload_session_id:sessionId,private:true,public_use_allowed:false});
    const object=await checkStorageObject747(env,session);
    if(body.action==='inspect')return json({ok:true,state:object.state==='present'?'uploaded_unregistered':object.state==='missing'?'file_missing':'verification_unavailable',session_status:session.status,
      upload_session_id:sessionId,filename:session.filename,stage:String(session.storage_path).split('/')[3],original_path:session.storage_path,
      action_hint:object.state==='present'?'Review the original preview, then deliberately resume saving the existing session.':object.state==='missing'?'Select the original file and request a NEW signed upload.':'Do not reupload or commit while verification is uncertain.',private:true,public_use_allowed:false});
    if(object.state!=='present')return json({ok:false,code:'storage_unconfirmed',error:'The original file could not be verified. No state was changed.'},409);
    if(session.status!=='committing'||Date.now()-Date.parse(session.updated_at)<180000)return json({ok:false,code:'unsafe_reopen',error:'Only an older, stuck committing session can be reopened, after inspection. New/in-flight writes must settle first.'},409);
    const consent=await verifyCaptureConsent747(env,bookingId);
    if(!consent.ok)return json({ok:false,code:'consent_stale',error:'Current private-photo permission was revoked or changed; review onsite intake.'},409);
    const params=new URLSearchParams({id:`eq.${sessionId}`,booking_id:`eq.${bookingId}`,status:'eq.committing',updated_at:`eq.${session.updated_at}`,select:'id'});
    const patch=await fetch(`${env.SUPABASE_URL}/rest/v1/live_upload_sessions?${params}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify({status:'failed',last_error:'Build 747 operator reconciliation; original verified, no media record at inspection.',updated_at:new Date().toISOString()})});
    if(!patch.ok)return json({ok:false,code:'reopen_unconfirmed',error:'Recovery update was not confirmed. Inspect again before retrying.'},503);
    const rows=await patch.json().catch(()=>[]);
    if(!Array.isArray(rows)||rows.length!==1)return json({ok:false,code:'reopen_conflict',error:'Upload session changed. Reinspect before saving.'},409);
    return json({ok:true,state:'ready_for_manual_commit',upload_session_id:sessionId,private:true,public_use_allowed:false});
  }catch(error){return json({ok:false,code:'recovery_unavailable',error:error?.message||'Recovery inspection unavailable; do not start a duplicate upload.'},503);}
}
