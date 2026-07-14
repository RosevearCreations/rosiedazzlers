// Build 218 — metadata-only registration of harmless internal DAIP test assets.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { readTestControl, readInternalTestJob, safeFilename, safeShortText, safeInteger, containsForbiddenStorageInput, SAFE_ASSET_KINDS, SAFE_CAPTURE_STAGES, SAFE_MIME_TYPES, appendAuditEvent, daipError, withCors, corsHeaders, DAIP_BUILD } from '../_lib/daip-test-mode.js';

export async function onRequestOptions(){ return new Response('', {status:204,headers:corsHeaders()}); }
export async function onRequestPost({request,env}){
  try {
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const control=await readTestControl(env); if(!control.ok) return daipError(control.error,409);
    if(containsForbiddenStorageInput(body)) return daipError('DAIP Test Lab is metadata-only. Do not submit any URL, signed URL, bucket, storage key, path, or Drive reference.',400);
    const jobId=String(body.media_job_id||'').trim(); const jobResult=await readInternalTestJob(env,jobId); if(!jobResult.ok) return daipError(jobResult.error,jobResult.status||400);
    if(jobResult.job.status==='archived') return daipError('Archived DAIP test jobs cannot receive new asset records.',409);
    const safeName=safeFilename(body.safe_filename); const assetKind=String(body.asset_kind||'').trim(); const captureStage=String(body.capture_stage||'').trim(); const mimeType=String(body.mime_type||'').trim().toLowerCase(); const size=safeInteger(body.file_size_bytes); const reference=safeShortText(body.source_reference_label,240); const checksum=String(body.checksum_sha256||'').trim();
    if(!safeName) return daipError('Use a harmless filename only. Paths and URL-like values are not allowed.',400);
    if(!SAFE_ASSET_KINDS.has(assetKind)) return daipError('Choose test photo or test video.',400);
    if(!SAFE_CAPTURE_STAGES.has(captureStage)) return daipError('Choose before, process, after, or other.',400);
    if(!SAFE_MIME_TYPES.has(mimeType)) return daipError('Choose one supported safe test MIME type.',400);
    if(size===null) return daipError('Enter a whole-byte size from 0 to 10 GB.',400);
    if(!reference) return daipError('Add a safe internal test reference label. Do not use customer information.',400);
    if(checksum && !/^[a-fA-F0-9]{64}$/.test(checksum)) return daipError('Checksum must be a 64-character SHA-256 value when supplied.',400);
    const now=new Date().toISOString();
    const row={media_job_id:jobId,safe_filename:safeName,asset_kind:assetKind,capture_stage:captureStage,mime_type:mimeType,file_size_bytes:size,source_reference_label:reference,source_mode:'metadata_only',storage_status:'not_uploaded',checksum_sha256:checksum||null,privacy_status:'manual_review_required',public_export_blocked:true,registered_by_staff_user_id:isUuid(access.actor?.id)?access.actor.id:null,created_at:now,updated_at:now};
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_assets`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([row])}); const text=await res.text(); const asset=JSON.parse(text||'[]')[0]||null;
    if(!res.ok||!asset?.id) return daipError('Could not register the test asset. Use a unique safe filename per test job.',409);
    await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_jobs?id=eq.${encodeURIComponent(jobId)}`,{method:'PATCH',headers:serviceHeaders(env),body:JSON.stringify({status:'privacy_review_required',updated_at:now})});
    await appendAuditEvent(env,{media_job_id:jobId,media_asset_id:asset.id,actor_staff_user_id:access.actor?.id,event_type:'test_asset_registered',reason:'Metadata-only internal test asset registered.',safe_metadata:{build:DAIP_BUILD,asset_kind:assetKind,capture_stage:captureStage,storage_status:'not_uploaded',public_export_blocked:true}});
    return withCors(json({ok:true,build:DAIP_BUILD,asset:{id:asset.id,safe_filename:asset.safe_filename,asset_kind:asset.asset_kind,capture_stage:asset.capture_stage,privacy_status:asset.privacy_status,storage_status:asset.storage_status}}));
  } catch(err){ return withCors(json({ok:false,error:err?.message||'Could not register DAIP test asset.'},500)); }
}
