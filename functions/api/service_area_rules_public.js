// File: /functions/api/service_area_rules_public.js
// Build 188: public DB-first service-area rules with bundled JSON fallback.
// Water-rule text is enriched from the separate editable water-restriction authority.

import fallbackServiceAreaRules from "../../data/service_area_rules.json";
import fallbackWaterRestrictionRules from "../../data/water_restriction_rules.json";
import { serviceHeaders } from "./_lib/staff-auth.js";
import {
  enrichServiceAreaRowsWithWaterRules,
  loadEditableWaterRestrictionRules
} from "./_lib/water-restrictions.js";

export async function onRequestGet({ env }) {
  try {
    const servicePayload = await loadServiceAreaRules(env);
    const waterPayload = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    );

    return withCors(json({
      ok: true,
      ...servicePayload,
      water_rule_source_status: waterPayload.source_status,
      water_rule_updated_at: waterPayload.updated_at || null,
      service_areas: enrichServiceAreaRowsWithWaterRules(
        servicePayload.service_areas,
        waterPayload
      )
    }));
  } catch (error) {
    const fallbackRows = normalizeRows(fallbackServiceAreaRules?.service_areas || []);
    const waterPayload = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    ).catch(() => fallbackWaterRestrictionRules);

    return withCors(json({
      ok: true,
      source_status: "bundled_json_fallback",
      water_rule_source_status: waterPayload?.source_status || "bundled_json_fallback",
      service_areas: enrichServiceAreaRowsWithWaterRules(fallbackRows, waterPayload),
      warning: error?.message || "Could not load DB service-area rules; bundled JSON fallback returned."
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadServiceAreaRules(env) {
  const fallbackRows = normalizeRows(fallbackServiceAreaRules?.service_areas || []);

  if (!env?.SUPABASE_URL || !hasServiceKey(env)) {
    return {
      source_status: "bundled_json_fallback",
      updated_at: fallbackServiceAreaRules?.updated_at || null,
      service_areas: fallbackRows
    };
  }

  const tableRows = await readServiceAreaRulesTable(env);
  if (tableRows.length) {
    return {
      source_status: "service_area_rules_table",
      service_areas: mergeRows(fallbackRows, tableRows)
    };
  }

  const settingRows = await readServiceAreaRulesSetting(env);
  if (settingRows.length) {
    return {
      source_status: "app_management_settings.service_area_rules",
      service_areas: mergeRows(fallbackRows, settingRows)
    };
  }

  return {
    source_status: "bundled_json_fallback",
    updated_at: fallbackServiceAreaRules?.updated_at || null,
    service_areas: fallbackRows
  };
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
  return normalizeRows(
    Array.isArray(value?.service_areas)
      ? value.service_areas
      : Array.isArray(value)
        ? value
        : []
  );
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

  return Array.from(map.values()).sort((a, b) => {
    const ac = clean(a.county).toLowerCase();
    const bc = clean(b.county).toLowerCase();
    if (ac !== bc) return ac.localeCompare(bc);
    return clean(a.label || a.value).localeCompare(clean(b.label || b.value));
  });
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
      official_links: normalizeLinks(row.official_links),
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
      is_active: row.is_active !== false
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

function hasServiceKey(env) {
  return !!(
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_SERVICE_KEY ||
    env?.SUPABASE_SERVICE_ROLE ||
    env?.SUPABASE_SECRET_KEY
  );
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
