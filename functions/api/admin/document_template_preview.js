// File: /functions/api/admin/document_template_preview.js
// Build 195: render editable document templates against safe sample booking/customer data.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { loadEditableSetting, normalizeSettingKey } from "../_lib/editable-settings.js";

const SAMPLE = {
  customer_name: "Sample Customer",
  customer_email: "customer@example.com",
  service_date: "2026-06-15",
  slot_label: "AM half day",
  package_name: "Complete Detail",
  vehicle_label: "2020 Ford Escape",
  service_area: "Tillsonburg · Oxford County",
  deposit_amount: "$75.00",
  estimated_total: "$369.00",
  balance_due: "$294.00",
  invoice_url: "https://rosiedazzlers.ca/invoice?token=sample",
  confirmation_url: "https://rosiedazzlers.ca/order-confirmation?token=sample",
  quote_url: "https://rosiedazzlers.ca/quote-response?token=sample",
  refund_amount: "$25.00",
  business_name: "Rosie Dazzlers Mobile Auto Detailing"
};

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const key = normalizeSettingKey(body.key || "document_templates");
  const selectedTemplate = String(body.template_key || body.template || "").trim();
  const source = body.value && typeof body.value === "object" ? body.value : (await loadEditableSetting(env, key)).value || {};
  const templates = source.templates && typeof source.templates === "object" ? source.templates : {};
  const rendered = {};
  for (const [templateKey, template] of Object.entries(templates)) {
    if (selectedTemplate && selectedTemplate !== templateKey) continue;
    rendered[templateKey] = {
      subject: render(template?.subject || "", SAMPLE),
      body: render(template?.body || "", SAMPLE),
      tokens_used: findTokens(`${template?.subject || ""}\n${template?.body || ""}`),
      unknown_tokens: findTokens(`${template?.subject || ""}\n${template?.body || ""}`).filter((token) => !(token in SAMPLE))
    };
  }
  return json({ ok: true, build: "195", key, sample_variables: SAMPLE, rendered });
}
export async function onRequestGet({ request, env }) { return onRequestPost({ request: new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({}) }), env }); }
function render(template, values) { return String(template || "").replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_m, key) => values[String(key).toLowerCase()] ?? ""); }
function findTokens(text) { return Array.from(new Set((String(text || "").match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || []).map((token) => token.replace(/[{}\s]/g, "").toLowerCase()))).sort(); }
