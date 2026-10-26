import bundled from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { AFTERCARE_PREVIEW, REVIEW_PREVIEW, auditPostServiceFields, postServiceRisks } from "../_lib/post-service-copy-662.js";

const KEYS = ["document_templates", "notification_templates", "aftercare_templates", "review_request_templates", "post_service_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditPostServiceFields(value, source) });
const noStore = (response) => { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); };

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/document_templates.json", bundled)];
  const previewFindings = [AFTERCARE_PREVIEW, REVIEW_PREVIEW].flatMap((value, index) => postServiceRisks(value).map((code) => ({ field: `preview[${index}]`, code })));
  if (previewFindings.length) bundled_sources.push({ source: "built_in_post_service_preview", findings: previewFindings });
  const managed_sources = await Promise.all(KEYS.map(async (key) => {
    const source = `app_management_settings.${key}`;
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return report(source, null, null, "Managed source unavailable: Supabase not configured.");
    try {
      const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers: serviceHeaders(env) });
      if (!res.ok) return report(source, null, null, `Managed source unavailable (HTTP ${res.status}).`);
      const rows = await res.json();
      if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed response.");
      return report(source, rows[0]?.value, rows[0]?.updated_at || null);
    } catch { return report(source, null, null, "Managed source could not be read."); }
  }));
  const reviewNeeded = [...bundled_sources, ...managed_sources].some((entry) => entry.warning || entry.findings.length);
  return noStore(json({ ok: true, build: 662, read_only: true, checked_at: new Date().toISOString(), status: reviewNeeded ? "owner_review_required" : "post_service_copy_sources_aligned", bundled_sources, managed_sources, aftercare_preview: AFTERCARE_PREVIEW, review_preview: REVIEW_PREVIEW, consent_hold: "No new outreach, SMS, scheduling, delivery or opt-out changes. Review requests still require completion evidence, eligibility and consent checks.", owner_action: "Review findings through authorized template editors. No source or queue is modified." }));
}
export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
