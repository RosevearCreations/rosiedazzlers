import bundled from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { REBOOKING_PREVIEW, SEASONAL_PREVIEW, rebookingCopyRisks, auditRebookingSeasonalFields } from "../_lib/rebooking-seasonal-copy-663.js";
const KEYS = ["document_templates", "notification_templates", "membership_plan_settings", "rebooking_templates", "maintenance_reminder_templates", "seasonal_reminder_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditRebookingSeasonalFields(value, source) });
const noStore = (response) => { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); };
export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/document_templates.json", bundled)];
  const preview = [REBOOKING_PREVIEW, SEASONAL_PREVIEW].flatMap((text, index) => rebookingCopyRisks(text).map((code) => ({ field: `preview[${index}]`, code })));
  if (preview.length) bundled_sources.push({ source: "built_in_rebooking_preview", findings: preview });
  const managed_sources = await Promise.all(KEYS.map(async (key) => {
    const source = `app_management_settings.${key}`;
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return report(source, null, null, "Managed source unavailable: Supabase not configured.");
    try {
      const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers: serviceHeaders(env) });
      if (!response.ok) return report(source, null, null, `Managed source unavailable (HTTP ${response.status}).`);
      const rows = await response.json();
      if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed response.");
      return report(source, rows[0]?.value, rows[0]?.updated_at || null);
    } catch { return report(source, null, null, "Managed source could not be read."); }
  }));
  return noStore(json({ ok: true, build: 663, read_only: true, checked_at: new Date().toISOString(), status: [...bundled_sources, ...managed_sources].some((entry) => entry.warning || entry.findings.length) ? "owner_review_required" : "rebooking_seasonal_copy_sources_aligned", bundled_sources, managed_sources, rebooking_preview: REBOOKING_PREVIEW, seasonal_preview: SEASONAL_PREVIEW, consent_hold: "No new recurring messages, contact campaigns, appointment holds, schedules or provider sends. Existing consent, opt-outs and STOP/HELP are unchanged.", owner_action: "Review flagged sources in authorized editors and verify seasonal capability before any public promise." }));
}
export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
