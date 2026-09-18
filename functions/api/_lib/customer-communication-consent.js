import {
  hasActivePushSubscription,
  loadCustomerNotificationProfile
} from "./notification-hooks.js";

const CUSTOMER_CHANNELS = new Set(["email", "sms", "push"]);

export function evaluateCustomerCommunicationConsent({ profile = null, event = {}, pushActive = false } = {}) {
  const channel = normalizeChannel(event?.channel);
  const staffOwned = Boolean(event?.recipient_staff_user_id) && !event?.customer_profile_id;
  if (staffOwned) {
    return { applies: false, dispatch: true, reason: "staff_owned_communication", consent_owner: "staff" };
  }

  const customerAddressed = Boolean(event?.customer_profile_id) || CUSTOMER_CHANNELS.has(channel);
  if (!customerAddressed) {
    return { applies: false, dispatch: true, reason: "not_customer_communication", consent_owner: null };
  }

  if (!event?.customer_profile_id) return blocked("missing_customer_profile_id", channel);
  if (!profile || clean(profile.id) !== clean(event.customer_profile_id)) return blocked("missing_customer_profile", channel);
  if (profile.notification_opt_in !== true) return blocked("customer_opted_out", channel);

  if (channel === "email" || channel === "sms") {
    const currentPreference = normalizeChannel(profile.notification_channel);
    if (currentPreference !== channel) {
      return blocked("channel_preference_changed", channel, { current_channel: currentPreference || null });
    }
    const canonicalRecipient = channel === "email"
      ? normalizeEmail(profile.email)
      : normalizePhone(profile.sms_phone || profile.phone);
    const queuedRecipient = channel === "email"
      ? normalizeEmail(event.recipient_email)
      : normalizePhone(event.recipient_phone);
    if (!canonicalRecipient || !queuedRecipient) return blocked("missing_canonical_recipient", channel);
    if (canonicalRecipient !== queuedRecipient) return blocked("recipient_changed", channel);
  }

  if (channel === "push") {
    if (pushActive !== true) return blocked("no_active_push_subscription", channel);
    if (!customerPushPreferenceAllows(profile, event?.event_type)) return blocked("event_push_opted_out", channel);
  }

  if (!CUSTOMER_CHANNELS.has(channel)) return blocked("unsupported_customer_channel", channel);

  return {
    applies: true,
    dispatch: true,
    reason: "current_explicit_consent",
    channel,
    consent_owner: "customer_profile",
    customer_profile_id: clean(profile.id),
    inferred_consent: false
  };
}

export async function loadCustomerCommunicationDispatchGate({ env, event }) {
  const channel = normalizeChannel(event?.channel);
  const staffOwned = Boolean(event?.recipient_staff_user_id) && !event?.customer_profile_id;
  if (staffOwned) {
    return {
      applies: false,
      decision: evaluateCustomerCommunicationConsent({ event, profile: null, pushActive: false }),
      profile: null
    };
  }

  const customerAddressed = Boolean(event?.customer_profile_id) || CUSTOMER_CHANNELS.has(channel);
  if (!customerAddressed) {
    return {
      applies: false,
      decision: evaluateCustomerCommunicationConsent({ event, profile: null, pushActive: false }),
      profile: null
    };
  }

  if (!event?.customer_profile_id) {
    return {
      applies: true,
      decision: evaluateCustomerCommunicationConsent({ event, profile: null, pushActive: false }),
      profile: null
    };
  }

  const profile = await loadCustomerNotificationProfile({ env, customer_profile_id: event.customer_profile_id });
  const pushActive = channel === "push" && profile?.id
    ? await hasActivePushSubscription({ env, owner_type: "customer", owner_id: profile.id })
    : false;

  return {
    applies: true,
    profile,
    decision: evaluateCustomerCommunicationConsent({ profile, event, pushActive })
  };
}

export function classifyNotificationDeliveryEvidence(event = {}) {
  const status = clean(event.status).toLowerCase();
  if (status === "delivered" && event.delivered_at && event.provider_delivery_verified === true) {
    return { state: "delivered", provider_dependent: false, definitive_delivery: true, evidence_at: event.delivered_at };
  }
  if ((status === "sent" || status === "provider_accepted") && event.sent_at) {
    return { state: "provider_accepted", provider_dependent: true, definitive_delivery: false, evidence_at: event.sent_at };
  }
  if (status === "failed") {
    return { state: "failed", provider_dependent: false, definitive_delivery: false, evidence_at: event.processed_at || null };
  }
  if (status === "cancelled" || status === "suppressed") {
    return { state: status, provider_dependent: false, definitive_delivery: false, evidence_at: event.processed_at || null };
  }
  return { state: status || "queued", provider_dependent: true, definitive_delivery: false, evidence_at: null };
}

export function customerPushPreferenceAllows(profile, eventType) {
  const type = clean(eventType).toLowerCase();
  if (type.includes("media")) return profile?.notify_on_media_upload !== false;
  if (type.includes("comment") || type.includes("reply") || type.includes("message")) {
    return profile?.notify_on_comment_reply !== false && profile?.detailer_chat_opt_in !== false;
  }
  if (type.includes("progress") || type.includes("status") || type.includes("job")) {
    return profile?.notify_on_progress_post !== false;
  }
  return true;
}

function blocked(reason, channel, extra = {}) {
  return {
    applies: true,
    dispatch: false,
    reason,
    channel: channel || null,
    consent_owner: "customer_profile",
    inferred_consent: false,
    ...extra
  };
}
function normalizeChannel(value) { return clean(value).toLowerCase(); }
function normalizeEmail(value) { return clean(value).toLowerCase(); }
function normalizePhone(value) { return clean(value).replace(/\D+/g, ""); }
function clean(value) { return String(value ?? "").trim(); }
