import documents from "../../../data/document_templates.json";
import policies from "../../../data/site_policies.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { GIFT_REDEMPTION_PREVIEW, auditRedemptionFields, redemptionGuidanceGaps, redemptionContractAlignment, redemptionRisks, redemptionReadable } from "../_lib/gift-redemption-copy-669.js";

const SETTINGS = ["gift_delivery_settings", "site_policies", "document_templates", "notification_templates"];
const PUBLIC_PAGES = ["/gifts", "/gift-cards", "/booking-planner", "/my-account", "/gift-certificate-print"];
const PUBLIC_SCRIPTS = ["/assets/my-account-v296.js", "/assets/booking-context-help-v628.js"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditRedemptionFields(value, source) });
function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

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
  // Read public same-origin assets only. Never fetch a gift with a code or open customer financial records.
  for (const path of [...PUBLIC_PAGES, ...PUBLIC_SCRIPTS]) {
    try {
      const response = await fetch(new URL(path, request.url), { method: "GET", redirect: "error", headers: { Accept: path.endsWith(".js") ? "text/javascript" : "text/html" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = (await response.text()).slice(0, 170000);
      const readable = path.endsWith(".js") ? raw : redemptionReadable(raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || raw);
      publicText[path] = readable;
      public_sources.push({ ...report(path, { public_copy: readable }), guidance_gaps: redemptionGuidanceGaps(path, readable) });
    } catch {
      public_sources.push({ ...report(path, null, null, "Public copy source unavailable; owner must review it manually."), guidance_gaps: [] });
    }
  }

  const managed_sources = [];
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed FAQ source unavailable: Supabase is not configured."));
    for (const key of SETTINGS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed setting unavailable: Supabase is not configured."));
  } else {
    const headers = serviceHeaders(env);
    const read = async (query, source) => {
      try {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`, { method: "GET", headers });
        if (!response.ok) return report(source, null, null, `Source unavailable (HTTP ${response.status}).`);
        const rows = await response.json();
        if (!Array.isArray(rows)) return report(source, null, null, "Managed source returned an unexpected result.");
        return source === "public_faq_entries" ? report(source, rows) : report(source, rows[0]?.value, rows[0]?.updated_at || null);
      } catch { return report(source, null, null, "Managed source could not be read."); }
    };
    managed_sources.push(await read(`public_faq_entries?${new URLSearchParams({ select: "category,question,answer,updated_at", is_active: "eq.true", limit: "100" })}`, "public_faq_entries"));
    managed_sources.push(...await Promise.all(SETTINGS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }

  const contract_alignment = redemptionContractAlignment({ gifts: publicText["/gifts"] });
  if (redemptionRisks(GIFT_REDEMPTION_PREVIEW).length) bundled_sources.push({ source: "built_in_preview", findings: auditRedemptionFields({ gift_redemption_preview: GIFT_REDEMPTION_PREVIEW }, "built_in_preview") });
  const needsReview = contract_alignment.length > 0 || [...bundled_sources, ...public_sources, ...managed_sources].some((source) => source.warning || source.findings.length || source.guidance_gaps?.length);
  return noStore(json({
    ok: true, build: 669, read_only: true, checked_at: new Date().toISOString(),
    status: needsReview ? "owner_gift_redemption_guidance_review_required" : "gift_redemption_guidance_aligned",
    bundled_sources, public_sources, managed_sources, contract_alignment,
    review_preview: GIFT_REDEMPTION_PREVIEW,
    balance_hold: "No customer gift code, gift identity, live amount, purchaser information or redemption history is returned. This is a copy review, not a balance inquiry or financial reconciliation.",
    transaction_hold: "No gift issuance, stored value, voucher, redemption, checkout, deposit, booking, payment, refund, expiry, account or customer message is read as a financial record or changed.",
    owner_action: "Confirm the deposit-only checkout limitation and approve consistent redemption and remaining-balance explanations before publishing new customer promises."
  }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
