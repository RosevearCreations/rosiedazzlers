// Historical Build 191 compatibility tokens: loadAnalyticsEventMeta ; analytics_event_inactive ; event_registry_known
// Build 262 — CPU-safe public analytics ingestion.
// Accepts a bounded batch and performs at most one settings read + one event insert.
// Analytics always fails open: telemetry must never block customer/admin workflows.

const MAX_EVENTS_PER_REQUEST = 12;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PAYLOAD_KEYS = 20;

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  const serviceKey = getSupabaseServiceRoleKey(env);
  try {
    if (!env?.SUPABASE_URL || !serviceKey) {
      return withCors(json({ ok: true, skipped: true, reason: 'analytics_storage_not_configured' }));
    }

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return withCors(json({ ok: true, skipped: true, reason: 'analytics_payload_too_large' }));
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return withCors(json({ ok: true, skipped: true, reason: 'invalid_analytics_payload' }));
    }

    const rawEvents = Array.isArray(body.events) ? body.events : [body];
    if (!rawEvents.length) return withCors(json({ ok: true, skipped: true, reason: 'empty_batch' }));
    const events = rawEvents.slice(0, MAX_EVENTS_PER_REQUEST);

    // Preserve owner-editable analytics enablement and event registry, but fetch both
    // settings in one request instead of two separate hot-path lookups per event.
    const settings = await loadAnalyticsSettings(env).catch(() => ({ enabled: true, registry: new Map() }));
    if (settings.enabled === false) {
      return withCors(json({ ok: true, skipped: true, reason: 'analytics_disabled' }));
    }

    const ipAddress = request.headers.get('cf-connecting-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const cf = request.cf || {};
    const now = new Date().toISOString();
    const rows = [];

    for (const item of events) {
      const normalized = normalizeEvent(item, { request, cf, ipAddress, userAgent, now, registry: settings.registry });
      if (normalized) rows.push(normalized);
    }

    if (!rows.length) {
      return withCors(json({ ok: true, skipped: true, reason: 'no_valid_events' }));
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events`, {
      method: 'POST',
      headers: serviceHeaders(env),
      body: JSON.stringify(rows)
    });

    if (!res.ok) {
      // Do not read/echo a potentially large provider error body on a non-essential path.
      return withCors(json({ ok: true, skipped: true, reason: 'analytics_storage_unavailable', status: res.status }));
    }

    return withCors(json({ ok: true, accepted: rows.length, received: rawEvents.length, truncated: rawEvents.length > MAX_EVENTS_PER_REQUEST }));
  } catch (err) {
    return withCors(json({ ok: true, skipped: true, reason: 'analytics_ingest_exception', diagnostic: safeError(err) }));
  }
}

export async function onRequestGet() {
  return withCors(json({ ok: true, skipped: true, reason: 'analytics_post_only' }));
}

function normalizeEvent(body, { request, cf, ipAddress, userAgent, now, registry }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const visitorId = clean(body.visitor_id, 128);
  const sessionId = clean(body.session_id, 128);
  if (!visitorId || !sessionId) return null;

  const eventType = clean(body.event_type, 80) || 'page_view';
  const meta = registry.get(eventType) || null;
  if (meta?.is_active === false) return null;

  const timezone = clean(body.timezone, 80);
  const basePayload = sanitizePayload({
    ...(body.payload || {}),
    event_label: meta?.label || body.payload?.event_label || eventType,
    event_category: meta?.category || body.payload?.event_category || '',
    event_registry_known: !!meta
  });

  const payload = sanitizePayload({
    ...basePayload,
    city: clean(cf.city, 120),
    region: clean(cf.region, 120),
    region_code: clean(cf.regionCode, 32),
    postal_code: clean(cf.postalCode, 40),
    timezone: clean(cf.timezone, 80) || timezone,
    colo: clean(cf.colo, 32),
    device_type: classifyDeviceType(userAgent)
  });

  return {
    visitor_id: visitorId,
    session_id: sessionId,
    event_type: eventType,
    page_path: normalizePath(body.page_path || '/'),
    page_title: clean(body.page_title, 200),
    referrer: clean(body.referrer, 1000),
    country: clean(body.country, 80) || request.headers.get('cf-ipcountry') || null,
    ip_address: ipAddress,
    user_agent: userAgent,
    locale: clean(body.locale, 40),
    timezone,
    screen: clean(body.screen, 40),
    source: clean(body.source, 80),
    campaign: clean(body.campaign, 120),
    checkout_state: clean(body.checkout_state, 40),
    payload,
    created_at: clean(body.created_at, 40) || now
  };
}

async function loadAnalyticsSettings(env) {
  const headers = serviceHeaders(env);
  const keys = encodeURIComponent('"feature_flags","analytics_event_registry"');
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=in.(${keys})&limit=2`,
    { headers }
  );
  if (!res.ok) return { enabled: true, registry: new Map() };
  const rows = await res.json().catch(() => []);
  let enabled = true;
  const registry = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.key === 'feature_flags' && row?.value?.analytics_tracking_enabled === false) enabled = false;
    if (row?.key === 'analytics_event_registry') {
      for (const event of Array.isArray(row?.value?.events) ? row.value.events : []) {
        const key = String(event?.key || '').trim();
        if (!key) continue;
        registry.set(key, {
          label: clean(event.label, 160) || key,
          category: clean(event.category, 100) || '',
          is_active: event.is_active !== false
        });
      }
    }
  }
  return { enabled, registry };
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || '';
}

function serviceHeaders(env) {
  const serviceKey = getSupabaseServiceRoleKey(env);
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
}

function clean(v, n = 255) {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, n) : null;
}

function normalizePath(p) {
  const s = String(p || '/').trim();
  if (!s) return '/';
  return s.startsWith('/') ? s.slice(0, 255) : `/${s.slice(0, 254)}`;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out = {};
  for (const [k, v] of Object.entries(payload).slice(0, MAX_PAYLOAD_KEYS)) {
    const key = String(k).slice(0, 80);
    if (v == null) out[key] = null;
    else if (['string', 'number', 'boolean'].includes(typeof v)) out[key] = typeof v === 'string' ? v.slice(0, 400) : v;
  }
  return out;
}

function classifyDeviceType(userAgent) {
  const ua = String(userAgent || '').toLowerCase();
  if (/mobile|iphone|ipod|android(?!.*tablet)/.test(ua)) return 'mobile';
  if (/ipad|tablet|kindle|silk|playbook/.test(ua)) return 'tablet';
  return 'desktop';
}

function safeError(err) {
  const raw = err?.message || String(err || 'Unexpected server error.');
  return raw.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [redacted]').slice(0, 300);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
