// Build 658 — authenticated GET-only audit of service/add-on landing sources.
// No database writes or changes to legal/municipal rules.
import fallbackContent from "../../../data/landing_pages_content.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  auditServiceAddonLandingPage,
  flattenServiceAddonLandingContent
} from "../_lib/service-addon-mobile-setup.js";

const SETTINGS_KEYS = ["landing_pages_content", "landing_pages"];

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return noStore(auth.response);

  const bundledPages = flattenServiceAddonLandingContent(fallbackContent);
  const knownSlugs = Object.keys(bundledPages);
  const bundled = Object.entries(bundledPages).map(([slug, page]) => ({
    slug,
    title: String(page.name || slug).slice(0, 120),
    findings: auditServiceAddonLandingPage(page, slug, knownSlugs)
  }));
  const sources = [];
  const headers = serviceHeaders(env);
  for (const key of SETTINGS_KEYS) {
    sources.push(await inspectManagedSource(env, headers, key, knownSlugs));
  }

  const hasConflicts = bundled.some((page) => page.findings.length)
    || sources.some((source) => source.pages.some((page) => page.findings.length));
  const hasWarnings = sources.some((source) => source.warning);
  return noStore(json({
    ok: true,
    build: 658,
    read_only: true,
    checked_at: new Date().toISOString(),
    operating_model: "Rosie brings standard detailing water and power; customers provide a safe, permitted work area.",
    status: hasConflicts || hasWarnings ? "owner_review_required" : "service_addon_sources_aligned",
    bundled: { source: "bundled_json", pages: bundled, count: bundled.length },
    managed_sources: sources,
    static_pages: "Standalone service/add-on HTML copy is independently covered by the Build 658 repository regression test.",
    legal_hold: ["/terms", "/waiver"],
    next_action: "Review any flagged service/add-on fields in the landing-page editor. Confirm official local water-use and runoff guidance before editing; this audit cannot save, sync, or publish changes."
  }));
}

export async function onRequestPost() {
  return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405));
}

async function inspectManagedSource(env, headers, key, knownSlugs) {
  const empty = { key, source: "unavailable", updated_at: null, pages: [], warning: null };
  if (!env?.SUPABASE_URL || !headers?.apikey) {
    return { ...empty, warning: "Supabase is not configured; managed service/add-on copy could not be verified." };
  }
  try {
    const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers });
    if (!res.ok) return { ...empty, warning: `Managed ${key} review failed (HTTP ${res.status}).` };
    const rows = await res.json().catch(() => null);
    if (!Array.isArray(rows)) return { ...empty, warning: `Managed ${key} returned an unexpected response.` };
    const row = rows[0];
    if (!row?.value || typeof row.value !== "object") return { ...empty, source: "no_managed_record" };
    const pages = flattenServiceAddonLandingContent(row.value, knownSlugs);
    return {
      ...empty,
      source: "app_management_settings",
      updated_at: row.updated_at || null,
      pages: Object.entries(pages).map(([slug, page]) => ({
        slug,
        title: String(page.name || slug).slice(0, 120),
        findings: auditServiceAddonLandingPage(page, slug, knownSlugs)
      }))
    };
  } catch {
    return { ...empty, warning: `Managed ${key} could not be read.` };
  }
}

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
