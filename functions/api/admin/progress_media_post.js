import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
import { resolveBookingIdByToken } from "../_lib/social-dispatch.js";
import { normalizeAudience, normalizeLiveStage, audienceFields, schemaLooksLegacy, safeExternalUrl, signedStorageUrl } from "../_lib/job-live-feed.js";
import { queueCustomerLiveAlert, queueStaffLiveAlert } from "../_lib/live-interaction-alerts.js";
import { capturePolicy747,verifyCaptureConsent747,loadCaptureSession747,loadCaptureMedia747,sessionMatches747,checkStorageObject747,claimCaptureSession747,verifyAuthenticCapture747 } from '../_lib/media-capture-v747.js';

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  const capture747=context.detailerCapture747===true;
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const booking_id = String(body.booking_id || "").trim();
    const kind = String(body.kind || body.media_kind || "photo").trim().toLowerCase() === "video" ? "video" : "photo";
    const caption = cleanText(body.caption);
    const media_url = safeExternalUrl(body.media_url);
    const storage_bucket = String(body.storage_bucket || body.bucket || "").trim();
    const storage_path = String(body.storage_path || body.path || "").trim();
    if(!capture747&&/\/v747\//.test(storage_path))return withCors(json({error:'Build 747 private originals must use the consent-checked staff capture endpoint.'},403));
    const content_type = String(body.content_type || "").trim().toLowerCase() || null;
    const file_size_bytes = Number(body.file_size_bytes || 0) || null;
    const duration_seconds = Number(body.duration_seconds || 0) || null;
    const upload_session_id = isUuid(String(body.upload_session_id || "")) ? String(body.upload_session_id) : null;
    const retention_policy = normalizeRetention(body.retention_policy);
    const retention_expires_at = retentionExpiry(retention_policy);
    const audience = normalizeAudience(body.audience, body.visibility);
    const stage = normalizeLiveStage(body.stage);
    const customer_action_required = body.customer_action_required === true;
    if(capture747&&['arrival','pre_existing','final'].includes(String(body.stage||''))&&kind!=='photo')return withCors(json({error:'Before/After proof requires a genuine original photo.'},409));
    const policy=capture747?capturePolicy747(body):null;
    if(capture747&&!policy.ok)return withCors(json({error:policy.error,code:'private_capture_required'},409));
    if(capture747&&(!upload_session_id||media_url||!storage_bucket||!storage_path||(kind==='photo'&&!/^[a-f0-9]{64}$/i.test(body.original_sha256))))return withCors(json({error:'A tracked private upload and original photo SHA-256 are required.',code:'original_required'},400));

    if (!media_url && !(storage_bucket && storage_path)) return withCors(json({ error: "A media URL or completed storage upload is required." }, 400));
    if (kind === 'video' && duration_seconds && duration_seconds > Number(env.JOB_MEDIA_MAX_VIDEO_SECONDS || 120)) return withCors(json({ error:`Video exceeds the ${Number(env.JOB_MEDIA_MAX_VIDEO_SECONDS || 120)} second limit.` }, 400));
    const resolvedBookingId = isUuid(booking_id) ? booking_id : await resolveBookingIdByToken({ env, token });
    if (!resolvedBookingId) return withCors(json({ error: "Missing or invalid booking_id/token." }, 400));

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: !capture747 });
    if (!access.ok) return withCors(access.response);
    const actor = access.actor || {};
    let captureSession=null,consent747=null;
    if(capture747){
      if(access.auth_mode!=='session'||request.headers.get('origin')!==new URL(request.url).origin)return withCors(json({error:'A same-origin signed-in staff session is required.'},403));
      consent747=await verifyCaptureConsent747(env,resolvedBookingId);
      if(!consent747.ok)return withCors(json({error:'Private-photo consent changed. No media was published. Reload onsite consent.',code:'consent_stale'},409));
      captureSession=await loadCaptureSession747(env,resolvedBookingId,upload_session_id);
      if(!sessionMatches747(captureSession,{...body,stage:policy.stage},actor))return withCors(json({error:'This session does not match the original file, staff member, stage or private storage path.',code:'session_mismatch'},409));
      const existing=await loadCaptureMedia747(env,resolvedBookingId,upload_session_id);
      if(existing)return withCors(json({ok:true,already_saved:true,private_capture:true,media:existing,stage:existing.stage,audience:'internal',recovery:'confirmed_existing'}));
      const authentic=await verifyAuthenticCapture747(env,resolvedBookingId,policy.stage,body.original_sha256,kind);
      if(!authentic.ok)return withCors(json({error:authentic.error,code:'authentic_photo_conflict'},409));
      if(!['prepared','uploading','failed'].includes(captureSession.status))return withCors(json({error:'Session is no longer commit-ready. Inspect its status before any retry.',code:'session_stale',recovery:'inspect'},409));
      const object=await checkStorageObject747(env,captureSession);
      if(object.state!=='present')return withCors(json({error:object.state==='missing'?'The original upload is absent. Keep the file and begin a fresh signed upload.':'Original storage verification is unconfirmed. Do not duplicate the upload.',code:`storage_${object.state}`,recovery:'inspect'},object.state==='missing'?409:503));
      if(!await claimCaptureSession747(env,captureSession))return withCors(json({error:'A concurrent or stale commit was detected. Inspect before retrying.',code:'commit_conflict',recovery:'inspect'},409));
    }
    const audiencePatch = audienceFields(audience, actor);
    const previewUrl = media_url || await signedStorageUrl({ env, bucket: storage_bucket, path: storage_path });
    const base = {
      booking_id: resolvedBookingId,
      created_by: actor.full_name || actor.email || cleanText(body.created_by) || "Staff",
      kind,
      caption: caption || null,
      media_url: media_url || previewUrl || `storage://${storage_bucket}/${storage_path}`,
      visibility: audiencePatch.visibility,
      staff_user_id: actor.id || null
    };
    const enhanced = {
      ...base,
      stage,
      source_channel: actor.role_code === "detailer" || actor.role_code === "senior_detailer" ? "detailer" : "admin",
      customer_action_required,
      storage_bucket: storage_bucket || null,
      storage_path: storage_path || null,
      content_type,
      file_size_bytes,
      duration_seconds,
      upload_status:'complete',
      upload_session_id,
      retention_policy,
      retention_expires_at,
      ...audiencePatch
    };
    if(capture747){
      enhanced.visibility='internal';enhanced.review_status='not_required';enhanced.requires_admin_review=false;enhanced.customer_visible_at=null;
      enhanced.gallery_reuse_status='not_queued';enhanced.vehicle_history_reuse_status='not_queued';
    }

    let usedLegacySchema = false;
    let insertRes = await insertRow(env, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (capture747||!schemaLooksLegacy(text)) return withCors(json({ error: capture747?'Private media save unconfirmed. Inspect the session before retrying.':`Could not save media. ${text}`,code:capture747?'save_unconfirmed':undefined }, 500));
      usedLegacySchema = true;
      insertRes = await insertRow(env, base);
      if (!insertRes.ok) return withCors(json({ error: `Could not save media. ${await insertRes.text()}` }, 500));
    }
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    if(capture747){
      // This receipt preserves original-file provenance without creating a
      // public derivative or treating a private-consent receipt as marketing rights.
      const receipt={booking_id:resolvedBookingId,event_type:'detailer_original_photo_v747',actor_name:actor.full_name||actor.email||'Staff',
        event_note:`Original private ${kind} at ${policy.stage}; gallery/marketing held.`,payload:{job_media_id:row?.id||null,upload_session_id,original_sha256:body.original_sha256?String(body.original_sha256).toLowerCase():null,original_storage_bucket:storage_bucket,original_storage_path:storage_path,
          thumbnail_storage_path:null,derivative_status:'not_created',consent_receipt_id:consent747.receipt_id,consent_intake_revision:consent747.revision,
          privacy_review:policy.privacy,public_gallery_approved:false,marketing_approved:false,authentic_stage:policy.stage,redaction_required_before_public_use:policy.privacy.finding==='sensitive_private'}};
      const audit=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',headers:serviceHeaders(env),body:JSON.stringify([receipt])}).catch(()=>null);
      if(!audit?.ok)return withCors(json({error:'Private original saved, but provenance audit receipt is unconfirmed. Inspect the existing upload; do not upload again.',code:'audit_unconfirmed',ambiguous_mutation:true,media_id:row?.id||null},503));
    }

    if (upload_session_id) await patchUploadSession(env, upload_session_id, { status:'complete', progress_percent:100, completed_at:new Date().toISOString(), updated_at:new Date().toISOString() });

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id: resolvedBookingId,
        event_type: audience === "customer" ? "media_posted" : audience === "review" ? "progress_media_pending_review" : "internal_media_posted",
        actor_name: actor.full_name || actor.email || "Staff",
        event_note: audience === "customer" ? `${kind}${caption ? `: ${caption}` : ""}`.slice(0, 250) : `${stage} ${audience} ${kind} saved.`,
        payload: { kind, audience, visibility: audiencePatch.visibility, stage, media_id: row?.id || null, storage_bucket: storage_bucket || null, storage_path: storage_path || null, staff_user_id: actor.id || null, duration_seconds, retention_policy }
      }])
    }).catch(() => null);

    let notification = null;
    if (audience === 'customer') notification = await queueCustomerLiveAlert({ env, bookingId:resolvedBookingId, eventType:'job_progress_media_posted', message:`A new ${kind} was added to your live detailing progress.`, payload:{ media_id:row?.id || null, stage } }).catch(()=>null);
    else notification = await queueStaffLiveAlert({ env, bookingId:resolvedBookingId, eventType:audience === 'review' ? 'job_progress_media_needs_review' : 'job_private_media_posted', message:audience === 'review' ? 'A photo/video is waiting for admin review.' : 'Private staff media was added to a live job.', payload:{ media_id:row?.id || null, stage } }).catch(()=>null);

    return withCors(json({
      ok: true,
      message: audience === "review" ? "Media saved for admin review." : audience === "internal" ? "Private staff media saved." : "Customer media posted.",
      actor: { id: actor.id || null, full_name: actor.full_name || null },
      media: row ? { ...row, media_url: previewUrl || row.media_url || "" } : null,
      audience,
      stage,
      notification,
      schema_fallback_used: usedLegacySchema,
      ...(capture747?{private_capture:true,original_verified:true,public_use_allowed:false}:{}),
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function insertRow(env, row) { return fetch(`${env.SUPABASE_URL}/rest/v1/job_media`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify([row]) }); }
async function patchUploadSession(env,id,patch){await fetch(`${env.SUPABASE_URL}/rest/v1/live_upload_sessions?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:serviceHeaders(env),body:JSON.stringify(patch)}).catch(()=>null);}
function normalizeRetention(value){const allowed=new Set(['temporary_90_days','standard_365_days','permanent_proof','legal_hold']);const v=String(value||'standard_365_days').trim().toLowerCase();return allowed.has(v)?v:'standard_365_days';}
function retentionExpiry(policy){const days=policy==='temporary_90_days'?90:policy==='standard_365_days'?365:null;return days?new Date(Date.now()+days*86400000).toISOString():null;}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
