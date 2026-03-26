import { requireStaffAccess, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

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

    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: "application/json" };
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,customer_name,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token&id=eq.${encodeURIComponent(resolvedBookingId)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500));
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return withCors(json({ error: "Booking not found." }, 404));

    const [updatesRes, mediaRes, signoffsRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=id,created_at,created_by,note,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,created_at,created_by,kind,caption,media_url,visibility,thread_status,moderated_at,moderated_by_name,moderation_reason&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent&booking_id=eq.${encodeURIComponent(resolvedBookingId)}&order=signed_at.desc`, { headers })
    ]);
    if (!updatesRes.ok) return withCors(json({ error: `Could not load updates. ${await updatesRes.text()}` }, 500));
    if (!mediaRes.ok) return withCors(json({ error: `Could not load media. ${await mediaRes.text()}` }, 500));
    if (!signoffsRes.ok) return withCors(json({ error: `Could not load signoffs. ${await signoffsRes.text()}` }, 500));
    const [updates, media, signoffs] = await Promise.all([updatesRes.json().catch(() => []), mediaRes.json().catch(() => []), signoffsRes.json().catch(() => [])]);
    return withCors(json({ ok: true, booking, updates: Array.isArray(updates)?updates:[], media: Array.isArray(media)?media:[], signoffs: Array.isArray(signoffs)?signoffs:[] }));
  } catch (err) { return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500)); }
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
