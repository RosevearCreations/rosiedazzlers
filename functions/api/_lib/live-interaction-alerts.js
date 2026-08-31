import { queueNotificationEvent, maybeQueueCustomerNotification, maybeQueueStaffPushNotification } from "./notification-hooks.js";
import { serviceHeaders } from "./staff-auth.js";

const ACTIVE_LIVE_STATES = new Set(["accepted","dispatched","arrived","detailing","paused","in_progress","active"]);
const CLOSED_LIVE_STATES = new Set(["completed","complete","closed","cancelled","canceled","declined","no_show","no-show"]);

export async function loadLiveBooking(env, bookingId) {
  if (!bookingId || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;
  const select = [
    "id","customer_name","customer_email","customer_profile_id","assigned_staff_user_id","assigned_staff_email","assigned_staff_name","assigned_to",
    "progress_token","progress_enabled","service_date","start_slot","package_code","vehicle_id","status","job_status","current_workflow_stage"
  ].join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=${select}&id=eq.${encodeURIComponent(bookingId)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export function liveCommunicationState(booking) {
  if (!booking) return { open:false, state:"missing", reason:"booking_not_found" };
  const candidates = [booking.current_workflow_stage, booking.job_status, booking.status]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const closed = candidates.find((value) => CLOSED_LIVE_STATES.has(value));
  if (closed) return { open:false, state:closed, reason:"job_closed" };
  const active = candidates.find((value) => ACTIVE_LIVE_STATES.has(value));
  if (active) return { open:true, state:active, reason:null };
  return { open:false, state:candidates[0] || "not_active", reason:"job_not_active" };
}

export async function requireLiveCommunicationOpen(env, bookingId, { requireProgress = false } = {}) {
  const booking = await loadLiveBooking(env, bookingId);
  if (!booking) return { ok:false, booking:null, state:liveCommunicationState(null) };
  if (requireProgress && booking.progress_enabled === false) {
    return { ok:false, booking, state:{ open:false, state:"progress_disabled", reason:"progress_disabled" } };
  }
  const state = liveCommunicationState(booking);
  return { ok:state.open, booking, state };
}

export async function queueCustomerLiveAlert({ env, bookingId, eventType, message, payload = {}, channelHint = null }) {
  const gate = await requireLiveCommunicationOpen(env, bookingId, { requireProgress:true });
  if (!gate.ok) return { ok:false, skipped:true, reason:gate.state.reason, communication_state:gate.state.state };
  const booking = gate.booking;
  const result = await maybeQueueCustomerNotification({
    env,
    booking,
    event_type: eventType,
    message,
    channel_hint: channelHint,
    payload: {
      booking_id: booking.id,
      progress_url: booking.progress_token ? `/progress.html?token=${booking.progress_token}#commentForm` : null,
      ...payload
    }
  });
  if (result?.ok) await patchBookingTimestamp(env, bookingId, { progress_last_customer_notified_at: new Date().toISOString() });
  return result;
}

export async function queueStaffLiveAlert({ env, bookingId, eventType, message, payload = {} }) {
  const gate = await requireLiveCommunicationOpen(env, bookingId);
  if (!gate.ok) return { ok:false, skipped:true, reason:gate.state.reason, communication_state:gate.state.state };
  const booking = gate.booking;
  const recipients = new Set([
    booking.assigned_staff_email,
    env?.ADMIN_NOTIFICATION_EMAIL,
    env?.OWNER_NOTIFICATION_EMAIL
  ].map((v) => String(v || "").trim()).filter(Boolean));
  const results = [];
  for (const recipient of recipients) {
    results.push(await queueNotificationEvent({
      env,
      event_type: eventType,
      channel: "email",
      booking_id: bookingId,
      recipient_email: recipient,
      body_text: message,
      payload: { message, booking_id: bookingId, customer_name: booking.customer_name || null, detailer_url:`/app/detailer/?job=${encodeURIComponent(bookingId)}#liveJobHost`, ...payload }
    }));
  }
  if (booking.assigned_staff_user_id) {
    results.push(await maybeQueueStaffPushNotification({
      env,
      staff_user_id: booking.assigned_staff_user_id,
      booking_id: bookingId,
      event_type: eventType,
      message,
      payload: {
        booking_id: bookingId,
        customer_name: booking.customer_name || null,
        detailer_url: `/app/detailer/?job=${encodeURIComponent(bookingId)}#liveJobHost`,
        ...payload
      }
    }));
  }
  if (!results.length) return { ok:false, skipped:true, reason:"no_staff_recipient" };
  if (results.some((item) => item?.ok)) await patchBookingTimestamp(env, bookingId, { progress_last_staff_notified_at: new Date().toISOString() });
  return { ok: results.some((item) => item?.ok), results };
}

export async function patchBookingTimestamp(env, bookingId, patch) {
  if (!bookingId) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify(patch)
  }).catch(() => null);
}
