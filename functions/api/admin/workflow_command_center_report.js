// Build 208 — connected workflow command-center report.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import workflowData from "../../../data/workflow_connection_build208.json";
import valueData from "../../../data/value_added_operations_build206.json";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const db = await loadDbSnapshots(env);
    const quoteRows = db.quote_pipeline_items?.length ? normalizeDbQuotes(db.quote_pipeline_items) : normalizeFallbackQuotes(valueData.quote_pipeline || []);
    const metaRows = db.meta_ads_roi_reports?.length ? normalizeDbMeta(db.meta_ads_roi_reports) : normalizeFallbackMeta(valueData.meta_campaigns || []);
    const reviewRows = db.review_request_queue?.length ? db.review_request_queue : (valueData.review_requests || []);
    const routeRows = db.route_cluster_hints?.length ? db.route_cluster_hints : (valueData.route_clusters || []);
    const membershipRows = db.customer_maintenance_plans?.length ? db.customer_maintenance_plans : (valueData.memberships || []);
    const proofRows = db.proof_of_work_checklists?.length ? db.proof_of_work_checklists : (valueData.proof_of_work_checklists || []);
    const fleetRows = db.fleet_accounts?.length ? db.fleet_accounts : (valueData.fleet_accounts || []);
    const campaignRows = db.seasonal_campaigns?.length ? db.seasonal_campaigns : (valueData.seasonal_campaigns || []);

    const metrics = computeMetrics({ quoteRows, metaRows, reviewRows, routeRows, membershipRows, proofRows, fleetRows, campaignRows });
    const stage_status = workflowData.workflow_stages.map((stage) => stageStatus(stage, { metrics, quoteRows, metaRows, reviewRows, routeRows, membershipRows, proofRows, fleetRows, campaignRows }));
    const attention_items = buildAttentionItems({ quoteRows, metrics, db, reviewRows, routeRows, membershipRows, proofRows, fleetRows, campaignRows });

    return withCors(json({
      ok: true,
      build: workflowData.build,
      updated_at: workflowData.updated_at,
      summary: workflowData.summary,
      north_star: workflowData.north_star,
      workflow_stages: stage_status,
      owner_today_groups: workflowData.owner_today_groups,
      competitor_feature_alignment: workflowData.competitor_feature_alignment,
      visual_enrichment_slots: workflowData.visual_enrichment_slots,
      next_20_steps: workflowData.next_20_steps,
      metrics,
      attention_items,
      data_sources: db.sources,
      fallback_active: db.fallback_active,
      recommendation: "Use /admin-workflow.html as the owner map, then drill into Quotes, Booking, Gallery, Payments, Detailer Jobs, and Growth screens for edits."
    }));
  } catch (err) {
    return withCors(json({ ok:false, error: err?.message || "Could not load workflow command-center report." }, 500));
  }
}

async function loadDbSnapshots(env) {
  const sources = {};
  const fallback = { fallback_active: false, sources };
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...fallback, fallback_active: true, warning: "Supabase env not configured." };
  }
  const headers = serviceHeaders(env);
  const tables = {
    quote_pipeline_items: "select=id,quote_number,customer_name,town,service_label,status,source_channel,quoted_amount_cents,accepted_amount_cents,probability,follow_up_stage,next_follow_up_at,created_at,accepted_at&order=created_at.desc&limit=80",
    meta_ads_roi_reports: "select=id,campaign_name,campaign_start,campaign_end,spend_cents,leads_count,booked_jobs_count,revenue_cents,notes,updated_at&order=updated_at.desc&limit=40",
    review_request_queue: "select=id,status,channel,send_after,sent_at,reusable_as_public_proof,created_at&order=created_at.desc&limit=60",
    route_cluster_hints: "select=id,town,preferred_day,reason,status,updated_at&order=updated_at.desc&limit=60",
    customer_maintenance_plans: "select=id,plan_name,cycle_weeks,status,credit_balance_cents,next_reminder_at,created_at&order=created_at.desc&limit=60",
    proof_of_work_checklists: "select=id,checklist_name,status,required_steps,completed_steps,start_photo_urls,finish_photo_urls,customer_signed_at,created_at&order=created_at.desc&limit=60",
    fleet_accounts: "select=id,company_name,town,vehicle_count,service_interval,contract_status,updated_at&order=updated_at.desc&limit=60",
    seasonal_campaigns: "select=id,campaign_name,season,town_focus,service_focus,status,starts_at,ends_at,updated_at&order=updated_at.desc&limit=60"
  };
  const out = { ...fallback };
  for (const [table, query] of Object.entries(tables)) {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
      if (!res.ok) { sources[table] = `fallback (${res.status})`; out.fallback_active = true; out[table] = []; continue; }
      const rows = await res.json().catch(() => []);
      out[table] = Array.isArray(rows) ? rows : [];
      sources[table] = out[table].length ? "database" : "empty_database";
      if (!out[table].length) out.fallback_active = true;
    } catch (err) {
      sources[table] = `fallback (${err?.message || "fetch failed"})`;
      out.fallback_active = true;
      out[table] = [];
    }
  }
  return out;
}

