// Build 661: staff-only, GET-only quote/deposit template provenance review.
// No customer rows, payment requests, consent records or queue mutations.
import bundledDocumentTemplates from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  QUOTE_NEXT_STEPS_COPY,
  DEPOSIT_NEXT_STEPS_COPY,
  QUOTE_FOLLOW_UP_SMS_DRAFT,
  auditQuoteDepositTemplateFields,
  quoteCopyRiskCodes
} from "../_lib/quote-deposit-mobile-copy-661.js";

const KEYS = ["document_templates", "notification_templates", "quote_templates", "proposal_templates", "receipt_templates"];

function report(source, value, updatedAt = null, warning = null) {
  return { source, updated_at: updatedAt, findings: auditQuoteDepositTemplateFields(value, source), warning };
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);

  const bundled = [report("data/document_templates.json", bundledDocumentTemplates)];
  const controlledPreview = [QUOTE_NEXT_STEPS_COPY, DEPOSIT_NEXT_STEPS_COPY, QUOTE_FOLLOW_UP_SMS_DRAFT]
    .flatMap((copy, index) => quoteCopyRiskCodes(copy).map((code) => ({ field: `preview[${index}]`, code })));
  if (controlledPreview.length) bundled.push({ source: "built_in_quote_copy", updated_at: null, findings: controlledPreview, warning: null });

  const managed = await inspectManaged(env);
  const reviewNeeded = [...bundled, ...managed].some((item) => item.findings.length || item.warning);
  return noStore(json({
    ok: true,
    build: 661,
    read_only: true,
    checked_at: new Date().toISOString(),
    status: reviewNeeded ? "owner_review_required" : "quote_deposit_copy_sources_aligned",
    bundled_sources: bundled,
    managed_sources: managed,
    quote_next_steps: QUOTE_NEXT_STEPS_COPY,
    deposit_next_steps: DEPOSIT_NEXT_STEPS_COPY,
    sms_follow_up_draft: QUOTE_FOLLOW_UP_SMS_DRAFT,
    sms_state: "draft_preview_only_no_new_sends_or_scheduling",
    consent_hold: "Customer channel consent, unsubscribes/STOP/HELP, provider enablement and manual staff delivery authority remain unchanged.",
    payment_hold: "Quote approval, deposits, receipts, verified settlement and appointment confirmation remain separate lifecycle events.",
    owner_action: "Review flagged quote, proposal, receipt and notification templates in the authorized settings editor. No managed copy or outbound queue is automatically rewritten."
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
      const rows = await response.json().catch(() => null);
      if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed source response.");
      return report(source, rows[0]?.value, rows[0]?.updated_at || null);
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
