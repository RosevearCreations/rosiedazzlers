// functions/api/_lib/notification-hooks.js
// Build 270 event-driven notification queue helpers for email/SMS/Web Push.

export async function queueNotificationEvent({ env, event_type, channel = null, booking_id = null, customer_profile_id = null, recipient_staff_user_id = null, recipient_email = null, recipient_phone = null, subject = null, body_text = null, payload = {} }) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !event_type) return { ok: false, skipped: true };
    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{
        event_type,
        channel,
        booking_id,
        customer_profile_id,
        recipient_staff_user_id,
        recipient_email,
        recipient_phone,
        subject,
        body_text,
        payload,
        status: 'queued',
        attempt_count: 0,
        next_attempt_at: new Date().toISOString(),
        max_attempts: 5
      }])
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function loadCustomerNotificationProfile({ env, customer_email = null, customer_profile_id = null }) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;
    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };
    let url = `${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email,full_name,phone,notification_opt_in,notification_channel,detailer_chat_opt_in,notify_on_progress_post,notify_on_media_upload,notify_on_comment_reply`;
    if (customer_profile_id) url += `&id=eq.${encodeURIComponent(customer_profile_id)}`;
    else if (customer_email) url += `&email=eq.${encodeURIComponent(customer_email)}`;
    else return null;
    url += '&limit=1';
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] || null : null;
  } catch {
    return null;
  }
}

export async function hasActivePushSubscription({ env, owner_type, owner_id }) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !owner_id) return false;
    const ownerColumn = owner_type === 'staff' ? 'staff_user_id' : 'customer_profile_id';
    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };
    const url = `${env.SUPABASE_URL}/rest/v1/notification_push_subscriptions?select=id&owner_type=eq.${encodeURIComponent(owner_type)}&${ownerColumn}=eq.${encodeURIComponent(owner_id)}&push_enabled=eq.true&revoked_at=is.null&limit=1`;
    const res = await fetch(url, { headers });
    if (!res.ok) return false;
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function maybeQueueCustomerNotification({ env, booking = null, customer_profile = null, event_type, message, channel_hint = null, payload = {} }) {
  if (!booking && !customer_profile) return { ok: false, skipped: true };
  const profile = customer_profile || await loadCustomerNotificationProfile({
    env,
    customer_profile_id: booking?.customer_profile_id || null,
    customer_email: booking?.customer_email || null
  });
  if (!profile) return { ok: false, skipped: true, reason: 'no_profile' };
  if (profile.notification_opt_in !== true) return { ok: false, skipped: true, reason: 'opted_out' };

  const channel = String(channel_hint || profile.notification_channel || 'email').trim().toLowerCase();
  const common = {
    env,
    event_type,
    booking_id: booking?.id || null,
    customer_profile_id: profile.id || null,
    recipient_email: profile.email || null,
    recipient_phone: profile.phone || null,
    body_text: message || null,
    payload: { message, ...payload }
  };

  if (channel === 'push') {
    if (!customerPushPreferenceAllows(profile, event_type)) return { ok:false, skipped:true, reason:'event_push_opted_out' };
    const active = await hasActivePushSubscription({ env, owner_type:'customer', owner_id:profile.id });
    if (!active) return { ok:false, skipped:true, reason:'no_push_subscription' };
    return queueNotificationEvent({ ...common, channel:'push', recipient_email:null, recipient_phone:null });
  }

  const primary = await queueNotificationEvent({ ...common, channel });
  let push = null;
  if (customerPushPreferenceAllows(profile, event_type)) {
    const active = await hasActivePushSubscription({ env, owner_type:'customer', owner_id:profile.id });
    if (active) {
      push = await queueNotificationEvent({ ...common, channel:'push', recipient_email:null, recipient_phone:null });
    }
  }
  return { ok: primary?.ok === true || push?.ok === true, primary, push };
}

export async function maybeQueueStaffPushNotification({ env, staff_user_id, booking_id = null, event_type, message, payload = {} }) {
  if (!staff_user_id || !event_type) return { ok:false, skipped:true, reason:'missing_staff_target' };
  const active = await hasActivePushSubscription({ env, owner_type:'staff', owner_id:staff_user_id });
  if (!active) return { ok:false, skipped:true, reason:'no_push_subscription' };
  return queueNotificationEvent({
    env,
    event_type,
    channel:'push',
    booking_id,
    recipient_staff_user_id:staff_user_id,
    body_text:message || null,
    payload:{ message, ...payload }
  });
}

function customerPushPreferenceAllows(profile, eventType) {
  const type = String(eventType || '').trim().toLowerCase();
  if (type.includes('media')) return profile.notify_on_media_upload !== false;
  if (type.includes('comment') || type.includes('reply') || type.includes('message')) return profile.notify_on_comment_reply !== false && profile.detailer_chat_opt_in !== false;
  if (type.includes('progress') || type.includes('status') || type.includes('job')) return profile.notify_on_progress_post !== false;
  return true;
}
