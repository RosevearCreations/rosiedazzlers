// Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence.
// Read-only convergence endpoint. It never mutates booking, payment, accounting,
// inventory, customer, media, provider, or workflow state.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

const ROW_LIMIT = 120;
const EVIDENCE_LIMIT = 2500;
const FIELD_PREFIX = {
  checklist: "[FIELD CHECKLIST]",
  products: "[PRODUCT USAGE]",
  addons: "[APPROVED ADD-ONS]",
  completion: "[COMPLETION EVIDENCE]"
};
const ELIGIBLE_STATUS = new Set(["confirmed", "scheduled", "assigned", "in_progress", "completed"]);

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "view_live_ops",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const headers = serviceHeaders(env);
    const days = clampInt(body.days, 7, 365, 90);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const bookingUrl = `${env.SUPABASE_URL}/rest/v1/bookings?select=*&service_date=gte.${encodeURIComponent(cutoff)}&order=service_date.desc,created_at.desc&limit=${ROW_LIMIT}`;
    const bookingRes = await fetch(bookingUrl, { headers });
    if (!bookingRes.ok) return withCors(json({ ok:false, unavailable:true, error:`Could not load authoritative bookings. ${await bookingRes.text()}` }, 503));
    const rawBookings = await bookingRes.json().catch(() => []);
    const bookings = (Array.isArray(rawBookings) ? rawBookings : []).filter((row) => ELIGIBLE_STATUS.has(normalizeState(row.job_status || row.status)));
    const ids = bookings.map((row) => String(row.id || "")).filter(Boolean);

    if (!ids.length) {
      return withCors(json(buildResponse({ days, cutoff, bookings:[], updates:[], media:[], signoffs:[], times:[], jobCosts:[], jobCostsAvailable:false })));
    }

    const idFilter = encodeURIComponent(ids.join(","));
    const [updates, media, signoffs, times, jobCostsResult] = await Promise.all([
      fetchRows(`${env.SUPABASE_URL}/rest/v1/job_updates?select=id,booking_id,created_at,note,stage,visibility,review_status,requires_admin_review,customer_action_required&booking_id=in.(${idFilter})&order=created_at.desc&limit=${EVIDENCE_LIMIT}`, headers),
      fetchRows(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,booking_id,created_at,stage,kind,visibility,review_status&booking_id=in.(${idFilter})&order=created_at.desc&limit=${EVIDENCE_LIMIT}`, headers),
      fetchRows(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,booking_id,signed_at,created_at,signer_type&booking_id=in.(${idFilter})&order=signed_at.desc&limit=${EVIDENCE_LIMIT}`, headers),
      fetchRows(`${env.SUPABASE_URL}/rest/v1/job_time_entries?select=id,booking_id,minutes,created_at&booking_id=in.(${idFilter})&limit=${EVIDENCE_LIMIT}`, headers),
      fetchOptionalRows(`${env.SUPABASE_URL}/rest/v1/job_costs?select=*&booking_id=in.(${idFilter})&limit=${EVIDENCE_LIMIT}`, headers)
    ]);

    return withCors(json(buildResponse({
      days, cutoff, bookings, updates, media, signoffs, times,
      jobCosts: jobCostsResult.rows,
      jobCostsAvailable: jobCostsResult.available
    })));
  } catch (error) {
    return withCors(json({ ok:false, unavailable:true, error:error?.message || "Job handoff evidence is unavailable." }, 503));
  }
}

function buildResponse({ days, cutoff, bookings, updates, media, signoffs, times, jobCosts, jobCostsAvailable }) {
  const updatesBy = groupByBooking(updates);
  const mediaBy = groupByBooking(media);
  const signoffsBy = groupByBooking(signoffs);
  const timesBy = groupByBooking(times);
  const costsBy = groupByBooking(jobCosts);
  const rows = bookings.map((booking) => buildRow(booking, updatesBy, mediaBy, signoffsBy, timesBy, costsBy, jobCostsAvailable));
  const commercial = buildCommercialEvidence(rows, jobCostsAvailable);
  return {
    ok:true,
    build:401,
    window:{ days, cutoff, booking_limit:ROW_LIMIT, evidence_limit:EVIDENCE_LIMIT },
    evidence_contract:{
      booking_truth:"bookings",
      field_evidence:["job_updates","job_media","job_signoffs","job_time_entries"],
      commercial_truth:"authoritative *_cents booking fields and job_costs only when present",
      free_form_notes_are_authority:false,
      inferred_busy_time:false,
      inferred_payouts:false,
      hidden_debt:false,
      automatic_customer_scoring:false,
      forecasting:false,
      mutations:false
    },
    summary:buildHandoffSummary(rows),
    commercial,
    rows
  };
}

