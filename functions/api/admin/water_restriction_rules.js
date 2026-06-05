// File: /functions/api/admin/water_restriction_rules.js
// Build 188: protected editor API for water-restriction rules.
// DB table is preferred; app_management_settings preserves the full payload;
// bundled JSON remains the deploy-safe fallback.

import fallbackWaterRestrictionRules from "../../../data/water_restriction_rules.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  loadEditableWaterRestrictionRules,
  normalizeWaterRestrictionPayload
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
    const payload = await loadEditableWaterRestrictionRules(
      env,
      fallbackWaterRestrictionRules
    );
    return withCors(json({ ok: true, ...payload }));
  } catch (error) {
    return withCors(json({
      ok: true,
      ...normalizeWaterRestrictionPayload(fallbackWaterRestrictionRules, "bundled_json_fallback"),
      warning: error?.message || "Could not load editable water restrictions; bundled fallback returned."
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

  const payload = normalizeWaterRestrictionPayload(
    body.water_restriction_rules || body.payload || body,
    "admin_submission"
  );

  if (!payload.rules.length) {
    return withCors(json({ ok: false, error: "At least one valid water-restriction rule is required." }, 400));
  }

  try {
    const savedToTable = await upsertRuleRows(env, payload.rules);
    await saveFullPayloadSetting(env, payload);

    return withCors(json({
      ok: true,
      saved_to: savedToTable
        ? ["water_restriction_rules", "app_management_settings.water_restriction_rules"]
        : ["app_management_settings.water_restriction_rules"],
      ...payload
    }));
  } catch (error) {
    return withCors(json({
      ok: false,
      error: error?.message || "Could not save water-restriction rules."
    }, 500));
  }
}

async function upsertRuleRows(env, rows) {
  if (!env?.SUPABASE_URL) return false;

  const probe = await fetch(
    `${env.SUPABASE_URL}/rest/v1/water_restriction_rules?select=id&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!probe.ok) return false;

  const payload = rows.map((row, index) => ({
    key: row.key || `water-rule-${index + 1}`,
    label: row.label || row.county || `Water rule ${index + 1}`,
    county: row.county || null,
    effective_dates: row.effective_dates || null,
    effective_start: row.effective_start || null,
    effective_end: row.effective_end || null,
    rule_summary: row.rule_summary || null,
    address_rule: row.address_rule || null,
    residential_hours: row.residential_hours || [],
    commercial_industrial_hours: row.commercial_industrial_hours || [],
    applies_to: row.applies_to || null,
    verified_sources: row.verified_sources || [],
    local_pages: row.local_pages || [],
    towns: row.towns || [],
    local_page_rules: row.local_page_rules || {},
    source_summary: row.source_summary || null,
    verified_at: row.verified_at || null,
    next_review_at: row.next_review_at || null,
    version: row.version || null,
    sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
    is_active: row.is_active !== false,
    updated_at: new Date().toISOString()
  }));

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/water_restriction_rules?on_conflict=key`,
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

async function saveFullPayloadSetting(env, payload) {
  if (!env?.SUPABASE_URL) {
    throw new Error("Supabase is not configured. Edit data/water_restriction_rules.json for the bundled fallback.");
  }

  const value = {
    ...payload,
    updated_at: new Date().toISOString(),
    source_status: "app_management_settings.water_restriction_rules"
  };

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`,
    {
      method: "POST",
      headers: {
        ...serviceHeaders(env),
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        key: "water_restriction_rules",
        value
      })
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Could not save app_management_settings.water_restriction_rules.");
  }
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
