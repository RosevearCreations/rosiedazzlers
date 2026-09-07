// Build 361 — read-only Booking & Rebooking Funnel Analytics.
// Anonymous site sessions and exact customer_profile_id booking history are aggregated separately.
import { requireStaffAccess, json, serviceHeaders } from '../_lib/staff-auth.js';
import { customerAccessLevel } from '../_lib/customer-admin.js';
import {
  BOOKING_REBOOKING_FUNNEL_POLICY,
  deriveBookingRebookingFunnel
} from '../_lib/booking-rebooking-funnel.js';

export async function onRequest(context) {
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions();
  if (method === 'GET') return onRequestGet(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['GET','OPTIONS'] }, 405));
}

export async function onRequestOptions() {
  return new Response('', { status:204, headers:corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const access = await requireStaffAccess({ request, env, body:query, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (customerAccessLevel(access.actor) === 'none') return withCors(json({ error:'Permission denied.' }, 403));

    const days = boundedDays(query.days);
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const headers = serviceHeaders(env);
    const policy = BOOKING_REBOOKING_FUNNEL_POLICY;

    const [eventsRes, bookingsRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,session_id,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(start.toISOString())}&order=created_at.asc&limit=${policy.analytics_row_limit}`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,status,job_status,created_at,service_date,completed_at&customer_profile_id=not.is.null&order=created_at.asc&limit=${policy.booking_row_limit}`, { headers })
    ]);

    if (!eventsRes.ok) return withCors(json({ error:'Booking funnel telemetry could not be loaded.', state:'evidence_unavailable' }, 502));
    if (!bookingsRes.ok) return withCors(json({ error:'Linked booking history could not be loaded.', state:'evidence_unavailable' }, 502));

    const events = safeRows(await eventsRes.json().catch(() => []));
    const bookings = safeRows(await bookingsRes.json().catch(() => []));
    const analytics = deriveBookingRebookingFunnel({ events, bookings, since:start, until:end });

    return withCors(json({
      ok:true,
      build:361,
      generated_at:end.toISOString(),
      window:{ days, start_at:start.toISOString(), end_at:end.toISOString() },
      ...analytics,
      coverage:{
        analytics_rows_loaded:events.length,
        booking_rows_loaded:bookings.length,
        analytics_row_limit:policy.analytics_row_limit,
        booking_row_limit:policy.booking_row_limit,
        analytics_possibly_truncated:events.length >= policy.analytics_row_limit,
        booking_history_possibly_truncated:bookings.length >= policy.booking_row_limit
      },
      readiness:{
        read_only:true,
        schema_change:false,
        anonymous_session_aggregation:true,
        exact_customer_profile_history:true,
        cross_layer_identity_join:false,
        customer_identity_exposed:false,
        fuzzy_identity_merge:false,
        inferred_outreach_consent:false,
        persistent_customer_score:false,
        persistent_segmentation:false,
        automatic_notifications:false,
        automatic_booking_creation:false,
        automatic_payment_action:false,
        background_polling:false
      }
    }));
  } catch (error) {
    console.error('Could not load booking and rebooking funnel analytics.', error);
    return withCors(json({ error:error?.message || 'Could not load booking and rebooking funnel analytics.' }, 500));
  }
}

export async function onRequestPost() { return withCors(json({ error:'Booking and rebooking funnel analytics is read-only.' }, 405)); }
export async function onRequestPut() { return withCors(json({ error:'Booking and rebooking funnel analytics is read-only.' }, 405)); }
export async function onRequestPatch() { return withCors(json({ error:'Booking and rebooking funnel analytics is read-only.' }, 405)); }
export async function onRequestDelete() { return withCors(json({ error:'Booking and rebooking funnel analytics is read-only.' }, 405)); }

function boundedDays(value) {
  const parsed = Number(value || BOOKING_REBOOKING_FUNNEL_POLICY.default_days);
  if (!Number.isFinite(parsed)) return BOOKING_REBOOKING_FUNNEL_POLICY.default_days;
  return Math.max(BOOKING_REBOOKING_FUNNEL_POLICY.min_days, Math.min(BOOKING_REBOOKING_FUNNEL_POLICY.max_days, Math.round(parsed)));
}
function safeRows(value) { return Array.isArray(value) ? value : []; }
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id',
    'Cache-Control':'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
}
