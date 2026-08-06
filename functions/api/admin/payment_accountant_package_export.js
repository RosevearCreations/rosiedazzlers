// Build 184 — accountant-ready payment export with HST/GST allocation estimates.
import { requireStaffAccess, serviceHeaders } from "../_lib/staff-auth.js";

const HST_RATE = 0.13;
const PAYMENT_SELECT = ["id","quote_proposal_draft_id","lead_id","booking_id","confirmed_booking_id","provider","payment_status","amount_cents","paid_amount_cents","refunded_amount_cents","refund_status","currency","customer_name","customer_email","payment_reference","provider_payment_intent_id","provider_order_id","provider_capture_id","requested_at","paid_at","latest_refund_at","created_at","updated_at"].join(",");
const REFUND_SELECT = ["id","quote_deposit_payment_request_id","provider","provider_refund_id","refund_status","refund_amount_cents","currency","reason","refunded_at","created_at","updated_at"].join(",");

export async function onRequestGet({ request, env }) { return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) }); }
export async function onRequestPost({ request, env }) { const body = await request.json().catch(() => ({})); return handle({ request, env, body }); }

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return csvResponse(toCsv([warningRow("missing_supabase", "Supabase environment variables are not configured.")]), "payment-accountant-package-missing-supabase.csv");
    const limit = Math.max(50, Math.min(5000, Number(body.limit || 2500) || 2500));
    const [payments, refunds] = await Promise.all([
      fetchTable(env, "quote_deposit_payment_requests", PAYMENT_SELECT, limit),
      fetchTable(env, "quote_deposit_refund_records", REFUND_SELECT, limit)
    ]);
    const rows = [];
    let gross = 0, tax = 0, net = 0, refundGross = 0, refundTax = 0, refundNet = 0;
    for (const p of payments.rows) {
      const amount = cents(p.paid_amount_cents || p.amount_cents || 0);
      const split = splitTax(amount);
      gross += amount; tax += split.tax_cents; net += split.pre_tax_cents;
      rows.push({ section:"deposit_payments", record_type:"payment", id:p.id, date:p.paid_at || p.requested_at || p.created_at || "", provider:p.provider||"", status:p.payment_status||"", customer:p.customer_name||"", email:p.customer_email||"", booking_id:p.confirmed_booking_id || p.booking_id || "", gross_cents:amount, pre_tax_cents:split.pre_tax_cents, hst_cents:split.tax_cents, refund_cents:cents(p.refunded_amount_cents||0), currency:p.currency||"CAD", reference:p.provider_capture_id || p.provider_payment_intent_id || p.provider_order_id || p.payment_reference || "", note:"Quote deposit/payment request" });
    }
    for (const r of refunds.rows) {
      const amount = cents(r.refund_amount_cents || 0);
      const split = splitTax(amount);
      refundGross += amount; refundTax += split.tax_cents; refundNet += split.pre_tax_cents;
      rows.push({ section:"refunds", record_type:"refund", id:r.id, date:r.refunded_at || r.created_at || "", provider:r.provider||"", status:r.refund_status||"", customer:"", email:"", booking_id:"", gross_cents:-amount, pre_tax_cents:-split.pre_tax_cents, hst_cents:-split.tax_cents, refund_cents:amount, currency:r.currency||"CAD", reference:r.provider_refund_id || "", note:r.reason || "Refund/partial refund" });
    }
    rows.unshift(summaryRow("net_collected_after_refunds", gross - refundGross, net - refundNet, tax - refundTax));
    rows.unshift(summaryRow("refunds_total", refundGross, refundNet, refundTax));
    rows.unshift(summaryRow("payments_total", gross, net, tax));
    if (payments.warning) rows.push(warningRow("payment_requests", payments.warning));
    if (refunds.warning) rows.push(warningRow("refund_records", refunds.warning));
    return csvResponse(toCsv(rows), `rosie-dazzlers-accountant-payment-package-${new Date().toISOString().slice(0,10)}.csv`);
  } catch (err) {
    return csvResponse(toCsv([warningRow("export_error", err?.message || "Could not build accountant payment export.")]), "payment-accountant-package-error.csv", 500);
  }
}
async function fetchTable(env, table, select, limit) { const params = new URLSearchParams({ select, order:"updated_at.desc", limit:String(limit) }); const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: serviceHeaders(env) }); const text=await res.text(); const data=safeJson(text); if(!res.ok) return { rows:[], warning:data?.message || text || `Could not load ${table}.`}; return { rows:Array.isArray(data)?data:[]}; }
function splitTax(grossCents){const gross=cents(grossCents); const pre=Math.round(gross/(1+HST_RATE)); return { pre_tax_cents:pre, tax_cents:gross-pre };}
function summaryRow(label,grossCents,preTaxCents,taxCents){return { section:"summary", record_type:label, id:"", date:new Date().toISOString(), provider:"", status:"", customer:"", email:"", booking_id:"", gross_cents:grossCents, pre_tax_cents:preTaxCents, hst_cents:taxCents, refund_cents:"", currency:"CAD", reference:"", note:"HST allocation assumes deposit/payment amounts are tax-included at 13% Ontario HST; accountant should verify treatment."};}
function warningRow(id,note){return { section:"warning", record_type:"warning", id, date:new Date().toISOString(), provider:"", status:"warning", customer:"", email:"", booking_id:"", gross_cents:"", pre_tax_cents:"", hst_cents:"", refund_cents:"", currency:"", reference:"", note};}
function toCsv(rows){const h=["section","record_type","id","date","provider","status","customer","email","booking_id","gross_cents","pre_tax_cents","hst_cents","refund_cents","currency","reference","note"]; return [h.join(","), ...rows.map(r=>h.map(k=>csv(r[k])).join(","))].join("\n")+"\n";}
function csv(v){const s=String(v??""); return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
function cents(v){const n=Number(v); return Number.isFinite(n)?Math.round(n):0;}
function hasSupabaseConfig(env){return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));}
function safeJson(text){try{return JSON.parse(text);}catch{return null;}}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"};}
function csvResponse(csv,filename,status=200){return new Response(csv,{status,headers:{...corsHeaders(),"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${filename}"`}});}
function withCors(response){const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
