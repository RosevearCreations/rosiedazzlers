import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { loadFeatureFlags } from "../_lib/app-settings.js";
import { maybeQueueCustomerNotification } from "../_lib/notification-hooks.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    const media_id = String(body.media_id || "").trim() || null;
    const title = String(body.title || "").trim() || null;
    const note = String(body.note || "").trim();
    const visibility = String(body.visibility || "customer").trim().toLowerCase();
    const category = String(body.category || 'issue').trim().toLowerCase();
    const severity = String(body.severity || 'medium').trim().toLowerCase();
    const pin_color = String(body.pin_color || '#f59e0b').trim() || '#f59e0b';
    const reply_message = String(body.reply_message || '').trim() || null;
    const x_percent = body.x_percent === null || body.x_percent === undefined || body.x_percent === "" ? null : Number(body.x_percent);
    const y_percent = body.y_percent === null || body.y_percent === undefined || body.y_percent === "" ? null : Number(body.y_percent);

    if (!booking_id || !isUuid(booking_id)) return withCors(json({ error: "Valid booking_id is required." }, 400));
    if (media_id && !isUuid(media_id)) return withCors(json({ error: "media_id must be a UUID." }, 400));
    if (!note) return withCors(json({ error: "Annotation note is required." }, 400));

    const flags = await loadFeatureFlags(env);
    if (flags.image_annotations_enabled === false) return withCors(json({ error: "Image annotations are disabled." }, 403));

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_email,customer_profile_id&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500));
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return withCors(json({ error: "Booking not found." }, 404));

    const actorName = access.actor.full_name || access.actor.email || "Staff";
    const actorEmail = access.actor.email || null;

    const payload = [{
      booking_id,
      media_id,
      x_percent: Number.isFinite(x_percent) ? x_percent : null,
      y_percent: Number.isFinite(y_percent) ? y_percent : null,
      title,
      note,
      visibility,
      category,
      severity,
      pin_color,
      created_by_type: access.actor.is_admin ? 'admin' : 'detailer',
      created_by_name: actorName,
      created_by_email: actorEmail
    }];

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (!insertRes.ok) return withCors(json({ error: `Could not save annotation. ${await insertRes.text()}` }, 500));
    const rows = await insertRes.json().catch(() => []);
    const annotation = Array.isArray(rows) ? rows[0] || null : null;

    let linked_comment = null;
    if (reply_message) {
      const commentRes = await fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify([{ booking_id, parent_type: 'annotation', parent_id: annotation?.id || null, author_type: access.actor.is_admin ? 'admin' : 'detailer', author_name: actorName, author_email: actorEmail, message: reply_message, visibility }])
      });
      if (commentRes.ok) {
        const commentRows = await commentRes.json().catch(() => []);
        linked_comment = Array.isArray(commentRows) ? commentRows[0] || null : null;
      }
    }

    if (visibility === 'customer') {
      await maybeQueueCustomerNotification({
        env,
        booking,
        event_type: 'annotation_posted',
        message: reply_message || note,
        payload: { title, media_id, x_percent, y_percent, author_name: actorName, category, severity, pin_color, annotation_id: annotation?.id || null }
      });
    }

    return withCors(json({ ok: true, annotation, linked_comment }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
