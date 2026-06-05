// File: /functions/api/admin/service_area_rules.js
// Build 188: protected service-area rule editor.
// Location/travel/access details live here; mutable water-rule text is enriched
// from the separate editable water-restriction authority.

import fallbackServiceAreaRules from "../../../data/service_area_rules.json";
import fallbackWaterRestrictionRules from "../../../data/water_restriction_rules.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  enrichServiceAreaRowsWithWaterRules,
  loadEditableWaterRestrictionRules
} from "../_lib/water-restrictions.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({
    request,
    env,
    capability: "manage_staff",
    allowLegacyAdminFallback: true
  });
  if (!auth.ok) return withCors(auth.response);

  try {
    const rows = await readRows(env);
    const waterRules = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    );

    return withCors(json({
      ok: true,
      source_status: rows.source_status,
      water_rule_source_status: waterRules.source_status,
      service_areas: enrichServiceAreaRowsWithWaterRules(rows.service_areas, waterRules)
    }));
  } catch (error) {
    const fallbackRows = normalizeRows(fallbackServiceAreaRules?.service_areas || []);
    const waterRules = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    ).catch(() => fallbackWaterRestrictionRules);

    return withCors(json({
      ok: true,
      source_status: "bundled_json_fallback",
      water_rule_source_status: waterRules?.source_status || "bundled_json_fallback",
      service_areas: enrichServiceAreaRowsWithWaterRules(fallbackRows, waterRules),
      warning: error?.message || "Could not load editable service-area rules; bundled fallback returned."
    }));
  }
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({
    request,
    env,
    body,
    capability: "manage_staff",
    allowLegacyAdminFallback: true
  });
  if (!auth.ok) return withCors(auth.response);

  const serviceAreas = normalizeRows(body.service_areas || body.items || []);
  if (!serviceAreas.length) {
    return withCors(json({ ok: false, error: "No valid service-area rows supplied." }, 400));
  }

  try {
    const savedToTable = await upsertTableRows(env, serviceAreas);
    await saveSettingRows(env, serviceAreas);

    const waterRules = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    );

    return withCors(json({
      ok: true,
      saved_to: savedToTable
        ? ["service_area_rules", "app_management_settings.service_area_rules"]
        : ["app_management_settings.service_area_rules"],
      service_areas: enrichServiceAreaRowsWithWaterRules(serviceAreas, waterRules)
    }));
  } catch (error) {
    return withCors(json({
      ok: false,
      error: error?.message || "Could not save service-area rules."
    }, 500));
  }
}

async function readRows(env) {
  const fallbackRows = normalizeRows(fallbackServiceAreaRules?.service_areas || []);
  const tableRows = await readTableRows(env);
  if (tableRows.length) {
    return {
      source_status: "service_area_rules_table",
      service_areas: mergeRows(fallbackRows, tableRows)
    };
  }

  const settingRows = await readSettingRows(env);
  if (settingRows.length) {
    return {
      source_status: "app_management_settings.service_area_rules",
      service_areas: mergeRows(fallbackRows, settingRows)
    };
  }

  return {
    source_status: "bundled_json_fallback",
    service_areas: fallbackRows
  };
}

async function readTableRows(env) {
  if (!env?.SUPABASE_URL) return [];
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/service_area_rules?select=*&order=county.asc,sort_order.asc,label.asc`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return [];
  return normalizeRows(await res.json().catch(() => []));
}

async function readSettingRows(env) {
  if (!env?.SUPABASE_URL) return [];
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.service_area_rules&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  const value = Array.isArray(rows) ? rows[0]?.value : null;
  return normalizeRows(
    Array.isArray(value?.service_areas)
      ? value.service_areas
      : Array.isArray(value)
        ? value
        : []
  );
}

async function upsertTableRows(env, rows) {
  if (!env?.SUPABASE_URL) return false;

  const probe = await fetch(
    `${env.SUPABASE_URL}/rest/v1/service_area_rules?select=id&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!probe.ok) return false;

  const payload = rows.map((row, index) => ({
    key: slug(row.value || row.label || `area-${index + 1}`),
    county: row.county || null,
    label: row.label || row.value,
    value: row.value || row.label,
    municipality: row.municipality || null,
    zone: row.zone || null,
    travel_tier: row.travel_tier || null,
    area_type: row.area_type || null,
    aliases: row.aliases || [],
    bylaw_note: row.bylaw_note || null,
    parking_rule: row.parking_rule || null,
    noise_rule: row.noise_rule || null,
    water_rule_key: row.water_rule_key || null,
    water_rule: null,
    access_rule: row.access_rule || null,
    official_links: row.official_links || [],
    sort_order: index,
    is_active: true
  }));

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/service_area_rules?on_conflict=key`,
    {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(payload)
    }
  );
  return res.ok;
}

async function saveSettingRows(env, rows) {
  if (!env?.SUPABASE_URL) {
    throw new Error("Supabase is not configured. Edit data/service_area_rules.json for the bundled fallback.");
  }

  const payload = {
    key: "service_area_rules",
    value: {
      updated_at: new Date().toISOString(),
      water_rule_authority: "water_restriction_rules",
      service_areas: rows.map((row) => ({ ...row, water_rule: null }))
    }
  };

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`,
    {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Service-area rules setting save failed.");
  }
}

function mergeRows(fallbackRows, overrideRows) {
  const map = new Map();
  for (const row of fallbackRows || []) {
    const key = mergeKey(row);
    if (key) map.set(key, row);
  }
  for (const row of overrideRows || []) {
    const key = mergeKey(row);
    if (!key) continue;
    map.set(key, { ...(map.get(key) || {}), ...row });
  }
  return Array.from(map.values());
}

function mergeKey(row) {
  return clean(row?.key || row?.value || row?.label || row?.municipality).toLowerCase();
}

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      key: clean(row.key),
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
      water_rule_key: clean(row.water_rule_key),
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
  return rows
    .map((row) => ({
      label: clean(row?.label || "Official source"),
      url: clean(row?.url)
    }))
    .filter((row) => row.url);
}

function slug(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `area-${Date.now()}`;
}

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
