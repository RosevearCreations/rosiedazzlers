import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { hydrateMediaRows } from "../_lib/job-live-feed.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const mediaId = String(body.media_id || "").trim();
    const bookingId = String(body.booking_id || "").trim();
    const targets = Array.isArray(body.targets) ? body.targets.map((v)=>String(v).toLowerCase()) : [String(body.target || "gallery").toLowerCase()];
    if (!isUuid(mediaId) || !isUuid(bookingId)) return withCors(json({ ok:false, error:"Valid media_id and booking_id are required." }, 400));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_progress", bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const mediaRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=*&id=eq.${encodeURIComponent(mediaId)}&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`, { headers });
    if (!mediaRes.ok) return withCors(json({ ok:false, error:`Could not load media. ${await mediaRes.text()}` }, 500));
    const raw = (await mediaRes.json().catch(() => []))?.[0] || null;
    if (!raw) return withCors(json({ ok:false, error:"Media not found." }, 404));
    if (String(raw.stage || "") !== "final") return withCors(json({ ok:false, error:"Only final-stage media can be sent to gallery/vehicle history." }, 409));
    if (String(raw.visibility || "") !== "customer" || !["approved","not_required",""].includes(String(raw.review_status || ""))) return withCors(json({ ok:false, error:"Approve this media for the customer before reusing it." }, 409));
    const media = (await hydrateMediaRows(env, [raw]))[0] || raw;
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,vehicle_id,customer_name,package_code,service_date&id=eq.${encodeURIComponent(bookingId)}&limit=1`, { headers });
    const booking = bookingRes.ok ? (await bookingRes.json().catch(() => []))?.[0] || null : null;
    const actorName = access.actor?.full_name || access.actor?.email || "Staff";
    const now = new Date().toISOString();
    const results = {};

    if (targets.includes("gallery")) {
      const row = { booking_id:bookingId, job_media_id:mediaId, media_url:media.media_url || raw.media_url || null, storage_bucket:raw.storage_bucket || null, storage_path:raw.storage_path || null, caption:raw.caption || "Final detailing result", stage:"final", consent_status:"needs_pairing_review", status:"queued", queued_by_staff_user_id:access.actor?.id || null, queued_by_staff_name:actorName, created_at:now, updated_at:now };
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gallery_media_candidates?on_conflict=job_media_id`, { method:"POST", headers:{ ...headers, Prefer:"resolution=merge-duplicates,return=representation" }, body:JSON.stringify([row]) });
      results.gallery = res.ok ? { ok:true, candidate:(await res.json().catch(() => []))?.[0] || null } : { ok:false, error:await res.text() };
    }

    if (targets.includes("vehicle_history")) {
      if (!booking?.vehicle_id && !booking?.customer_profile_id) results.vehicle_history = { ok:false, error:"Booking has no linked customer/vehicle record." };
      else {
        const event = { customer_id:booking.customer_profile_id || null, vehicle_id:booking.vehicle_id || null, booking_id:bookingId, event_type:"final_media", event_title:"Final detailing proof", event_note:JSON.stringify({ media_id:mediaId, media_url:media.media_url || null, storage_bucket:raw.storage_bucket || null, storage_path:raw.storage_path || null, caption:raw.caption || null }), customer_visible:true, event_at:raw.created_at || now, created_at:now };
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/vehicle_history_events`, { method:"POST", headers:{ ...headers, Prefer:"return=representation" }, body:JSON.stringify([event]) });
        results.vehicle_history = res.ok ? { ok:true, event:(await res.json().catch(() => []))?.[0] || null } : { ok:false, error:await res.text() };
      }
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?id=eq.${encodeURIComponent(mediaId)}`, { method:"PATCH", headers, body:JSON.stringify({ gallery_reuse_status:results.gallery?.ok ? "queued" : raw.gallery_reuse_status || "not_queued", vehicle_history_reuse_status:results.vehicle_history?.ok ? "added" : raw.vehicle_history_reuse_status || "not_queued" }) }).catch(() => null);
    return withCors(json({ ok:Object.values(results).some((r)=>r?.ok), results }));
  } catch (err) { return withCors(json({ ok:false, error:err?.message || "Could not reuse media." }, 500)); }
}
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
