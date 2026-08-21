// File: /functions/api/admin/water_restrictions_audit.js
// Build 188: staff-only audit of editable water-rule authority and service-area links.

import fallbackServiceAreaRules from "../../../data/service_area_rules.json";
import fallbackWaterRestrictionRules from "../../../data/water_restriction_rules.json";
import { requireStaffAccess, serviceHeaders } from "../_lib/staff-auth.js";
import {
  enrichServiceAreaRowsWithWaterRules,
  loadEditableWaterRestrictionRules
} from "../_lib/water-restrictions.js";

export async function onRequestGet(context) {
  const gate = await requireStaffAccess({
    request: context.request,
    env: context.env,
    capability: "manage_staff",
    allowLegacyAdminFallback: true
  });
  if (!gate.ok) return gate.response;

  try {
    const waterPayload = await loadEditableWaterRestrictionRules(
      context.env,
      fallbackWaterRestrictionRules
    );
    const serviceRows = await loadServiceAreaRows(context.env);
    const enriched = enrichServiceAreaRowsWithWaterRules(serviceRows, waterPayload);

    const rows = enriched.map((row) => ({
      key: row.key || null,
      label: row.label || row.value || row.municipality || "Service area",
      county: row.county || "",
      municipality: row.municipality || "",
      water_rule_key: row.water_rule_key || "",
      water_rule_ok: !!String(row.water_rule || "").trim(),
      water_rule: row.water_rule || "",
      official_source_count: Array.isArray(row.official_links) ? row.official_links.length : 0
    }));

    const failed = rows.filter((row) => !row.water_rule_ok);
    const staleRules = (waterPayload.rules || []).filter((rule) => {
      const due = String(rule.next_review_at || "").trim();
      return due && due < new Date().toISOString().slice(0, 10);
    });

    return json({
      ok: true,
      authority: waterPayload.source_status,
      updated_at: waterPayload.updated_at || null,
      version: waterPayload.version || null,
      rows,
      rules: waterPayload.rules,
      summary: {
        checked: rows.length,
        passed: rows.length - failed.length,
        failed: failed.length,
        rule_count: (waterPayload.rules || []).length,
        overdue_review_count: staleRules.length
      },
      note: "This audit checks whether each service-area row can be enriched from the editable water-restriction authority. It does not compare against hard-coded phrases."
    });
  } catch (error) {
    return json({
      ok: true,
      degraded: true,
      authority: "fallback_audit_unavailable",
      message: error?.message || "Could not audit editable water restrictions.",
      rows: [],
      summary: { checked: 0, passed: 0, failed: 0, rule_count: 0, overdue_review_count: 0 }
    });
  }
}

async function loadServiceAreaRows(env) {
  if (!env?.SUPABASE_URL) {
    return normalizeRows(fallbackServiceAreaRules?.service_areas || []);
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/service_area_rules?select=*&is_active=eq.true&order=county.asc,sort_order.asc,label.asc`,
      { headers: serviceHeaders(env) }
    );
    if (res.ok) {
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows) && rows.length) return normalizeRows(rows);
    }
  } catch {
    // Fall through to bundled JSON.
  }

  return normalizeRows(fallbackServiceAreaRules?.service_areas || []);
}

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      ...row,
      key: clean(row.key),
      county: clean(row.county),
      label: clean(row.label || row.value || row.town),
      value: clean(row.value || row.label || row.town),
      municipality: clean(row.municipality || row.town),
      water_rule_key: clean(row.water_rule_key),
      official_links: Array.isArray(row.official_links) ? row.official_links : []
    }));
}

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
