import documents from "../../../data/document_templates.json";
import policies from "../../../data/site_policies.json";
import faqs from "../../../data/site_faqs.json";
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import {
  GIFT_DELIVERY_PREVIEW, DELIVERY_RUNTIME_FINDINGS, DELIVERY_STATUS_GUIDANCE,
  auditDeliveryFields, deliveryGuidanceGaps, deliveryReadable, deliveryCopyRisks
} from "../_lib/gift-delivery-copy-671.js";

const SETTINGS = ["gift_delivery_settings", "notification_templates", "site_policies", "document_templates"];
const PUBLIC = ["/gifts", "/gift-cards"];
const report = (source, value, updated_at = null, warning = null) => ({ source, updated_at, warning, findings: auditDeliveryFields(value, source) });

function noStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!access.ok) return noStore(access.response);

  const bundled_sources = [
    report("data/site_policies.json", policies), report("data/document_templates.json", documents), report("data/site_faqs.json", faqs)
  ];
  const public_sources = [];
  // Same-origin public pages only: no gift lookup, customer email, notification event or receipt is queried.
  for (const path of PUBLIC) {
    try {
      const res = await fetch(new URL(path, request.url), { method: "GET", redirect: "error", headers: { Accept: "text/html" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.text()).slice(0, 170000);
      public_sources.push({
        ...report(path, { visible_customer_copy: deliveryReadable(raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || raw) }),
        guidance_gaps: deliveryGuidanceGaps(path, raw)
      });
    } catch {
      public_sources.push({ ...report(path, null, null, "Public gift-delivery source unavailable; owner should review manually."), guidance_gaps: [] });
    }
  }

  const managed_sources = [];
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    managed_sources.push(report("public_faq_entries", null, null, "Managed FAQ source unavailable: Supabase is not configured."));
    for (const key of SETTINGS) managed_sources.push(report(`app_management_settings.${key}`, null, null, "Managed setting unavailable: Supabase is not configured."));
  } else {
    const headers = serviceHeaders(env);
    const read = async (path, source) => {
      try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { method: "GET", headers });
        if (!res.ok) return report(source, null, null, `Source unavailable (HTTP ${res.status}).`);
        const rows = await res.json();
        if (!Array.isArray(rows)) return report(source, null, null, "Unexpected managed source response.");
        return source === "public_faq_entries" ? report(source, rows) : report(source, rows[0]?.value, rows[0]?.updated_at || null);
      } catch { return report(source, null, null, "Managed source could not be read."); }
    };
    managed_sources.push(await read(`public_faq_entries?${new URLSearchParams({ select: "category,question,answer,updated_at", is_active: "eq.true", limit: "100" })}`, "public_faq_entries"));
    managed_sources.push(...await Promise.all(SETTINGS.map((key) => read(`app_management_settings?${new URLSearchParams({ select: "key,value,updated_at", key: `eq.${key}`, limit: "1" })}`, `app_management_settings.${key}`))));
  }

  if (deliveryCopyRisks(GIFT_DELIVERY_PREVIEW).length) bundled_sources.push(report("built_in_delivery_preview", { gift_delivery: GIFT_DELIVERY_PREVIEW }));
  const needsReview = DELIVERY_RUNTIME_FINDINGS.length > 0 || [...bundled_sources, ...public_sources, ...managed_sources]
    .some((source) => source.warning || source.findings.length || source.guidance_gaps?.length);
  return noStore(json({
    ok: true, build: 671, read_only: true, checked_at: new Date().toISOString(),
    status: needsReview ? "owner_gift_delivery_review_required" : "gift_delivery_copy_aligned",
    bundled_sources, public_sources, managed_sources,
    runtime_findings: DELIVERY_RUNTIME_FINDINGS, status_guidance: DELIVERY_STATUS_GUIDANCE,
    review_preview: GIFT_DELIVERY_PREVIEW,
    evidence_scope: "Runtime findings are build-time source observations and illustrative states, not live provider delivery confirmations or customer-specific audits.",
    privacy_hold: "Only public templates and bounded non-customer managed settings were reviewed. No gift code, purchaser/recipient address, notification payload, provider token, actual gift status or purchase reference was fetched or returned.",
    dispatch_hold: "No email/SMS is sent, retried or resent. No notification event, gift purchase context, checkout, gift balance, refund or booking is changed by this audit.",
    owner_action: "Confirm delivery/failed/retry wording, review recipient and purchaser-copy event evidence separately, correct misleading 'delivered' claims, and decide on a safe authorized resend/reconciliation workflow before enabling owner resend guidance."
  }));
}

export async function onRequestPost() { return noStore(json({ ok: false, error: "Read-only review; POST is not allowed." }, 405)); }
