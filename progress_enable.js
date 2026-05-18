import { requireStaffAccess, json, methodNotAllowed } from '../_lib/staff-auth.js';

export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    const booking_id = String(body.booking_id || '').trim();
    if (!token && !booking_id) return withCors(json({ error: 'Missing token or booking_id.' }, 400));

    let resolvedBookingId = booking_id;
    if (!resolvedBookingId && token) {
      const booking = await getBookingByToken(env, token);
      if (!booking?.id) return withCors(json({ error: 'Booking not found.' }, 404));
      resolvedBookingId = booking.id;
    }

    const access = await requireStaffAccess({ request, env, body: { ...body, booking_id: resolvedBookingId }, capability: 'work_booking', bookingId: resolvedBookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const booking = booking_id ? await getBookingById(env, booking_id) : await getBookingByToken(env, token);
    if (!booking?.id) return withCors(json({ error: 'Booking not found.' }, 404));

    const progressToken = booking.progress_token || crypto.randomUUID();
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, {
      method: 'PATCH',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ progress_enabled: true, progress_token: progressToken })
    });
    if (!patchRes.ok) return withCors(json({ error: `Could not enable progress. ${await patchRes.text()}` }, 500));
    const rows = await patchRes.json().catch(() => []);
    const updated = Array.isArray(rows) ? rows[0] || null : null;
    return withCors(json({ ok: true, message: 'Progress enabled.', booking_id: updated?.id || booking.id, progress_token: updated?.progress_token || progressToken, progress_enabled: true }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

async function getBookingById(env, booking_id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token,status,job_status&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load booking. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}
async function getBookingByToken(env, token) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token,status,job_status&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load booking. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}
function serviceHeaders(env){ return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' }; }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
