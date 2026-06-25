// Build 206 — owner-friendly report for the top value-added additions.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import valueData from "../../../data/value_added_operations_build206.json";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    return withCors(json({ ok: true, ...valueData, metrics: computeMetrics(valueData) }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load value-added operations report." }, 500));
  }
}

function computeMetrics(data) {
  const quotes = Array.isArray(data.quote_pipeline) ? data.quote_pipeline : [];
  const activeQuotes = quotes.filter(q => !["accepted","declined","lost","cancelled"].includes(clean(q.status)));
  const accepted = quotes.filter(q => clean(q.status) === "accepted");
  const totalQuoteValue = sum(quotes, "quote_value");
  const openQuoteValue = sum(activeQuotes, "quote_value");
  const acceptedValue = sum(accepted, "quote_value");
  const quoteCloseRate = quotes.length ? accepted.length / quotes.length * 100 : 0;
  const campaigns = Array.isArray(data.meta_campaigns) ? data.meta_campaigns : [];
  const adSpend = sum(campaigns, "spend");
  const leads = sum(campaigns, "leads");
  const bookedJobs = sum(campaigns, "booked_jobs");
  const revenue = sum(campaigns, "revenue");
  return {
    quote_count: quotes.length,
    active_quote_count: activeQuotes.length,
    total_quote_value: totalQuoteValue,
    open_quote_value: openQuoteValue,
    accepted_quote_value: acceptedValue,
    quote_close_rate: round(quoteCloseRate, 1),
    ad_spend: adSpend,
    ad_leads: leads,
    ad_booked_jobs: bookedJobs,
    ad_revenue: revenue,
    cost_per_lead: leads ? round(adSpend / leads, 2) : 0,
    customer_acquisition_cost: bookedJobs ? round(adSpend / bookedJobs, 2) : 0,
    ad_return_multiple: adSpend ? round(revenue / adSpend, 2) : 0,
    maintenance_plan_count: (data.memberships || []).length,
    fleet_prospect_count: (data.fleet_accounts || []).length,
    seasonal_campaign_count: (data.seasonal_campaigns || []).length,
    route_cluster_count: (data.route_clusters || []).length
  };
}
function sum(rows, key) { return rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0); }
function round(n, p=2) { const m = Math.pow(10, p); return Math.round((Number(n) || 0) * m) / m; }
function clean(v) { return String(v || "").trim().toLowerCase(); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
