// Build 414 — explicit operator save for dated Search Console / GBP evidence snapshots.
// This stores bounded measurement evidence in the existing app_management_settings authority.
// It never stores Google credentials/tokens and never contacts or mutates a Google provider.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const SETTING_KEY = "local_search_provider_evidence";
const PROVIDERS = new Set(["search_console", "google_business_profile"]);
const METRICS = {
  search_console: ["clicks", "impressions", "ctr_percent", "average_position"],
  google_business_profile: ["profile_views", "website_clicks", "calls", "direction_requests"]
};

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) return json({ ok: false, error: "Supabase settings authority is unavailable." }, 503);

    const provider = clean(body.provider);
    if (!PROVIDERS.has(provider)) return json({ ok: false, error: "Provider must be search_console or google_business_profile." }, 400);

    const snapshot = validateSnapshot(body.snapshot, provider);
    if (!snapshot.ok) return json({ ok: false, error: snapshot.error }, 400);

    const headers = serviceHeaders(env);
    const existingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.${encodeURIComponent(SETTING_KEY)}&limit=1`,
      { headers }
    );
    const rows = existingRes.ok ? await existingRes.json().catch(() => []) : [];
    const existing = Array.isArray(rows) && rows[0]?.value && typeof rows[0].value === "object" ? rows[0].value : {};
    const value = {
      ...existing,
      [provider]: {
        ...snapshot.value,
        recorded_at: new Date().toISOString()
      }
    };

    const saveRes = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify([{ key: SETTING_KEY, value, updated_at: new Date().toISOString() }])
    });
    const text = await saveRes.text();
    const saved = safeJson(text);
    if (!saveRes.ok) return json({ ok: false, error: saved?.message || text || "Could not save local-search provider evidence." }, 500);

    return json({
      ok: true,
      provider,
      evidence_state: "observed_snapshot",
      snapshot: value[provider],
      rule: "Saved evidence is a dated operator-observed provider snapshot. It does not create a live Google API assertion or ranking guarantee."
    });
  } catch (err) {
    return json({ ok: false, error: safeError(err) }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "POST required." }, 405);
}

function validateSnapshot(raw, provider) {
  const source = raw && typeof raw === "object" ? raw : {};
  const label = clean(source.label).slice(0, 160);
  const periodStart = dateOnly(source.period_start);
  const periodEnd = dateOnly(source.period_end);
  const observed = new Date(clean(source.observed_at));
  if (label.length < 3) return { ok: false, error: "Enter the Search Console property or GBP location label." };
  if (!periodStart || !periodEnd) return { ok: false, error: "Enter a valid provider measurement start and end date." };
  if (periodStart > periodEnd) return { ok: false, error: "Measurement start date cannot be after the end date." };
  if (Number.isNaN(observed.getTime())) return { ok: false, error: "Enter the date/time when this provider evidence was observed." };
  if (observed.getTime() > Date.now() + 86400000) return { ok: false, error: "Observed time cannot be in the future." };

  const metrics = {};
  for (const key of METRICS[provider]) {
    if (source?.metrics?.[key] === "" || source?.metrics?.[key] == null) continue;
    const value = Number(source.metrics[key]);
    if (!Number.isFinite(value) || value < 0) return { ok: false, error: `${key} must be a non-negative number.` };
    if (key === "ctr_percent" && value > 100) return { ok: false, error: "ctr_percent cannot exceed 100." };
    metrics[key] = value;
  }
  if (!Object.keys(metrics).length) return { ok: false, error: "Record at least one provider metric." };

  return {
    ok: true,
    value: {
      label,
      period_start: periodStart,
      period_end: periodEnd,
      observed_at: observed.toISOString(),
      metrics,
      source_note: clean(source.source_note).slice(0, 300) || null
    }
  };
}

function dateOnly(value) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const date = new Date(text + "T00:00:00Z");
  return Number.isNaN(date.getTime()) ? "" : text;
}
function hasSupabaseConfig(env) { return Boolean(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function clean(value) { return String(value == null ? "" : value).trim(); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function safeError(err) { return clean(err?.message || err || "Could not save local-search provider evidence.").replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 500); }
