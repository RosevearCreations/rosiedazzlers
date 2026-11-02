// Build 743: staff-only, read-only channel/purpose previews and append-only
// manual outcome notes. No provider send, queue retry or delivery assertion.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { requireActionAccess } from '../_lib/action-permissions.js';
import { PREFERENCE_FIELDS743, classifyPurpose743, evaluateConsent743, deliveryEvidence743, staffNextAction743 } from '../../../assets/notification-consent-preview-v743.mjs';

const OUTCOMES = new Set(['planned_not_contacted', 'blocked_by_preference', 'attempted_no_answer', 'voicemail_left', 'customer_contacted', 'followup_requested']);
const NOTE_TABLE = 'customer_communication_handoff_audit';
const PREF_TABLE = 'customer_communication_preference_versions';

export async function onRequestOptions() { return json({ error: 'Method not allowed.' }, 405); }

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: null, allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const action = requireActionAccess(access.actor, 'it.notifications.view');
  if (!action.ok) return action.response;
  const exactProfileId = new URL(request.url).searchParams.get('customer_profile_id') || '';
  if (exactProfileId && !isUuid(exactProfileId)) return json({ ok: false, error: 'A valid exact customer profile ID is required.' }, 400);
  try {
    const [events, manual] = await Promise.all([
      rows(env, 'notification_events?select=id,created_at,event_type,channel,status,sent_at,processed_at,attempt_count,provider_response,customer_profile_id,recipient_email,recipient_phone,payload&customer_profile_id=not.is.null&channel=in.(email,sms)&order=created_at.desc&limit=80'),
      rows(env, `${NOTE_TABLE}?select=id,customer_profile_id,notification_event_id,channel,purpose,outcome,staff_actor_name,recorded_at&order=recorded_at.desc&limit=80`)
    ]);
    const ids = [...new Set([exactProfileId, ...events.map((item) => item.customer_profile_id), ...manual.map((item) => item.customer_profile_id)].filter(isUuid))].slice(0, 50);
    if (!ids.length) return json({ ok: true, preview_only: true, no_live_dispatch: true, customers: [], notifications: [], staff_handoffs: [], provider_delivery_evidence_available: false });
    const filter = `in.(${ids.join(',')})`;
    const [profiles, versions] = await Promise.all([
      rows(env, `customer_profiles?select=id,email,phone,sms_phone,notification_opt_in,notification_channel,is_active&id=${filter}`),
      rows(env, `${PREF_TABLE}?select=id,customer_profile_id,recorded_at,${PREFERENCE_FIELDS743.join(',')}&customer_profile_id=${filter}&order=recorded_at.desc,id.desc&limit=300`)
    ]);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const latest = new Map();
    for (const version of versions) if (!latest.has(version.customer_profile_id)) latest.set(version.customer_profile_id, version);
    const customers = profiles.map((profile) => {
      const preference = latest.get(profile.id) || null;
      const channels = {};
      for (const purpose of ['service', 'marketing']) for (const channel of ['email', 'sms', 'phone']) {
        const consent = evaluateConsent743({ profile, preference, purpose, channel });
        channels[`${purpose}_${channel}`] = { allowed: consent.allowed, reason: consent.reason, next_action: staffNextAction743({ consent, channel }) };
      }
      return { id: profile.id, label: maskEmail(profile.email), preferred_channel: profile.notification_channel || 'none', global_opt_in: profile.notification_opt_in === true,
        preference_recorded_at: preference?.recorded_at || null, channels };
    });
    const notifications = events.filter((event) => profileById.has(event.customer_profile_id)).map((event) => {
      const profile = profileById.get(event.customer_profile_id);
      const channel = String(event.channel || '').toLowerCase();
      const purpose = classifyPurpose743(event);
      const consent = evaluateConsent743({ profile, preference: latest.get(profile.id) || null, channel, purpose,
        recipientEmail: event.recipient_email, recipientPhone: event.recipient_phone });
      const evidence = deliveryEvidence743(event);
      return { id: event.id, customer_profile_id: event.customer_profile_id, channel, purpose, event_type: event.event_type,
        created_at: event.created_at, source_status: event.status, sent_at: event.sent_at || null, attempt_count: event.attempt_count || 0,
        consent_allowed: consent.allowed, consent_reason: consent.reason, delivery: evidence,
        next_action: staffNextAction743({ consent, delivery: evidence, channel }),
        preview_copy: channel === 'sms' ? 'Rosie Dazzlers service or offer notice — summary preview; actual queued text is not displayed.' :
          'Rosie Dazzlers email handoff — summary preview; actual queued subject/body is not displayed.',
        live_dispatch_available: false, resend_available: false };
    });
    return json({ ok: true, preview_only: true, no_live_dispatch: true, provider_delivery_evidence_available: false,
      customers, notifications,
      staff_handoffs: manual.filter((row) => profileById.has(row.customer_profile_id)).map((row) => ({
        id: row.id, customer_profile_id: row.customer_profile_id, notification_event_id: row.notification_event_id,
        channel: row.channel, purpose: row.purpose, outcome: row.outcome, staff_actor_name: row.staff_actor_name,
        recorded_at: row.recorded_at, staff_report_unverified: true, provider_delivery_verified: false
      }))
    });
  } catch { return json({ ok: false, error: 'Current notification evidence is unavailable. All previews are held.' }, 503); }
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Record handoffs from the authorized staff screen.' }, 403);
  const raw = await request.text().catch(() => '');
  if (raw.length > 3000 || !(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json({ ok: false, error: 'A bounded JSON request is required.' }, 400);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, error: 'Invalid request.' }, 400);
  const access = await requireStaffAccess({ request, env, body, capability: 'manage_bookings', allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const customerId = String(body.customer_profile_id || '').trim();
  const clientId = String(body.client_request_id || '').trim();
  const notificationId = String(body.notification_event_id || '').trim();
  const channel = String(body.channel || '').trim().toLowerCase();
  const purpose = String(body.purpose || '').trim().toLowerCase();
  const outcome = String(body.outcome || '').trim();
  const note = typeof body.note_summary === 'string' ? body.note_summary.trim() : '';
  if (!isUuid(customerId) || !isUuid(clientId) || (notificationId && !isUuid(notificationId)) || !['email', 'sms', 'phone'].includes(channel) ||
      !['service', 'marketing'].includes(purpose) || !OUTCOMES.has(outcome) || note.length > 240) return json({ ok: false, error: 'Valid customer, channel, purpose, outcome and revision are required.' }, 400);
  if (channel !== 'phone' && !notificationId) return json({ ok: false, error: 'An exact notification reference is required for email and SMS outcome notes.' }, 400);
  try {
    const [profiles, versions, original, prior] = await Promise.all([
      rows(env, `customer_profiles?select=id,email,phone,sms_phone,notification_opt_in,notification_channel,is_active&id=eq.${customerId}&limit=1`),
      rows(env, `${PREF_TABLE}?select=id,recorded_at,${PREFERENCE_FIELDS743.join(',')}&customer_profile_id=eq.${customerId}&order=recorded_at.desc,id.desc&limit=1`),
      notificationId ? rows(env, `notification_events?select=id,customer_profile_id,channel,event_type,recipient_email,recipient_phone,payload&id=eq.${notificationId}&customer_profile_id=eq.${customerId}&limit=1`) : Promise.resolve([]),
      rows(env, `${NOTE_TABLE}?select=id,customer_profile_id,channel,purpose,outcome,notification_event_id,recorded_at&customer_profile_id=eq.${customerId}&client_request_id=eq.${clientId}&limit=1`)
    ]);
    if (prior.length) {
      const match = prior[0].channel === channel && prior[0].purpose === purpose && prior[0].outcome === outcome && (prior[0].notification_event_id || '') === notificationId;
      return match ? json({ ok: true, duplicate: true, handoff: safeHandoff(prior[0]), messages_sent: false }) : json({ ok: false, error: 'Handoff reference already used.' }, 409);
    }
    const profile = profiles[0] || null;
    if (!profile || profile.is_active !== true || (notificationId && (!original[0] || original[0].channel !== channel || classifyPurpose743(original[0]) !== purpose))) return json({ ok: false, error: 'Customer and notification source do not match.' }, 404);
    const event = original[0] || {};
    const consent = evaluateConsent743({ profile, preference: versions[0] || null, channel, purpose,
      recipientEmail: event.recipient_email, recipientPhone: event.recipient_phone });
    if (!consent.allowed && !['planned_not_contacted', 'blocked_by_preference'].includes(outcome)) return json({ ok: false, error: 'Current opt-out or channel consent blocks a claimed contact attempt.' }, 409);
    if (consent.allowed && outcome === 'blocked_by_preference') return json({ ok: false, error: 'The current consent evidence does not support an opt-out note.' }, 409);
    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/${NOTE_TABLE}?select=id,customer_profile_id,notification_event_id,channel,purpose,outcome,recorded_at`, {
      method: 'POST', headers: { ...serviceHeaders(env), Prefer: 'return=representation' },
      body: JSON.stringify([{ customer_profile_id: customerId, client_request_id: clientId,
        notification_event_id: notificationId || null, channel, purpose, outcome,
        staff_actor_name: String(access.actor?.full_name || access.actor?.email || 'Authorized staff').slice(0, 120),
        note_summary: note, staff_report_unverified: true, provider_delivery_verified: false, outbound_dispatched: false }])
    });
    if (insert.status === 409) return json({ ok: false, error: 'A matching handoff revision already exists. Refresh history.' }, 409);
    if (!insert.ok) return json({ ok: false, error: 'Could not save manual handoff record. No message sent.' }, 503);
    const saved = await insert.json().catch(() => []);
    if (!Array.isArray(saved) || !saved[0]) return json({ ok: false, error: 'Outcome readback unavailable. Refresh history.' }, 503);
    return json({ ok: true, handoff: safeHandoff(saved[0]), staff_report_unverified: true,
      provider_delivery_verified: false, messages_sent: false, phone_call_placed: false }, 201);
  } catch { return json({ ok: false, error: 'Manual handoff review unavailable. No contact was made.' }, 503); }
}

function safeHandoff(row) {
  return { id: row.id, channel: row.channel, purpose: row.purpose, outcome: row.outcome,
    notification_event_id: row.notification_event_id, recorded_at: row.recorded_at,
    staff_report_unverified: true, provider_delivery_verified: false };
}

function maskEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  const index = email.indexOf('@');
  if (index < 1) return 'Customer account';
  return `${email[0]}***${email.slice(index)}`;
}

async function rows(env, path) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error('Source read failed');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Invalid source data');
  return data;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (!origin || (fetchSite && !['same-origin', 'none'].includes(fetchSite))) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
