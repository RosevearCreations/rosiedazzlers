// Build 743: purpose-separated, append-only customer preferences. Never dispatches.
import { getCurrentCustomerSession, serviceHeaders } from '../_lib/customer-session.js';
import { PREFERENCE_FIELDS743, preferenceSnapshot743 } from '../../../assets/notification-consent-preview-v743.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLE = 'customer_communication_preference_versions';

export async function onRequestOptions() { return response({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' }); }

export async function onRequestGet({ request, env }) {
  try {
    const identity = await getIdentity({ request, env });
    if (!identity) return response({ ok: false, error: 'Sign in to review your communication choices.' }, 401);
    const [profiles, versions] = await Promise.all([
      loadRows(env, `customer_profiles?select=id,email,phone,sms_phone,notification_opt_in,notification_channel,is_active&id=eq.${identity}&limit=1`),
      loadRows(env, `${TABLE}?select=id,recorded_at,${PREFERENCE_FIELDS743.join(',')}&customer_profile_id=eq.${identity}&order=recorded_at.desc,id.desc&limit=12`)
    ]);
    const profile = profiles[0] || null;
    if (!profile || profile.is_active !== true) return response({ ok: false, error: 'Account is unavailable.' }, 401);
    return response({ ok: true, authenticated: true,
      profile: { notification_opt_in: profile.notification_opt_in === true, notification_channel: profile.notification_channel || 'none', has_email: Boolean(profile.email), has_sms: Boolean(profile.sms_phone || profile.phone), has_phone: Boolean(profile.phone || profile.sms_phone) },
      current: preferenceSnapshot743(versions[0]),
      history: versions.map(preferenceSnapshot743),
      marketing_consent_inferred: false,
      sends_email: false, sends_sms: false, places_call: false
    });
  } catch { return response({ ok: false, error: 'Communication preferences are temporarily unavailable.' }, 503); }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!sameOrigin(request)) return response({ ok: false, error: 'Save your choices from the signed-in account page.' }, 403);
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return response({ ok: false, error: 'JSON is required.' }, 415);
    const identity = await getIdentity({ request, env });
    if (!identity) return response({ ok: false, error: 'Sign in before saving preferences.' }, 401);
    const raw = await request.text();
    if (raw.length > 2048) return response({ ok: false, error: 'Preferences are too large.' }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body) || !UUID.test(String(body.client_request_id || ''))) return response({ ok: false, error: 'A valid preference revision is required.' }, 400);
    if (!PREFERENCE_FIELDS743.every((field) => typeof body[field] === 'boolean')) return response({ ok: false, error: 'Every purpose and channel choice must be explicit.' }, 400);

    const previous = await loadRows(env, `${TABLE}?select=id,recorded_at,${PREFERENCE_FIELDS743.join(',')}&customer_profile_id=eq.${identity}&client_request_id=eq.${encodeURIComponent(body.client_request_id)}&limit=1`);
    if (previous.length) {
      if (!PREFERENCE_FIELDS743.every((field) => previous[0][field] === body[field])) return response({ ok: false, error: 'That saved preference revision cannot be changed.' }, 409);
      return response({ ok: true, duplicate: true, current: preferenceSnapshot743(previous[0]), messages_sent: false });
    }

    const payload = { customer_profile_id: identity, client_request_id: body.client_request_id, source: 'customer_account' };
    for (const key of PREFERENCE_FIELDS743) payload[key] = body[key];
    const stored = await fetch(`${env.SUPABASE_URL}/rest/v1/${TABLE}?select=id,recorded_at,${PREFERENCE_FIELDS743.join(',')}`, {
      method: 'POST', headers: { ...serviceHeaders(env), Prefer: 'return=representation' }, body: JSON.stringify([payload])
    });
    if (stored.status === 409) return response({ ok: false, error: 'Your preferences changed in another tab. Refresh before saving.' }, 409);
    if (!stored.ok) return response({ ok: false, error: 'Could not save preferences. Please retry.' }, 503);
    const rows = await stored.json().catch(() => []);
    if (!Array.isArray(rows) || !rows[0]) return response({ ok: false, error: 'Preference confirmation unavailable; refresh to check history.' }, 503);
    return response({ ok: true, duplicate: false, current: preferenceSnapshot743(rows[0]), messages_sent: false, appointment_changed: false }, 201);
  } catch (err) {
    return response({ ok: false, error: err instanceof SyntaxError ? 'Invalid preference data.' : 'Could not save communication preferences.' }, err instanceof SyntaxError ? 400 : 503);
  }
}

async function getIdentity({ request, env }) {
  if (!env?.SUPABASE_URL) return null;
  const current = await getCurrentCustomerSession({ request, env });
  const id = String(current?.customer_profile?.id || '').trim();
  return UUID.test(id) ? id : null;
}

async function loadRows(env, path) {
  const result = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  if (!result.ok) throw new Error('Source unavailable');
  const rows = await result.json();
  if (!Array.isArray(rows)) throw new Error('Invalid source');
  return rows;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (!origin || (fetchSite && !['same-origin', 'none'].includes(fetchSite))) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function response(data, status = 200, extras = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extras } });
}
