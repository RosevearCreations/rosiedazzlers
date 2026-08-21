// File: /functions/api/water_restrictions_public.js
// Build 188: public DB-first water-restriction API with one editable JSON fallback.

import fallbackWaterRestrictionRules from "../../data/water_restriction_rules.json";
import {
  findWaterRestrictionRule,
  loadEditableWaterRestrictionRules,
  normalizeWaterRestrictionPayload
} from "./_lib/water-restrictions.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const town = url.searchParams.get("town") || url.searchParams.get("municipality") || "";
  const slug = url.searchParams.get("slug") || "";
  const county = url.searchParams.get("county") || "";

  try {
    const payload = await loadEditableWaterRestrictionRules(
      context.env,
      fallbackWaterRestrictionRules
    );
    const match = findWaterRestrictionRule(payload, slug || town || county);

    return json({
      ok: true,
      authority: payload.source_status,
      updated_at: payload.updated_at || null,
      version: payload.version || null,
      requested: { town, slug, county },
      match,
      rules: payload.rules,
      local_page_rules: payload.local_page_rules,
      note: "Water-use rules are loaded from editable database/app-setting data with data/water_restriction_rules.json as the deploy-safe fallback."
    });
  } catch (error) {
    const fallback = normalizeWaterRestrictionPayload(
      fallbackWaterRestrictionRules,
      "bundled_json_fallback"
    );

    return json({
      ok: true,
      authority: fallback.source_status,
      updated_at: fallback.updated_at || null,
      version: fallback.version || null,
      requested: { town, slug, county },
      match: findWaterRestrictionRule(fallback, slug || town || county),
      rules: fallback.rules,
      local_page_rules: fallback.local_page_rules,
      warning: error?.message || "Could not load editable water restrictions; bundled JSON fallback returned."
    });
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