function normalizeDbQuotes(rows) {
  return rows.map((row) => ({
    id: row.quote_number || row.id,
    customer: row.customer_name || "Customer",
    town: row.town || "",
    service: row.service_label || "",
    status: row.status || "draft",
    quote_value: cents(row.quoted_amount_cents || row.accepted_amount_cents),
    created_at: row.created_at,
    follow_up_stage: row.follow_up_stage || "",
    source: row.source_channel || "",
    probability: Number(row.probability || 0)
  }));
}
function normalizeFallbackQuotes(rows) { return rows.map((row) => ({ ...row, source: row.source || row.source_channel || "" })); }
function normalizeDbMeta(rows) { return rows.map((row) => ({ id: row.id, name: row.campaign_name, spend: cents(row.spend_cents), leads: Number(row.leads_count || 0), booked_jobs: Number(row.booked_jobs_count || 0), revenue: cents(row.revenue_cents), status: row.notes || "tracked" })); }
function normalizeFallbackMeta(rows) { return rows; }
function cents(value) { return Math.round((Number(value || 0) / 100) * 100) / 100; }

function computeMetrics({ quoteRows, metaRows, reviewRows, routeRows, membershipRows, proofRows, fleetRows, campaignRows }) {
  const openQuotes = quoteRows.filter((q) => !["accepted","declined","lost","cancelled"].includes(clean(q.status)));
  const acceptedQuotes = quoteRows.filter((q) => clean(q.status) === "accepted");
  const overdueQuotes = openQuotes.filter((q) => /follow|second|due|needs/i.test(String(q.follow_up_stage || "")) || quoteAgeDays(q.created_at) >= 2);
  const adSpend = sum(metaRows, "spend");
  const adLeads = sum(metaRows, "leads");
  const adJobs = sum(metaRows, "booked_jobs");
  const adRevenue = sum(metaRows, "revenue");
  const proofDrafts = proofRows.filter((p) => clean(p.status) !== "completed" && clean(p.status) !== "approved").length;
  const reviewQueued = reviewRows.filter((r) => ["queued","planned","pending"].includes(clean(r.status))).length;
  const dueMaintenance = membershipRows.filter((m) => clean(m.status) !== "cancelled" && dueDate(m.next_reminder_at)).length;
  return {
    quote_count: quoteRows.length,
    open_quote_count: openQuotes.length,
    open_quote_value: round(sum(openQuotes, "quote_value"), 2),
    accepted_quote_value: round(sum(acceptedQuotes, "quote_value"), 2),
    likely_revenue: round(openQuotes.reduce((t,q)=>t+(Number(q.quote_value)||0)*(Number(q.probability)||0), 0), 2),
    quote_followups_due: overdueQuotes.length,
    quote_close_rate: quoteRows.length ? round((acceptedQuotes.length / quoteRows.length) * 100, 1) : 0,
    ad_spend: round(adSpend, 2),
    ad_leads: adLeads,
    ad_booked_jobs: adJobs,
    ad_revenue: round(adRevenue, 2),
    cost_per_lead: adLeads ? round(adSpend / adLeads, 2) : 0,
    customer_acquisition_cost: adJobs ? round(adSpend / adJobs, 2) : 0,
    ad_return_multiple: adSpend ? round(adRevenue / adSpend, 2) : 0,
    proof_drafts: proofDrafts,
    review_requests_queued: reviewQueued,
    maintenance_due: dueMaintenance,
    membership_plan_count: membershipRows.length,
    fleet_account_count: fleetRows.length,
    seasonal_campaign_count: campaignRows.length,
    route_cluster_count: routeRows.length
  };
}
function stageStatus(stage, context) {
  const warnings = [];
  let state = "ready";
  if (stage.key === "lead_quote" && context.metrics.quote_followups_due) warnings.push(`${context.metrics.quote_followups_due} quote follow-up(s) need attention.`);
  if (stage.key === "proof_work" && context.metrics.proof_drafts) warnings.push(`${context.metrics.proof_drafts} proof checklist(s) are not complete.`);
  if (stage.key === "review_proof" && !context.metrics.review_requests_queued) warnings.push("Review request queue needs real completed-job data.");
  if (stage.key === "repeat_maintenance" && !context.metrics.membership_plan_count) warnings.push("Maintenance plans need DB rows or seeded plans.");
  if (warnings.length) state = "needs_attention";
  return { ...stage, status: state, warnings };
}
function buildAttentionItems({ quoteRows, metrics, db, reviewRows, routeRows, membershipRows, proofRows, fleetRows, campaignRows }) {
  const items = [];
  quoteRows.filter(q => !["accepted","declined","lost","cancelled"].includes(clean(q.status))).slice(0, 4).forEach((q) => {
    items.push({ group:"money", label:`Quote follow-up: ${q.customer || q.id}`, detail:`${q.service || "Service"} · ${money(q.quote_value)} · ${q.follow_up_stage || "follow-up stage needed"}`, target:"/admin-quotes.html", urgency: quoteAgeDays(q.created_at) >= 2 ? "high" : "normal" });
  });
  if (metrics.proof_drafts) items.push({ group:"work", label:"Proof-of-work checklists need completion", detail:`${metrics.proof_drafts} checklist(s) are still draft/in progress.`, target:"/detailer-jobs.html", urgency:"normal" });
  if (metrics.review_requests_queued) items.push({ group:"trust", label:"Review requests queued", detail:`${metrics.review_requests_queued} review request(s) are queued/planned.`, target:"/admin-notifications.html", urgency:"normal" });
  if (metrics.maintenance_due) items.push({ group:"repeat", label:"Maintenance reminders due", detail:`${metrics.maintenance_due} plan/reminder row(s) may need follow-up.`, target:"/admin-growth.html", urgency:"normal" });
  if (fleetRows.length) items.push({ group:"repeat", label:"Fleet prospects/accounts available", detail:`${fleetRows.length} fleet account row(s) to review for recurring revenue.`, target:"/fleet.html", urgency:"normal" });
  if (campaignRows.length) items.push({ group:"repeat", label:"Seasonal campaign ideas ready", detail:`${campaignRows.length} campaign row(s) can become landing/social content.`, target:"/admin-growth.html", urgency:"low" });
  if (db.fallback_active) items.push({ group:"work", label:"Some workflow modules are using fallback/seed data", detail:"Run Build 206 SQL and add real rows to make the command center fully live.", target:"/admin-docs.html", urgency:"normal" });
  return items.slice(0, 10);
}
function quoteAgeDays(dateValue) { const t = Date.parse(dateValue || ""); if (!Number.isFinite(t)) return 0; return Math.max(0, Math.floor((Date.now() - t) / 86400000)); }
function dueDate(value) { const t = Date.parse(value || ""); return Number.isFinite(t) && t <= Date.now(); }
function clean(v) { return String(v || "").trim().toLowerCase(); }
function sum(rows, key) { return (rows || []).reduce((total, row) => total + (Number(row?.[key]) || 0), 0); }
function round(n, p=2) { const m = Math.pow(10, p); return Math.round((Number(n) || 0) * m) / m; }
function money(value) { return `$${round(value, 0).toLocaleString("en-CA")}`; }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
