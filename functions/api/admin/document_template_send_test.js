// File: /functions/api/admin/document_template_send_test.js
// Build 195: safe test-render control for appointment, invoice, receipt, refund, quote, and proposal templates.
// This endpoint does not send externally by default; it returns the rendered payload and a queue-ready preview.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { loadEditableSetting, normalizeSettingKey } from "../_lib/editable-settings.js";

const TEST_RECIPIENT = "test-recipient@example.com";
const SAMPLE = { customer_name: "Sample Customer", service_date: "2026-06-15", slot_label: "AM half day", package_name: "Complete Detail", estimated_total: "$369.00", balance_due: "$294.00", invoice_url: "https://rosiedazzlers.ca/invoice?token=sample", confirmation_url: "https://rosiedazzlers.ca/order-confirmation?token=sample", quote_url: "https://rosiedazzlers.ca/quote-response?token=sample", refund_amount: "$25.00", business_name: "Rosie Dazzlers Mobile Auto Detailing" };

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const key = normalizeSettingKey(body.key || "document_templates");
  const templateKey = String(body.template_key || "appointment_confirmation").trim();
  const recipient = String(body.recipient_email || TEST_RECIPIENT).trim();
  const source = body.value && typeof body.value === "object" ? body.value : (await loadEditableSetting(env, key)).value || {};
  const template = source.templates?.[templateKey] || {};
  const rendered = { subject: render(template.subject || "Rosie Dazzlers test template", SAMPLE), body: render(template.body || "", SAMPLE) };
  return json({ ok: true, build: "195", mode: "dry_run_no_external_send", template_key: templateKey, recipient_email: recipient, rendered, queue_preview: { event_type: `test_${templateKey}`, channel: "email", recipient_email: recipient, subject: rendered.subject, body_text: rendered.body, payload: { sample: true, generated_at: new Date().toISOString() } } });
}
function render(template, values) { return String(template || "").replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_m, key) => values[String(key).toLowerCase()] ?? ""); }
