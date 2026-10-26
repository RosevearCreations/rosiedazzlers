import documents from "../../../data/document_templates.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { WARRANTY_REVIEW_PREVIEW, warrantyCopyRisks, auditWarrantyClaimFields } from "../_lib/warranty-claim-copy-666.js";

const KEYS = ["document_templates", "notification_templates", "warranty_templates", "guarantee_templates", "claim_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditWarrantyClaimFields(value, source) });
function noStore(response) { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); }

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/document_templates.json", documents), report("data/site_faqs.json", faqs)];
  const previewRisks = warrantyCopyRisks(WARRANTY_REVIEW_PREVIEW);
  if (previewRisks.length) bundled_sources.push({ source: "built_in_warranty_preview", findings: previewRisks.map((code) => ({ field: "preview", code })) });
  const managed_sources = [];
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed FAQ source unavailable: Supabase not configured."));
    for (const key of KEYS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed source unavailable: Supabase not configured."));
  } else {
    const headers = serviceHeaders(env);
    const read = async (path, source) => {
      try {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers, method: "GET" });
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
  const needsReview = [...bundled_sources, ...managed_sources].some((item) => item.warning || item.findings.length);
  return noStore(json({ ok: true, build: 666, read_only: true, checked_at: new Date().toISOString(), status: needsReview ? "owner_legal_review_required" : "warranty_claim_copy_sources_aligned", bundled_sources, managed_sources, review_preview: WARRANTY_REVIEW_PREVIEW, legal_hold: "Flags are advisory only. Existing Terms, Waiver and applicable consumer rights remain authoritative; no legal position or claim eligibility is decided here.", claim_hold: "No claim, incident, refund, replacement, credit, warranty decision or outbound communication is created or changed.", owner_action: "Review flagged copy with the owner and qualified legal adviser before any authorized template update." }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
