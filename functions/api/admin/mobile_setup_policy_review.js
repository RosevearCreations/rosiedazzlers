// Build 656: owner/staff-only, read-only source review for mobile setup copy.
// The endpoint NEVER repairs records or modifies legal/customer agreements.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { classifyMobileSetupCopy, resolvePublicMobileSetupCopy } from "../_lib/mobile-setup-policy.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return noStore(auth.response);

  const headers = serviceHeaders(env);
  const source = await loadPolicySource(env, headers);
  const managedValue = String(source.value?.policies?.water_power || "").trim();
  const sitePolicy = {
    source: source.source_status,
    updated_at: source.updated_at || null,
    status: classifyMobileSetupCopy(managedValue),
    stored_text: managedValue.slice(0, 550),
    public_display: resolvePublicMobileSetupCopy(managedValue),
    warning: source.warning || null
  };

  const faq = await reviewActiveFaq(env, headers);
  const needsReview = sitePolicy.source !== "app_management_settings"
    || sitePolicy.status !== "aligned"
    || faq.status !== "aligned"
    || !!faq.warning;
  return noStore(json({
    ok: true,
    build: 656,
    read_only: true,
    checked_at: new Date().toISOString(),
    operating_model: "Rosie brings standard detailing water and power; customers provide a safe, permitted work area.",
    status: needsReview ? "owner_review_required" : "public_sources_aligned",
    site_policy: sitePolicy,
    active_faq: faq,
    legal_hold: [
      { path: "/terms", status: "owner_approval_required", note: "Contractual water/power clause was not rewritten." },
      { path: "/waiver", status: "owner_approval_required", note: "Customer water/power acknowledgement was not rewritten." }
    ],
    next_action: "Review site_policies in Editable Site Settings, FAQ entries in Content Center, and legal terms/waiver with owner approval. This diagnostic does not save anything."
  }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }

async function loadPolicySource(env, headers) {
  if (!env?.SUPABASE_URL || !headers?.apikey) {
    return { source_status: "unavailable", value: {}, warning: "Supabase is not configured for policy review." };
  }
  try {
    const params = new URLSearchParams({ select: "key,value,updated_at", key: "eq.site_policies", limit: "1" });
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${params}`, { headers });
    if (!res.ok) return { source_status: "unavailable", value: {}, warning: `Policy database check failed (HTTP ${res.status}).` };
    const rows = await res.json().catch(() => null);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !row.value || typeof row.value !== "object") {
      return { source_status: "no_managed_record", value: {}, warning: "No database-managed site_policies value was found; the bundled fallback may be in use." };
    }
    return { source_status: "app_management_settings", value: row.value, updated_at: row.updated_at || null };
  } catch {
    return { source_status: "unavailable", value: {}, warning: "Managed policy database check could not be completed." };
  }
}

async function reviewActiveFaq(env, headers) {
  if (!env?.SUPABASE_URL || !headers?.apikey) {
    return { source: "unavailable", status: "unavailable", matches: [], warning: "Supabase connection unavailable; FAQ records were not verified." };
  }
  try {
    const query = new URLSearchParams({ select: "question,answer,is_active,updated_at", is_active: "eq.true", limit: "200" });
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_faq_entries?${query}`, { headers });
    if (!res.ok) {
      return { source: "unavailable", status: "unavailable", matches: [], warning: `FAQ records could not be checked (HTTP ${res.status}).` };
    }
    const rows = await res.json().catch(() => null);
    if (!Array.isArray(rows)) {
      return { source: "unavailable", status: "unavailable", matches: [], warning: "FAQ records returned an unexpected response." };
    }
    const relevant = rows.filter((row) => /\b(?:water|power|electricity|hose|driveway|mobile setup)\b/i.test(`${row.question || ""} ${row.answer || ""}`));
    const matches = relevant.slice(0, 30).map((row) => ({
      question: String(row.question || "").slice(0, 240),
      status: classifyMobileSetupCopy(row.answer),
      updated_at: row.updated_at || null
    }));
    const status = !matches.length ? "no_related_rows" : matches.some((row) => row.status === "conflict") ? "conflict" : "aligned";
    return {
      source: "public_faq_entries",
      status,
      matches,
      warning: rows.length === 200 ? "FAQ scan reached 200 active entries; additional rows may require review." : null
    };
  } catch {
    return { source: "unavailable", status: "unavailable", matches: [], warning: "FAQ records could not be read." };
  }
}

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
