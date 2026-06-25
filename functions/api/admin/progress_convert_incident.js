import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { hydrateMediaRows } from "../_lib/job-live-feed.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    const sourceId = String(body.source_id || body.update_id || body.media_id || "").trim();
    const sourceEntity = String(body.source_entity || (body.media_id ? "media" : "update")).trim().toLowerCase();
    if (!isUuid(bookingId) || !isUuid(sourceId) || !["update","media"].includes(sourceEntity)) return withCors(json({ ok:false, error:"Valid booking_id, source_id, and source_entity are required." }, 400));
    const access = await requireStaffAccess({ request, env, body, capability:"work_booking", bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);

    const sourceTable = sourceEntity === "media" ? "job_media" : "job_updates";
    const sourceRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${sourceTable}?select=*&id=eq.${encodeURIComponent(sourceId)}&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`, { headers });
    if (!sourceRes.ok) return withCors(json({ ok:false, error:`Could not load source item. ${await sourceRes.text()}` }, 500));
    const source = (await sourceRes.json().catch(() => []))?.[0] || null;
    if (!source) return withCors(json({ ok:false, error:"Source update/media not found." }, 404));

    const mediaRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,created_at,kind,caption,media_url,storage_bucket,storage_path,content_type,file_size_bytes,stage&booking_id=eq.${encodeURIComponent(bookingId)}&stage=eq.issue&order=created_at.desc&limit=20`, { headers });
    const rawMedia = mediaRes.ok ? await mediaRes.json().catch(() => []) : [];
    const hydrated = await hydrateMediaRows(env, Array.isArray(rawMedia) ? rawMedia : []);
    const evidence = hydrated.map((item) => ({
      url:item.media_url || "",
      caption:item.caption || "Issue evidence",
      evidence_type:item.kind || "photo",
      storage_bucket:item.storage_bucket || null,
      storage_path:item.storage_path || null,
      content_type:item.content_type || null,
      file_size_bytes:item.file_size_bytes || null,
      customer_visible:false
    })).filter((item) => item.url || (item.storage_bucket && item.storage_path));
    if (!evidence.length) return withCors(json({ ok:false, error:"Add at least one issue-stage photo/video before converting this update into an incident report." }, 409));

    const title = String(body.title || source.caption || source.recommendation_title || source.note || "Issue found during detailing").trim().slice(0, 180);
    const privateReport = String(body.private_report || source.note || source.caption || "Issue identified during the live detailing workflow.").trim().slice(0, 4000);
    const actorName = access.actor?.full_name || access.actor?.email || "Staff";
    const now = new Date().toISOString();
    const row = {
      booking_id:bookingId,
      incident_type:"damage",
      severity:String(body.severity || "medium").trim().toLowerCase(),
      status:"open",
      decision_status:"needs_review",
      title,
      private_report:privateReport,
      evidence_items:evidence,
      private_admin_discussion:`${now} — ${actorName}\nConverted from live ${sourceEntity} ${sourceId}.`,
      public_evidence_items:[],
      public_visible:false,
      source_job_update_id:sourceEntity === "update" ? sourceId : null,
      source_job_media_id:sourceEntity === "media" ? sourceId : null,
      reported_by_staff_user_id:access.actor?.id || null,
      reported_by_staff_name:actorName,
      reported_by_staff_email:access.actor?.email || null,
      created_by_staff_user_id:access.actor?.id || null,
      created_by_staff_name:actorName,
      created_by_staff_email:access.actor?.email || null,
      updated_by_staff_user_id:access.actor?.id || null,
      updated_by_staff_name:actorName,
      updated_by_staff_email:access.actor?.email || null,
      created_at:now,
      updated_at:now
    };
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/incident_reports`, { method:"POST", headers:{ ...headers, Prefer:"return=representation" }, body:JSON.stringify([row]) });
    if (!insertRes.ok) return withCors(json({ ok:false, error:`Could not create incident report. ${await insertRes.text()}`, migration:"sql/2026-06-17_build210_connected_live_workflow.sql" }, 500));
    const report = (await insertRes.json().catch(() => []))?.[0] || null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/${sourceTable}?id=eq.${encodeURIComponent(sourceId)}`, { method:"PATCH", headers, body:JSON.stringify({ linked_incident_report_id:report?.id || null }) }).catch(() => null);
    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:"POST", headers, body:JSON.stringify([{ booking_id:bookingId, event_type:"live_issue_converted_to_incident", actor_name:actorName, event_note:title, payload:{ incident_report_id:report?.id || null, source_entity:sourceEntity, source_id:sourceId } }]) }).catch(() => null);
    return withCors(json({ ok:true, report, message:"Private incident report created from the live issue and linked to its evidence." }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not convert issue into an incident report." }, 500));
  }
}
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
