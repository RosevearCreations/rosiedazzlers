// Build 743 — pure, shared preview authority. No outbound or database side effects.
export const PREFERENCE_FIELDS743 = Object.freeze([
  'service_email', 'service_sms', 'service_phone',
  'marketing_email', 'marketing_sms', 'marketing_phone'
]);

const CONTACT_CHANNELS = new Set(['email', 'sms', 'phone']);
const SERVICE_TYPES = /(booking|appointment|quote|deposit|refund|payment|receipt|progress|job|media|comment|reply|observation|gift|verification|confirmation|service|vehicle_size)/;
const MARKETING_TYPES = /(marketing|campaign|promotion|promotional|newsletter|abandoned_checkout|maintenance_plan_reminder|winback|rebook_reminder|review_request|seasonal_offer)/;

export function classifyPurpose743(event = {}) {
  const explicit = String(event?.payload?.communication_purpose || event?.communication_purpose || '').trim().toLowerCase();
  if (explicit === 'marketing' || explicit === 'service') return explicit;
  const type = String(event?.event_type || '').trim().toLowerCase();
  if (MARKETING_TYPES.test(type)) return 'marketing';
  if (SERVICE_TYPES.test(type)) return 'service';
  return 'unclassified';
}

export function preferenceSnapshot743(row) {
  if (!row || typeof row !== 'object') return null;
  const snapshot = { id: row.id || null, recorded_at: row.recorded_at || null };
  for (const key of PREFERENCE_FIELDS743) snapshot[key] = row[key] === true;
  return snapshot;
}

export function evaluateConsent743({ profile = {}, preference = null, channel, purpose, recipientEmail = null, recipientPhone = null } = {}) {
  const via = String(channel || '').trim().toLowerCase();
  const kind = String(purpose || '').trim().toLowerCase();
  if (!CONTACT_CHANNELS.has(via)) return denied('unsupported_channel');
  if (!['service', 'marketing'].includes(kind)) return denied('purpose_unclassified');
  if (profile?.notification_opt_in !== true) return denied('global_opt_out');
  if (!profile?.id || profile.is_active === false) return denied('customer_profile_unavailable');

  const stored = preferenceSnapshot743(preference);
  if (kind === 'marketing' && (!stored || stored[`marketing_${via}`] !== true)) return denied('marketing_requires_separate_opt_in');
  if (kind === 'service' && stored && stored[`service_${via}`] !== true) return denied('channel_opted_out');
  if (via === 'phone' && (!stored || stored[`${kind}_phone`] !== true)) return denied('manual_phone_requires_opt_in');

  const canonicalEmail = String(profile.email || '').trim().toLowerCase();
  const canonicalPhone = String(profile.sms_phone || profile.phone || '').replace(/\D+/g, '');
  if (via === 'email' && (!canonicalEmail || (recipientEmail && String(recipientEmail).trim().toLowerCase() !== canonicalEmail))) return denied('recipient_mismatch_or_missing');
  if (via !== 'email' && (!canonicalPhone || (recipientPhone && String(recipientPhone).replace(/\D+/g, '') !== canonicalPhone))) return denied('recipient_mismatch_or_missing');
  if (via !== 'phone' && String(profile.notification_channel || '').trim().toLowerCase() !== via) return denied('channel_preference_changed');

  return { allowed: true, reason: 'current_purpose_channel_consent', purpose: kind, channel: via, explicit_marketing: kind === 'marketing', inherited_service: kind === 'service' && !stored };
}

export function deliveryEvidence743(event = {}) {
  const status = String(event.status || 'queued').trim().toLowerCase();
  const hasSentMarker = Boolean(event.sent_at);
  const hasProviderResponse = Boolean(event.has_provider_response || event.provider_response);
  // `notification_events` does not contain provider-verified delivery receipts.
  // A provider response or a `sent` status cannot establish inbox/handset delivery.
  if (['cancelled', 'canceled', 'suppressed', 'held'].includes(status)) return { state: 'not_sent', label: 'Not sent — held or cancelled', definitive_delivery: false, provider_response_recorded: hasProviderResponse };
  if (status === 'failed') return { state: hasSentMarker ? 'delivery_uncertain' : 'not_sent_failed', label: hasSentMarker ? 'Failed or uncertain after handoff' : 'Not sent — failed', definitive_delivery: false, provider_response_recorded: hasProviderResponse };
  if (hasSentMarker) return { state: 'handoff_unverified', label: 'Provider handoff recorded; delivery unverified', definitive_delivery: false, provider_response_recorded: hasProviderResponse };
  if (status === 'sent' || status === 'delivered' || status === 'provider_accepted') return { state: 'status_unverified', label: 'Sent status lacks a verified delivery receipt', definitive_delivery: false, provider_response_recorded: hasProviderResponse };
  return { state: 'not_sent', label: 'Not sent — queued or awaiting review', definitive_delivery: false, provider_response_recorded: hasProviderResponse };
}

export function staffNextAction743({ consent, delivery, channel } = {}) {
  if (!consent?.allowed) return 'Hold. Review the current purpose, channel and opt-out before any contact.';
  if (channel === 'phone') return 'Manual phone handoff only. Record the staff-reported outcome separately; do not claim provider delivery.';
  if (delivery?.state === 'not_sent_failed' || delivery?.state === 'delivery_uncertain') return 'Investigate the failure and reconcile evidence. Do not automatically retry.';
  if (delivery?.state === 'handoff_unverified' || delivery?.state === 'status_unverified') return 'Await independent provider delivery evidence. Do not mark delivered from a sent flag.';
  return 'Queued or unsent. Check current consent and staff authorization before a separate dispatch decision.';
}

function denied(reason) { return { allowed: false, reason, explicit_marketing: false, inherited_service: false }; }