function buildRow(booking, updatesBy, mediaBy, signoffsBy, timesBy, costsBy, jobCostsAvailable) {
  const id = String(booking.id || "");
  const updateRows = updatesBy.get(id) || [];
  const mediaRows = mediaBy.get(id) || [];
  const signoffRows = signoffsBy.get(id) || [];
  const timeRows = timesBy.get(id) || [];
  const costRows = costsBy.get(id) || [];
  const hasNote = (prefix) => updateRows.some((row) => String(row.note || "").includes(prefix));
  const beforePhoto = mediaRows.some((row) => ["arrival","pre_existing"].includes(normalizeState(row.stage)));
  const afterPhoto = mediaRows.some((row) => normalizeState(row.stage) === "final");
  const checklist = hasNote(FIELD_PREFIX.checklist);
  const products = hasNote(FIELD_PREFIX.products);
  const addonsRecord = hasNote(FIELD_PREFIX.addons);
  const completion = hasNote(FIELD_PREFIX.completion);
  const finalAuthorization = signoffRows.length > 0;
  const pendingReview = [...updateRows, ...mediaRows].filter((row) => row.review_status === "pending" || row.requires_admin_review === true).length;
  const customerAction = updateRows.filter((row) => row.customer_action_required === true).length;
  const minutes = timeRows.reduce((sum, row) => sum + finiteNumber(row.minutes), 0);
  const ticket = firstCents(booking, ["total_cents","total_amount_cents","grand_total_cents","quoted_total_cents"]);
  const deposit = firstCents(booking, ["deposit_paid_cents","deposit_amount_cents","deposit_cents"]);
  const paid = firstCents(booking, ["paid_cents","amount_paid_cents","total_paid_cents"]);
  const balance = firstCents(booking, ["balance_due_cents","remaining_balance_cents","balance_cents"]);
  const cost = firstCents(costRows[0] || {}, ["total_cost_cents","job_cost_cents","cost_cents"]);
  const evidenceReady = beforePhoto && checklist && products && addonsRecord && completion && afterPhoto;
  const state = normalizeState(booking.job_status || booking.status);
  return {
    booking:{
      id,
      service_date:booking.service_date || null,
      start_slot:booking.start_slot || null,
      status:booking.status || null,
      job_status:booking.job_status || null,
      package_code:booking.package_code || null,
      vehicle_size:booking.vehicle_size || null,
      customer_name:booking.customer_name || "Customer",
      assigned_staff_name:booking.assigned_staff_name || booking.assigned_to || null
    },
    handoff:{
      evidence_ready:evidenceReady,
      before_photo:beforePhoto,
      checklist,
      approved_addon_record:addonsRecord,
      product_usage:products,
      completion_evidence:completion,
      after_photo:afterPhoto,
      final_authorization:finalAuthorization,
      pending_review_count:pendingReview,
      customer_action_required_count:customerAction,
      recorded_minutes:minutes,
      state,
      next_action:nextAction({ state, beforePhoto, checklist, products, addonsRecord, completion, afterPhoto, pendingReview, customerAction, finalAuthorization })
    },
    commercial:{
      ticket_value:ticket,
      deposit_paid:deposit,
      paid:paid,
      remaining_balance:balance,
      job_cost:jobCostsAvailable ? cost : unavailableMoney("job_costs unavailable"),
      margin:deriveMargin(ticket, jobCostsAvailable ? cost : unavailableMoney("job_costs unavailable"))
    }
  };
}

