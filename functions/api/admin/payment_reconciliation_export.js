// Build 183 — payment reconciliation export for quote deposits, refunds, and webhook audit rows.
import { requireStaffAccess, serviceHeaders, cleanText } from "../_lib/staff-auth.js";

const PAYMENT_SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "booking_id", "confirmed_booking_id", "provider", "status", "payment_status", "provider_status",
  "amount_cents", "paid_amount_cents", "refunded_amount_cents", "refund_status", "currency", "customer_name", "customer_email",
  "payment_reference", "external_checkout_id", "provider_event_id", "provider_payment_intent_id", "provider_order_id", "provider_capture_id",
  "requested_at", "paid_at", "latest_refund_at", "booking_confirmed_at", "created_at", "updated_at"
].join(",");
const REFUND_SELECT = ["id", "quote_deposit_payment_request_id", "provider", "provider_refund_id", "provider_event_id", "refund_status", "refund_amount_cents", "currency", "reason", "refunded_at", "created_at"].join(",");
const EVENT_SELECT = ["id", "provider", "provider_event_id", "provider_event_type", "quote_deposit_payment_request_id", "payment_reference", "status", "replay_status", "last_error", "created_at", "updated_at"].join(",");

export async function onRequestGet({ request, env }) { return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) }); }
export async function onRequestPost({ request, env }) { const body = await request.json().catch(() => ({})); return handle({ request, env, body }); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return csvResponse("record_type,id,status,amount_cents,note\nwarning,,missing_supabase,,Supabase environment variables are not configured\n", "payment-reconciliation-missing-supabase.csv");
    const limit = Math.max(50, Math.min(2000, Number(body.limit || 1000) || 1000));
    const [payments, refunds, events] = await Promise.all([
      fetchTable(env, "quote_deposit_payment_requests", PAYMENT_SELECT, limit),
      fetchTable(env, "quote_deposit_refund_records", REFUND_SELECT, limit),
      fetchTable(env, "quote_payment_webhook_events", EVENT_SELECT, limit)
    ]);
    const rows = [];
    for (const r of payments.rows) rows.push(paymentRow(r));
    for (const r of refunds.rows) rows.push(refundRow(r));
    for (const r of events.rows) rows.push(eventRow(r));
    if (payments.warning) rows.push(warningRow("payment_requests", payments.warning));
    if (refunds.warning) rows.push(warningRow("refund_records", refunds.warning));
    if (events.warning) rows.push(warningRow("webhook_events", events.warning));
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(csv, `rosie-dazzlers-payment-reconciliation-${stamp}.csv`);
  } catch (err) {
    return csvResponse(toCsv([warningRow("export_error", err?.message || "Could not build payment reconciliation export.")]), "payment-reconciliation-error.csv", 500);
  }
}

async function fetchTable(env, table, select, limit) {
  const params = new URLSearchParams();
  params.set("select", select);
  params.set("order", "updated_at.desc");
  params.set("limit", String(limit));
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) return { rows: [], warning: data?.message || text || `Could not load ${table}.` };
  return { rows: Array.isArray(data) ? data : [] };
}

function paymentRow(r) { return {
  record_type: "payment_request", id: r.id, parent_id: r.quote_proposal_draft_id || r.lead_id || "", booking_id: r.confirmed_booking_id || r.booking_id || "", provider: r.provider || "", status: r.payment_status || r.status || "", provider_status: r.provider_status || "", amount_cents: r.amount_cents || 0, paid_amount_cents: r.paid_amount_cents || 0, refund_amount_cents: r.refunded_amount_cents || 0, refund_status: r.refund_status || "", currency: r.currency || "CAD", customer_name: r.customer_name || "", customer_email: r.customer_email || "", provider_reference: r.provider_capture_id || r.provider_payment_intent_id || r.payment_reference || r.external_checkout_id || "", provider_event_id: r.provider_event_id || "", created_at: r.created_at || "", updated_at: r.updated_at || "", note: r.booking_confirmed_at ? "booking_confirmed" : ""
}; }
function refundRow(r) { return { record_type: "refund", id: r.id, parent_id: r.quote_deposit_payment_request_id || "", booking_id: "", provider: r.provider || "", status: r.refund_status || "", provider_status: "", amount_cents: 0, paid_amount_cents: 0, refund_amount_cents: r.refund_amount_cents || 0, refund_status: r.refund_status || "", currency: r.currency || "CAD", customer_name: "", customer_email: "", provider_reference: r.provider_refund_id || "", provider_event_id: r.provider_event_id || "", created_at: r.created_at || r.refunded_at || "", updated_at: r.refunded_at || r.created_at || "", note: r.reason || "" }; }
function eventRow(r) { return { record_type: "webhook_event", id: r.id, parent_id: r.quote_deposit_payment_request_id || "", booking_id: "", provider: r.provider || "", status: r.status || "", provider_status: r.replay_status || "", amount_cents: 0, paid_amount_cents: 0, refund_amount_cents: 0, refund_status: "", currency: "", customer_name: "", customer_email: "", provider_reference: r.payment_reference || "", provider_event_id: r.provider_event_id || "", created_at: r.created_at || "", updated_at: r.updated_at || "", note: r.last_error || r.provider_event_type || "" }; }
function warningRow(source, warning) { return { record_type: "warning", id: source, parent_id: "", booking_id: "", provider: "", status: "warning", provider_status: "", amount_cents: 0, paid_amount_cents: 0, refund_amount_cents: 0, refund_status: "", currency: "", customer_name: "", customer_email: "", provider_reference: "", provider_event_id: "", created_at: new Date().toISOString(), updated_at: "", note: warning }; }
function toCsv(rows) { const headers = ["record_type", "id", "parent_id", "booking_id", "provider", "status", "provider_status", "amount_cents", "paid_amount_cents", "refund_amount_cents", "refund_status", "currency", "customer_name", "customer_email", "provider_reference", "provider_event_id", "created_at", "updated_at", "note"]; return [headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\n") + "\n"; }
function csvCell(value) { const text = String(value ?? ""); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function csvResponse(csv, filename, status = 200) { return new Response(csv, { status, headers: { ...corsHeaders(), "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } }); }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
