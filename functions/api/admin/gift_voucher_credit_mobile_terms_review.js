import documents from "../../../data/document_templates.json";
import policies from "../../../data/site_policies.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { GIFT_CREDIT_PREVIEW, auditGiftCreditFields, giftCreditCopyRisks, giftReadable, reviewGiftTypeExpiryScope } from "../_lib/gift-credit-copy-668.js";

const KEYS = ["gift_delivery_settings", "site_policies", "document_templates", "notification_templates"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditGiftCreditFields(value, source) });
function noStore(response) { const headers = new Headers(response.headers); headers.set("Cache-Control", "no-store"); return new Response(response.body, { status: response.status, headers }); }

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [
    report("data/site_policies.json", policies),
    report("data/document_templates.json", documents),
    report("data/site_faqs.json", faqs)
  ];
  const public_sources = [];
  const publicText = {};
  // Staff-triggered same-origin, public page reads only; return findings, never raw HTML.
  for (const path of ["/gifts", "/gift-cards", "/terms"]) {
    try {
      const response = await fetch(new URL(path, request.url), { method: "GET", redirect: "error", headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = (await response.text()).slice(0, 140000);
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
      publicText[path] = giftReadable(main);
      public_sources.push(report(path, { gift_page: publicText[path] }));
    } catch { public_sources.push(report(path, null, null, `Public ${path} copy could not be read; owner must verify it manually.`)); }
  }
  const policy_alignment = [];
  if (publicText["/gifts"] && publicText["/terms"]) {
    const mismatch = reviewGiftTypeExpiryScope(publicText["/gifts"], publicText["/terms"]);
    if (mismatch) policy_alignment.push(mismatch);
  }
  const managed_sources = [];
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
    managed_sources.push(await read(`public_faq_entries?${new URLSearchParams({ select: "category,question,answer,updated_at", is_active: "eq.true", limit: "100" })}`, "public_faq_entries"));
    managed_sources.push(...await Promise.all(KEYS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }
  const previewRisks = giftCreditCopyRisks(GIFT_CREDIT_PREVIEW);
  if (previewRisks.length) bundled_sources.push({ source: "built_in_preview", findings: previewRisks.map((code) => ({ field: "preview", code })) });
  const needsReview = policy_alignment.length > 0 || [...bundled_sources, ...public_sources, ...managed_sources].some((item) => item.warning || item.findings.length);
  return noStore(json({ ok: true, build: 668, read_only: true, checked_at: new Date().toISOString(), status: needsReview ? "owner_gift_terms_review_required" : "gift_credit_copy_sources_aligned", bundled_sources, public_sources, managed_sources, policy_alignment, review_preview: GIFT_CREDIT_PREVIEW, policy_hold: "Gift eligibility, statutory rights, approved terms and the distinction between dollar-value and specified-service gifts require owner/legal interpretation. Copy flags are advisory, not legal conclusions.", financial_hold: "No gift issuance, activation, redemption, expiry, balance, voucher, store credit, payment, refund, delivery schedule, consent or customer message is created, changed or approved.", owner_action: "Review gift-type validity and refund terms with a qualified adviser, then reconcile approved public and managed wording using established controls." }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