function nextAction(s) {
  if (s.pendingReview > 0) return "Operations review required";
  if (s.customerAction > 0) return "Customer decision required";
  if (!s.beforePhoto || !s.checklist) return "Before-service evidence incomplete";
  if (!s.products || !s.addonsRecord) return "Field usage/scope record incomplete";
  if (!s.completion || !s.afterPhoto) return "Completion evidence incomplete";
  if (!s.finalAuthorization && ["completed","complete"].includes(s.state)) return "Final authorization evidence not found";
  return "Ready for office handoff review";
}

function buildHandoffSummary(rows) {
  return {
    jobs_observed:rows.length,
    evidence_ready:rows.filter((row) => row.handoff.evidence_ready).length,
    office_review_required:rows.filter((row) => row.handoff.pending_review_count > 0).length,
    customer_action_required:rows.filter((row) => row.handoff.customer_action_required_count > 0).length,
    completion_evidence_open:rows.filter((row) => !row.handoff.completion_evidence || !row.handoff.after_photo).length,
    no_result:rows.length === 0
  };
}

function buildCommercialEvidence(rows, jobCostsAvailable) {
  const tickets = rows.map((row) => row.commercial.ticket_value).filter((m) => m.available);
  const balances = rows.map((row) => row.commercial.remaining_balance).filter((m) => m.available);
  const margins = rows.map((row) => row.commercial.margin).filter((m) => m.available);
  return {
    ticket_value:{ available:tickets.length > 0, observed_jobs:tickets.length, total_cents:sumMoney(tickets), average_cents:tickets.length ? Math.round(sumMoney(tickets)/tickets.length) : null },
    remaining_balance:{ available:balances.length > 0, observed_jobs:balances.length, total_cents:sumMoney(balances) },
    margin:{ available:margins.length > 0, observed_jobs:margins.length, total_cents:sumMoney(margins), source:jobCostsAvailable ? "authoritative booking cents field minus authoritative job_costs cents field" : "unavailable" },
    add_on_attachment:{ available:false, observed_jobs:0, rate:null, reason:"No separate authoritative add-on ledger is inferred from free-form Detailer notes." },
    negative_or_no_result:{ jobs_without_ticket_value:rows.filter((row) => !row.commercial.ticket_value.available).length, jobs_without_margin:rows.filter((row) => !row.commercial.margin.available).length },
    note:"Unavailable metrics remain unavailable; Build 401 never estimates revenue, margin, debt, payouts, or customer value."
  };
}

function firstCents(row, candidates) {
  for (const field of candidates) {
    if (Object.prototype.hasOwnProperty.call(row || {}, field) && row[field] !== null && row[field] !== "") {
      const value = Number(row[field]);
      if (Number.isFinite(value)) return { available:true, cents:Math.round(value), source_field:field };
    }
  }
  return unavailableMoney("authoritative cents field not present");
}
function unavailableMoney(reason) { return { available:false, cents:null, source_field:null, reason }; }
function deriveMargin(ticket, cost) {
  if (!ticket.available || !cost.available) return unavailableMoney("ticket value or job cost unavailable");
  return { available:true, cents:ticket.cents - cost.cents, source_field:`${ticket.source_field}-${cost.source_field}` };
}
function sumMoney(list) { return list.reduce((sum, row) => sum + finiteNumber(row.cents), 0); }
function finiteNumber(value) { const n=Number(value); return Number.isFinite(n) ? n : 0; }
function groupByBooking(rows) {
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key=String(row.booking_id || ""); if (!key) continue;
    if (!out.has(key)) out.set(key, []); out.get(key).push(row);
  }
  return out;
}
async function fetchRows(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Authoritative evidence query failed (${res.status}).`);
  const rows = await res.json().catch(() => []); return Array.isArray(rows) ? rows : [];
}
async function fetchOptionalRows(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) return { available:false, rows:[] };
  const rows = await res.json().catch(() => []); return { available:true, rows:Array.isArray(rows) ? rows : [] };
}
function normalizeState(v) { return String(v || "").trim().toLowerCase().replace(/\s+/g,"_"); }
function clampInt(v,min,max,fallback){const n=Math.trunc(Number(v));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
