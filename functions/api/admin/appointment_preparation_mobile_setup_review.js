// Build 660: authenticated read-only template provenance and customer prep audit.
// Never mutates managed text, consent, delivery queues, site terms or waivers.
import bundledDocumentTemplates from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  APPOINTMENT_PREPARATION_CHECKLIST,
  APPOINTMENT_SMS_PREVIEW,
  SAFE_APPOINTMENT_SETUP_COPY,
  auditAppointmentTemplateFields,
  hasAppointmentUtilityConflict
} from "../_lib/appointment-preparation-660.js";

const KEYS = ["document_templates", "notification_templates", "membership_plan_settings"];

function report(source, value, updatedAt = null, warning = null) {
  return {
    source,
    updated_at: updatedAt,
    findings: auditAppointmentTemplateFields(value, source),
    warning
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return noStore(auth.response);

  const bundled = [report("data/document_templates.json", bundledDocumentTemplates)];
  const previewIssues = [SAFE_APPOINTMENT_SETUP_COPY, APPOINTMENT_SMS_PREVIEW, ...APPOINTMENT_PREPARATION_CHECKLIST]
    .flatMap((text, i) => hasAppointmentUtilityConflict(text) ? [{ field: `preparation[${i}]`, excerpt: text }] : []);
  if (previewIssues.length) bundled.push({ source: "built_in_customer_preparation", updated_at: null, findings: previewIssues, warning: null });
  const managed = await inspectManaged(env);
  const needsReview = [...bundled, ...managed].some((source) => source.findings.length || source.warning);
  return noStore(json({
    ok: true,
    build: 660,
    read_only: true,
    checked_at: new Date().toISOString(),
    status: needsReview ? "owner_review_required" : "appointment_preparation_sources_aligned",
    bundled_sources: bundled,
    managed_sources: managed,
    sample_sms_draft: APPOINTMENT_SMS_PREVIEW,
    sms_state: "copy_preview_only_no_new_sends_or_scheduler",
    customer_checklist: APPOINTMENT_PREPARATION_CHECKLIST,
    outbound_guard: "Existing appointment-related notification dispatch corrects obsolete utility statements after consent checks; no new sends or stored-data rewrites.",
    consent_hold: "Do not override email/SMS opt-in, STOP/HELP handling, or provider enablement.",
    legal_hold: ["/terms", "/waiver"],
    next_action: "Review flagged appointment confirmation or reminder fields in Admin Site Settings. Owner-controlled source edits and any SMS activation remain separate decisions."
  }));
}

export async function onRequestPost() {
  return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405));
}

async function inspectManaged(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return KEYS.map((key) => report(`app_management_settings.${key}`, null, null, "Supabase is not configured; source could not be checked."));
  }
  const headers = serviceHeaders(env);
  return Promise.all(KEYS.map(async (key) => {
    const source = `app_management_settings.${key}`;
    try {
      const query = new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" });
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?${query}`, { headers });
      if (!response.ok) return report(source, null, null, `Managed review failed (HTTP ${response.status}).`);
      const records = await response.json().catch(() => null);
      if (!Array.isArray(records)) return report(source, null, null, "Managed source returned unexpected data.");
      const record = records[0];
      return report(source, record?.value, record?.updated_at || null);
    } catch {
      return report(source, null, null, "Managed source could not be read.");
    }
  }));
}

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
