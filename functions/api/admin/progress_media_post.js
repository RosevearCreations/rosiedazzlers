import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
import { resolveBookingIdByToken } from "../_lib/social-dispatch.js";
import { normalizeAudience, normalizeLiveStage, audienceFields, schemaLooksLegacy, safeExternalUrl, signedStorageUrl } from "../_lib/job-live-feed.js";
import { queueCustomerLiveAlert, queueStaffLiveAlert } from "../_lib/live-interaction-alerts.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const booking_id = String(body.booking_id || "").trim();
    const kind = String(body.kind || body.media_kind || "photo").trim().toLowerCase() === "video" ? "video" : "photo";
    const caption = cleanText(body.caption);
    const media_url = safeExternalUrl(body.media_url);
    const storage_bucket = String(body.storage_bucket || body.bucket || "").trim();
    const storage_path = String(body.storage_path || body.path || "").trim();
    const content_type = String(body.content_type || "").trim().toLowerCase() || null;
    const file_size_bytes = Number(body.file_size_bytes || 0) || null;
    const duration_seconds = Number(body.duration_seconds || 0) || null;
    const upload_session_id = isUuid(String(body.upload_session_id || "")) ? String(body.upload_session_id) : null;
    const retention_policy = normalizeRetention(body.retention_policy);
    const retention_expires_at = retentionExpiry(retention_policy);
    const audience = normalizeAudience(body.audience, body.visibility);
    const stage = normalizeLiveStage(body.stage);
    const customer_action_required = body.customer_action_required === true;

    if (!media_url && !(storage_bucket && storage_path)) return withCors(json({ error: "A media URL or completed storage upload is required." }, 400));
    if (kind === 'video' && duration_seconds && duration_seconds > Number(env.JOB_MEDIA_MAX_VIDEO_SECONDS || 120)) return withCors(json({ error:`Video exceeds the ${Number(env.JOB_MEDIA_MAX_VIDEO_SECONDS || 120)} second limit.` }, 400));
    const resolvedBookingId = isUuid(booking_id) ? booking_id : await resolveBookingIdByToken({ env, token });
    if (!resolvedBookingId) return withCors(json({ error: "Missing or invalid booking_id/token." }, 400));

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const actor = access.actor || {};
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

    let usedLegacySchema = false;
    let insertRes = await insertRow(env, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (!schemaLooksLegacy(text)) return withCors(json({ error: `Could not save media. ${text}` }, 500));
      usedLegacySchema = true;
      insertRes = await insertRow(env, base);
      if (!insertRes.ok) return withCors(json({ error: `Could not save media. ${await insertRes.text()}` }, 500));
    }
    const rows = await insertRes.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

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
      schema_fallback_used: usedLegacySchema
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
