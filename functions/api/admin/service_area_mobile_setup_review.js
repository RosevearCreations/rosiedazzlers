// Build 659 — staff-protected GET-only reconciliation. Managed source records
// are inspected but never rewritten; municipal water-rule authority is separate.
import serviceAreasFallback from "../../../data/service_area_rules.json";
import pricingCatalogFallback from "../../../data/rosie_services_pricing_and_packages.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { auditServiceAreaAccessRows } from "../_lib/service-area-mobile-setup.js";

const SETTINGS_KEYS = ["service_area_rules", "pricing_catalog"];

function report(source, rows, updatedAt = null, warning = null) {
  const values = Array.isArray(rows) ? rows : [];
  return {
    source,
    updated_at: updatedAt,
    count: values.length,
    findings: auditServiceAreaAccessRows(values),
    warning
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return noStore(auth.response);

  const bundled = [
    report("data/service_area_rules.json", serviceAreasFallback.service_areas, serviceAreasFallback.updated_at),
    report("data/rosie_services_pricing_and_packages.json", pricingCatalogFallback.service_areas, pricingCatalogFallback.updated_at)
  ];
  const managed = await inspectManagedSources(env);
  const sources = [...bundled, ...managed];
  const needsReview = sources.some((source) => source.findings.length || source.warning);
  return noStore(json({
    ok: true,
    build: 659,
    read_only: true,
    checked_at: new Date().toISOString(),
    operating_model: "Rosie supplies standard detailing water and power; customers provide a safe, permitted work area.",
    status: needsReview ? "owner_review_required" : "service_area_access_sources_aligned",
    bundled_sources: bundled,
    managed_sources: managed,
    public_guard: "The public service-area API replaces only known contradictory access-rule display text; stored rows are left unchanged.",
    water_rule_authority: "water_restriction_rules — not changed by this report",
    legal_hold: ["/terms", "/waiver"],
    next_action: "Review flagged access_rule fields in the Admin service-area editor and verify local site/water restrictions. Explicit saving is separately controlled; this audit cannot save or sync records."
  }));
}

export async function onRequestPost() {
  return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405));
}

async function inspectManagedSources(env) {
  if (!env?.SUPABASE_URL || !hasServiceKey(env)) {
    return [report("service_area_rules_table", [], null, "Supabase is not configured; table source could not be checked."),
      ...SETTINGS_KEYS.map((key) => report(`app_management_settings.${key}`, [], null, "Supabase is not configured; managed copy could not be checked."))];
  }
  const headers = serviceHeaders(env);
  const managed = [];
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/service_area_rules?select=*&order=county.asc,sort_order.asc,label.asc`, { headers });
    if (!response.ok) {
      managed.push(report("service_area_rules_table", [], null, `Table review failed (HTTP ${response.status}).`));
    } else {
      const rows = await response.json().catch(() => null);
      managed.push(Array.isArray(rows)
        ? report("service_area_rules_table", rows, null)
        : report("service_area_rules_table", [], null, "Table returned an unexpected response."));
    }
  } catch {
    managed.push(report("service_area_rules_table", [], null, "Table source could not be read."));
  }
  for (const key of SETTINGS_KEYS) {
    const source = `app_management_settings.${key}`;
    try {
      const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers });
      if (!response.ok) {
        managed.push(report(source, [], null, `Managed ${key} review failed (HTTP ${response.status}).`));
        continue;
      }
      const records = await response.json().catch(() => null);
      if (!Array.isArray(records)) {
        managed.push(report(source, [], null, "Managed source returned an unexpected response."));
        continue;
      }
      const record = records[0];
      const value = record?.value;
      const rows = Array.isArray(value) ? value : value?.service_areas;
      managed.push(report(source, rows, record?.updated_at || null));
    } catch {
      managed.push(report(source, [], null, `Managed ${key} could not be read.`));
    }
  }
  return managed;
}

function hasServiceKey(env) {
  return Boolean(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY);
}

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
