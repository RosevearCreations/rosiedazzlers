import faqSeed from "../../../data/site_faqs.json";
import documentSeed from "../../../data/document_templates.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { COMPLETION_CARE_PREVIEW, completionCopyRisks, auditCompletionFaq } from "../_lib/service-completion-faq-664.js";
const KEYS = ["document_templates", "notification_templates", "faq_templates", "aftercare_templates", "completion_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditCompletionFaq(value, source) });
const noStore = (response) => { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); };
export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/site_faqs.json", faqSeed), report("data/document_templates.json", documentSeed)];
  const preview = completionCopyRisks(COMPLETION_CARE_PREVIEW);
  if (preview.length) bundled_sources.push({ source: "built_in_completion_preview", findings: preview.map((code) => ({ field: "preview", code })) });
  const managed_sources = [];
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed public FAQ unavailable: Supabase not configured."));
    for (const key of KEYS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed source unavailable: Supabase not configured."));
  } else {
    const headers = serviceHeaders(env);
    const read = async (path, source) => {
      try {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers });
        if (!response.ok) return report(source, null, null, `Source unavailable (HTTP ${response.status}).`);
        const rows = await response.json();
        if (!Array.isArray(rows)) return report(source, null, null, "Unexpected source response.");
        if (source === "public_faq_entries") return report(source, rows);
        return report(source, rows[0]?.value, rows[0]?.updated_at || null);
      } catch { return report(source, null, null, "Source could not be read."); }
    };
    const faqQuery = new URLSearchParams({ select: "question,answer,updated_at", is_active: "eq.true", limit: "100" });
    managed_sources.push(await read(`public_faq_entries?${faqQuery}`, "public_faq_entries"));
    managed_sources.push(...await Promise.all(KEYS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }
  const ownerReview = [...bundled_sources, ...managed_sources].some((row) => row.warning || row.findings.length);
  return noStore(json({ ok: true, build: 664, read_only: true, checked_at: new Date().toISOString(), status: ownerReview ? "owner_review_required" : "completion_faq_copy_sources_aligned", bundled_sources, managed_sources, completion_care_preview: COMPLETION_CARE_PREVIEW, owner_action: "Inspect flagged FAQ and completion/aftercare text in authorized editors. No templates are automatically rewritten.", legal_hold: "No changes to Terms, Waiver, balances, completion evidence, review consent, SMS opt-outs, notification queues or providers." }));
}
export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
