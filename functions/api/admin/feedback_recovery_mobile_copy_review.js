import bundled from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { FEEDBACK_RESPONSE_PREVIEW, SERVICE_RECOVERY_PREVIEW, feedbackRecoveryRisks, auditFeedbackRecoveryFields } from "../_lib/feedback-recovery-copy-665.js";
const KEYS = ["document_templates", "notification_templates", "feedback_templates", "service_recovery_templates", "customer_support_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditFeedbackRecoveryFields(value, source) });
function noStore(response) { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); }
export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/document_templates.json", bundled)];
  const canonical = [FEEDBACK_RESPONSE_PREVIEW, SERVICE_RECOVERY_PREVIEW].flatMap((value, i) => feedbackRecoveryRisks(value).map((code) => ({ field: `preview[${i}]`, code })));
  if (canonical.length) bundled_sources.push({ source: "built_in_feedback_preview", findings: canonical });
  const managed_sources = await Promise.all(KEYS.map(async (key) => {
    const source = `app_management_settings.${key}`;
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return report(source, null, null, "Managed source unavailable: Supabase not configured.");
    try {
      const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers: serviceHeaders(env) });
      if (!response.ok) return report(source, null, null, `Source unavailable (HTTP ${response.status}).`);
      const rows = await response.json();
      if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed response.");
      return report(source, rows[0]?.value, rows[0]?.updated_at || null);
    } catch { return report(source, null, null, "Managed source could not be read."); }
  }));
  const reviewRequired = [...bundled_sources, ...managed_sources].some((source) => source.warning || source.findings.length);
  return noStore(json({ ok: true, build: 665, read_only: true, checked_at: new Date().toISOString(), status: reviewRequired ? "owner_review_required" : "feedback_recovery_copy_sources_aligned", bundled_sources, managed_sources, feedback_preview: FEEDBACK_RESPONSE_PREVIEW, recovery_preview: SERVICE_RECOVERY_PREVIEW, consent_hold: "No new customer outreach, recurring messages, SMS, reviews or contact permissions. Existing consent and STOP/HELP remain authoritative.", resolution_hold: "Incident assessment, refunds, credits, return visits and public review handling require their existing separate approval workflows.", owner_action: "Review flagged message templates through authorized settings. No source or outbound queue is modified." }));
}
export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
