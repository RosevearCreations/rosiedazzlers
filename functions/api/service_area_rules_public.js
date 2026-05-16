import { serviceHeaders } from "./_lib/staff-auth.js";

const FALLBACK_SERVICE_AREAS = {
  source_status: "bundled_json_fallback_preferred_by_client",
  service_areas: []
};

export async function onRequestGet({ env }) {
  try {
    const payload = await loadServiceAreaRules(env);
    return withCors(json({ ok: true, ...payload }));
  } catch (err) {
    return withCors(json({
      ok: true,
      ...FALLBACK_SERVICE_AREAS,
      warning: err?.message || "Could not load DB service-area rules; public pages will use bundled JSON fallback."
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadServiceAreaRules(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return FALLBACK_SERVICE_AREAS;
  }

  const tableRows = await readServiceAreaRulesTable(env);
  if (tableRows.length) {
    return {
      source_status: "service_area_rules_table",
      service_areas: tableRows
    };
  }

  const settingRows = await readServiceAreaRulesSetting(env);
  if (settingRows.length) {
    return {
      source_status: "app_management_settings.service_area_rules",
      service_areas: settingRows
    };
  }

  return FALLBACK_SERVICE_AREAS;
}

async function readServiceAreaRulesTable(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/service_area_rules?select=*&is_active=eq.true&order=county.asc,sort_order.asc,label.asc`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return normalizeRows(rows);
}

async function readServiceAreaRulesSetting(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.service_area_rules&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  const value = Array.isArray(rows) ? rows[0]?.value : null;
  return normalizeRows(Array.isArray(value?.service_areas) ? value.service_areas : Array.isArray(value) ? value : []);
}

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      county: clean(row.county),
      label: clean(row.label || row.value || row.town),
      value: clean(row.value || row.label || row.town),
      municipality: clean(row.municipality || row.town),
      zone: clean(row.zone),
      travel_tier: clean(row.travel_tier || row.tier),
      area_type: clean(row.area_type),
      aliases: normalizeStringArray(row.aliases),
      bylaw_note: clean(row.bylaw_note),
      parking_rule: clean(row.parking_rule),
      noise_rule: clean(row.noise_rule),
      water_rule: clean(row.water_rule),
      access_rule: clean(row.access_rule),
      official_links: normalizeLinks(row.official_links)
    }))
    .filter((row) => row.value || row.label);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(/\n|,/).map(clean).filter(Boolean);
  return [];
}

function normalizeLinks(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows.map((row) => ({
    label: clean(row?.label || "Official source"),
    url: clean(row?.url)
  })).filter((row) => row.url);
}

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=300"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}
