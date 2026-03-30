import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { maybeQueueCustomerNotification } from "../_lib/notification-hooks.js";
import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || '').trim();
    const message = String(body.message || '').trim();
    const parent_type = String(body.parent_type || 'booking').trim().toLowerCase();
    const parent_id = String(body.parent_id || '').trim() || null;
    const visibility = String(body.visibility || 'internal').trim().toLowerCase();
    if (!booking_id || !isUuid(booking_id)) return withCors(json({ error:'Valid booking_id is required.' },400));
    if (!message) return withCors(json({ error:'Message is required.' },400));
    if (!['booking','annotation','comment'].includes(parent_type)) return withCors(json({ error:'Invalid parent_type.' },400));
    if (!['customer','internal'].includes(visibility)) return withCors(json({ error:'Invalid visibility.' },400));

    const settings = await loadAppSettings(env, ['feature_flags','moderation_rules']);
    const flags = settings.feature_flags || {};
    const moderationRules = settings.moderation_rules || {};
    if (visibility === 'customer' && flags.customer_chat_enabled === false) return withCors(json({ error:'Customer-visible chat is disabled.' },403));

    const access = await requireStaffAccess({ request, env, body, capability:'work_booking', bookingId: booking_id, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_email,customer_profile_id,assigned_staff_email,assigned_staff_name&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ error:`Could not load booking. ${await bookingRes.text()}` },500));
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return withCors(json({ error:'Booking not found.' },404));

    const parentCheck = await validateParent({ env, headers, booking_id, parent_type, parent_id, author_type:'staff', moderationRules });
    if (!parentCheck.ok) return withCors(json({ error: parentCheck.error }, 400));

    const actorName = access.actor.full_name || access.actor.email || 'Staff';
    const actorEmail = access.actor.email || null;
    const authorType = access.actor.is_admin ? 'admin' : 'detailer';
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments`, {
      method:'POST',
      headers: { ...headers, Prefer:'return=representation' },
      body: JSON.stringify([{
        booking_id,
        parent_type,
        parent_id,
        author_type: authorType,
        author_name: actorName,
        author_email: actorEmail,
        message,
        visibility,
        thread_status: 'visible'
      }])
    });
    if (!insertRes.ok) return withCors(json({ error:`Could not save observation comment. ${await insertRes.text()}` },500));
    const rows = await insertRes.json().catch(() => []);
    if (visibility === 'customer') {
      await maybeQueueCustomerNotification({ env, booking, event_type:'staff_observation_comment_posted', message, payload: { author_type: authorType, author_name: actorName, parent_type, parent_id } });
    }
    return withCors(json({ ok:true, message:'Observation comment posted.', comment: Array.isArray(rows)? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }

async function validateParent({ env, headers, booking_id, parent_type, parent_id, author_type, moderationRules }) {
  if (parent_type === 'booking') return { ok: true };
  if (!parent_id || !isUuid(parent_id)) return { ok: false, error: 'A valid parent_id is required for replies.' };
  if (parent_type === 'annotation') {
    if (author_type === 'client' && moderationRules.allow_client_annotation_replies === false) return { ok: false, error: 'Client replies to annotations are disabled.' };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations?select=id,visibility,thread_status&booking_id=eq.${encodeURIComponent(booking_id)}&id=eq.${encodeURIComponent(parent_id)}&limit=1`, { headers });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const row = Array.isArray(rows) ? rows[0] || null : null;
    if (!row) return { ok: false, error: 'Parent annotation not found.' };
    if (row.thread_status === 'removed') return { ok: false, error: 'Parent annotation is no longer available.' };
    return { ok: true };
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments?select=id,visibility,thread_status,parent_type,parent_id&booking_id=eq.${encodeURIComponent(booking_id)}&id=eq.${encodeURIComponent(parent_id)}&limit=1`, { headers });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row) return { ok: false, error: 'Parent comment not found.' };
  if (row.thread_status === 'removed') return { ok: false, error: 'Parent comment was removed.' };
  return { ok: true };
}

function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
