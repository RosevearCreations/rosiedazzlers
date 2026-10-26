import documents from "../../../data/document_templates.json";
import policies from "../../../data/site_policies.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { CANCELLATION_REFUND_PREVIEW, auditCancellationRefundFields, cancellationRefundCopyRisks, compareDepositPolicy, readable } from "../_lib/cancellation-refund-copy-667.js";

const KEYS = ["site_policies", "document_templates", "notification_templates", "refund_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditCancellationRefundFields(value, source) });
function noStore(response) { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); }

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [
    report("data/site_policies.json", policies),
    report("data/document_templates.json", documents),
    report("data/site_faqs.json", faqs)
  ];
  const managed_sources = [];
  const policy_alignment = [];
  const terms_source = { source: "/terms", warning: null, findings: [] };
  // Owner-triggered request to the same public origin only. Never expose raw policy HTML or account data.
  try {
    const url = new URL("/terms", request.url);
    const response = await fetch(url, { method: "GET", redirect: "error", headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = (await response.text()).slice(0, 120000);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
    const text = readable(main);
    terms_source.findings = auditCancellationRefundFields({ terms: text }, "/terms");
    const difference = compareDepositPolicy(text, policies?.policies?.deposit);
    if (difference) policy_alignment.push(difference);
  } catch {
    terms_source.warning = "Public Terms could not be checked; verify /terms manually before approving copy.";
  }
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed FAQ source unavailable: Supabase not configured."));
    for (const key of KEYS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed source unavailable: Supabase not configured."));
  } else {
    const headers = serviceHeaders(env);
    const read = async (path, source) => {
      try {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { method: "GET", headers });
        if (!response.ok) return report(source, null, null, `Source unavailable (HTTP ${response.status}).`);
        const rows = await response.json();
        if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed source response.");
        return source === "public_faq_entries" ? report(source, rows) : report(source, rows[0]?.value, rows[0]?.updated_at || null);
      } catch { return report(source, null, null, "Managed source could not be read."); }
    };
    const faqQuery = new URLSearchParams({ select: "category,question,answer,updated_at", is_active: "eq.true", limit: "100" });
    managed_sources.push(await read(`public_faq_entries?${faqQuery}`, "public_faq_entries"));
    managed_sources.push(...await Promise.all(KEYS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }
  const previewRisks = cancellationRefundCopyRisks(CANCELLATION_REFUND_PREVIEW);
  if (previewRisks.length) bundled_sources.push({ source: "built_in_preview", findings: previewRisks.map((code) => ({ field: "preview", code })) });
  const needsReview = policy_alignment.length > 0 || [...bundled_sources, ...managed_sources, terms_source].some((item) => item.warning || item.findings.length);
  return noStore(json({ ok: true, build: 667, read_only: true, checked_at: new Date().toISOString(), status: needsReview ? "owner_policy_review_required" : "cancellation_refund_copy_sources_aligned", bundled_sources, managed_sources, terms_source, policy_alignment, review_preview: CANCELLATION_REFUND_PREVIEW, policy_hold: "The authorized booking Terms, Waiver, policy decisions and applicable consumer rights remain authoritative. Flags are prompts for owner/legal review, not legal conclusions.", financial_hold: "No booking, cancellation, availability, payment, refund, credit, fee, waiver, customer contact or consent is changed or approved.", owner_action: "Reconcile contradictory deposit wording and review flagged cancellation, rescheduling and refund messages through the approved policy process before editing any source." }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
