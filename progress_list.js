import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "./_lib/staff-auth.js";
import { attachCrewAssignments, loadCrewAssignmentsMap } from "./_lib/crew-assignments.js";
import { resolveBookingIdByToken } from "./_lib/social-dispatch.js";
import { hydrateMediaRows, schemaLooksLegacy } from "./_lib/job-live-feed.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const token = String(body.token || "").trim();
    const resolvedBookingId = isUuid(booking_id) ? booking_id : await resolveBookingIdByToken({ env, token });
    if (!resolvedBookingId) return withCors(json({ error: "Invalid booking_id or token." }, 400));

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: "work_booking", bookingId: resolvedBookingId, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,customer_name,service_date,start_slot,package_code,vehicle_size,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,progress_token,current_workflow_stage,detailer_response_status,detailer_response_reason&id=eq.${encodeURIComponent(resolvedBookingId)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500));
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return withCors(json({ error: "Booking not found." }, 404));

    const [updateResult, mediaResult, signoffsRes, workflowRes, socialRes] = await Promise.all([
      fetchAdaptive(env, headers, "job_updates", resolvedBookingId,
        "id,created_at,created_by,note,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason,stage,source_channel,review_status,requires_admin_review,customer_action_required,customer_visible_at,approved_by_staff_name",
        "id,created_at,created_by,note,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason"),
      fetchAdaptive(env, headers, "job_media", resolvedBookingId,
        "id,created_at,created_by,kind,caption,media_url,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason,stage,source_channel,review_status,requires_admin_review,customer_action_required,customer_visible_at,approved_by_staff_name,storage_bucket,storage_path,content_type,file_size_bytes",
        "id,created_at,created_by,kind,caption,media_url,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason"),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=signed_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=id,created_at,event_type,event_note,actor_name,payload&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=created_at.asc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue?select=id,created_at,platform,status,post_text,media_urls,public_url,external_post_url,last_error&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=created_at.desc&limit=50`, { headers }).catch(() => null)
    ]);

    if (!updateResult.response.ok) return withCors(json({ error: `Could not load updates. ${await updateResult.response.text()}` }, 500));
    if (!mediaResult.response.ok) return withCors(json({ error: `Could not load media. ${await mediaResult.response.text()}` }, 500));
    if (!signoffsRes.ok) return withCors(json({ error: `Could not load signoffs. ${await signoffsRes.text()}` }, 500));
    if (!workflowRes.ok) return withCors(json({ error: `Could not load workflow events. ${await workflowRes.text()}` }, 500));

    const [updates, rawMedia, signoffs, workflow_events] = await Promise.all([
      updateResult.response.json().catch(() => []),
      mediaResult.response.json().catch(() => []),
      signoffsRes.json().catch(() => []),
      workflowRes.json().catch(() => [])
    ]);
    const media = await hydrateMediaRows(env, rawMedia);
    let social_posts = [];
    let social_warning = null;
    if (socialRes && socialRes.ok) social_posts = await socialRes.json().catch(() => []);
    else if (socialRes) social_warning = await socialRes.text().catch(() => "Social queue table is not available yet.");

    const crewResult = await loadCrewAssignmentsMap(env, [booking.id]);
    const bookingWithCrew = attachCrewAssignments([booking], crewResult.map)[0] || booking;
    const stats = buildStats(updates, media);
    return withCors(json({
      ok: true,
      booking: bookingWithCrew,
      updates: Array.isArray(updates) ? updates : [],
      media,
      signoffs: Array.isArray(signoffs) ? signoffs : [],
      workflow_events: Array.isArray(workflow_events) ? workflow_events : [],
      social_posts: Array.isArray(social_posts) ? social_posts : [],
      social_warning,
      crew_warning: crewResult.warning || null,
      live_feed_stats: stats,
      enhanced_schema_available: !updateResult.legacy && !mediaResult.legacy,
      schema_warning: updateResult.legacy || mediaResult.legacy ? "Run the Build 209 live interaction migration to enable review stages and private storage metadata." : null
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

async function fetchAdaptive(env, headers, table, bookingId, enhancedSelect, legacySelect) {
  const make = (select) => fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${select}&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc`, { headers });
  let response = await make(enhancedSelect);
  if (response.ok) return { response, legacy: false };
  const text = await response.text();
  if (!schemaLooksLegacy(text)) return { response: new Response(text, { status: response.status, headers: response.headers }), legacy: false };
  response = await make(legacySelect);
  return { response, legacy: true };
}

function buildStats(updates, media) {
  const rows = [...(Array.isArray(updates) ? updates : []), ...(Array.isArray(media) ? media : [])];
  return {
    total: rows.length,
    customer_visible: rows.filter((row) => row.visibility === "customer" && !["hidden", "internal_only"].includes(row.thread_status)).length,
    pending_review: rows.filter((row) => row.review_status === "pending" || row.requires_admin_review === true).length,
    internal_only: rows.filter((row) => row.visibility === "internal" && row.review_status !== "pending").length,
    action_required: rows.filter((row) => row.customer_action_required === true).length
  };
}

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
