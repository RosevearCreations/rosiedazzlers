import documents from "../../../data/document_templates.json";
import policies from "../../../data/site_policies.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { GIFT_RECEIPT_PREVIEW, auditReceiptFields, receiptGuidanceGaps, receiptDisplayFindings, receiptCopyRisks, receiptReadable } from "../_lib/gift-receipt-copy-670.js";

const SETTINGS = ["gift_delivery_settings", "site_policies", "document_templates", "notification_templates"];
const PUBLIC = ["/gifts", "/gift-cards", "/gift-certificate-print", "/order-confirmation", "/order-confirmation.html"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditReceiptFields(value, source) });
function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);
  const bundled_sources = [report("data/site_policies.json", policies), report("data/document_templates.json", documents), report("data/site_faqs.json", faqs)];
  const public_sources = [];
  const publicRaw = {};
  // Public template HTML only. Never call tokenized receipts, gift lookups, or payment providers.
  for (const path of PUBLIC) {
    try {
      const response = await fetch(new URL(path, request.url), { method: "GET", redirect: "error", headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = (await response.text()).slice(0, 170000);
      publicRaw[path] = raw;
      const visible = receiptReadable(raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || raw);
      public_sources.push({ ...report(path, { visible_customer_copy: visible }), guidance_gaps: receiptGuidanceGaps(path, raw) });
    } catch { public_sources.push({ ...report(path, null, null, "Public receipt/certificate source unavailable; owner must inspect it manually."), guidance_gaps: [] }); }
  }

  const managed_sources = [];
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed FAQ source unavailable: Supabase is not configured."));
    for (const key of SETTINGS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed setting unavailable: Supabase is not configured."));
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
    managed_sources.push(...await Promise.all(SETTINGS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }

  const display_findings = receiptDisplayFindings({ printSource: publicRaw["/gift-certificate-print"], orderSource: publicRaw["/order-confirmation"] });
  if (publicRaw["/order-confirmation"] && publicRaw["/order-confirmation.html"] && publicRaw["/order-confirmation"] !== publicRaw["/order-confirmation.html"])
    display_findings.push({ code: "order_document_route_copy_drift", note: "The /order-confirmation and /order-confirmation.html template variants differ; check their mobile preparation and payment labels before relying on either as definitive." });
  if (receiptCopyRisks(GIFT_RECEIPT_PREVIEW).length)
    bundled_sources.push(report("built_in_receipt_preview", { gift_receipt_preview: GIFT_RECEIPT_PREVIEW }));
  const needsReview = display_findings.length > 0 || [...bundled_sources, ...public_sources, ...managed_sources].some((item) => item.warning || item.findings.length || item.guidance_gaps?.length);
  return noStore(json({
    ok: true, build: 670, read_only: true, checked_at: new Date().toISOString(),
    status: needsReview ? "owner_gift_receipt_confirmation_review_required" : "gift_receipt_confirmation_copy_aligned",
    bundled_sources, public_sources, managed_sources, display_findings,
    review_preview: GIFT_RECEIPT_PREVIEW,
    privacy_hold: "Only published templates and bounded non-customer settings were reviewed. No actual checkout session, gift code, recipient email, certificate document, customer token or payment receipt is fetched or returned.",
    financial_hold: "No gift balance, issuance, redemption, Stripe/PayPal settlement, booking confirmation, notification, receipt dispatch, refund or customer record is changed.",
    owner_action: "Approve clear receipt-versus-booking wording, reconcile the two order-confirmation templates and resolve deposit due versus paid labels using verified settlement evidence. Gift expiry/refund policy remains under the earlier owner/legal review."
  }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
