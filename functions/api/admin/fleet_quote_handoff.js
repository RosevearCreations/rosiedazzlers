import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import {
  buildFleetDraftQuote,
  classifyFleetLinkedQuotes,
  fleetQuoteAdminUrl,
  isDeterministicFleetQuote
} from "../_lib/fleet-quote-handoff.js";

const LEAD_SELECT = "id,topic,full_name,email,phone,service_area,vehicle_count,preferred_cadence,message,status,staff_note,converted_booking_id,created_at,updated_at";
const QUOTE_SELECT = "id,lead_id,customer_id,booking_id,quote_number,customer_name,town,service_label,status,source_channel,quoted_amount_cents,accepted_amount_cents,probability,follow_up_stage,next_follow_up_at,sent_at,accepted_at,declined_at,created_at,updated_at";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;

  const leadId = String(body.lead_id || "").trim();
  if (!isUuid(leadId)) return json({ ok: false, code: "fleet_lead_id_invalid", error: "Valid fleet lead id is required." }, 400);

  try {
    const lead = await loadFleetLead(env, leadId);
    if (!lead) return json({ ok: false, code: "fleet_lead_missing", error: "Fleet lead was not found." }, 404);

    const prepared = buildFleetDraftQuote(lead);
    if (!prepared.ok) return json({ ok: false, code: prepared.code, error: prepared.error }, 409);

    const existing = classifyFleetLinkedQuotes(await loadQuotesForLead(env, leadId), leadId);
    if (!existing.ok) return json({ ok: false, code: existing.code, error: existing.error }, 409);
    if (existing.found) return handoffResponse(existing.quote, prepared.lead, access.actor, false, true);

    const now = new Date().toISOString();
    const payload = { ...prepared.payload, created_at: now, updated_at: now };
    const createRes = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_pipeline_items`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([payload])
    });
    const createText = await createRes.text();

    if (!createRes.ok) {
      // The deterministic quote UUID equals the lead UUID. If two staff actions race,
      // the primary key allows only one create. Re-read that exact row and reuse it.
      if (createRes.status === 409) {
        const raced = await loadQuoteById(env, leadId);
        if (isDeterministicFleetQuote(raced, leadId)) {
          return handoffResponse(raced, prepared.lead, access.actor, false, true, "concurrent_create_reused");
        }
      }
      return json({ ok: false, code: "fleet_quote_create_failed", error: "Could not create the fleet draft quote.", details: createText.slice(0, 500) }, 500);
    }

    const rows = safeJson(createText, []);
    const quote = Array.isArray(rows) ? rows[0] || null : rows;
    if (!isDeterministicFleetQuote(quote, leadId)) {
      return json({ ok: false, code: "fleet_quote_create_identity_failed", error: "Draft quote was created without the expected fleet lead identity." }, 500);
    }
    return handoffResponse(quote, prepared.lead, access.actor, true, false);
  } catch (err) {
    return json({ ok: false, code: "fleet_quote_handoff_failed", error: err?.message || "Could not prepare the fleet quote handoff." }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "Method not allowed.", allowed_methods: ["POST", "OPTIONS"] }, 405);
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" } });
}

async function loadFleetLead(env, leadId) {
  const url = `${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?select=${encodeURIComponent(LEAD_SELECT)}&id=eq.${encodeURIComponent(leadId)}&topic=eq.fleet&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Could not load fleet lead. ${text.slice(0, 300)}`);
  const rows = safeJson(text, []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadQuotesForLead(env, leadId) {
  const url = `${env.SUPABASE_URL}/rest/v1/quote_pipeline_items?select=${encodeURIComponent(QUOTE_SELECT)}&lead_id=eq.${encodeURIComponent(leadId)}&order=${encodeURIComponent("created_at.asc")}&limit=3`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Could not inspect existing fleet quotes. ${text.slice(0, 300)}`);
  const rows = safeJson(text, []);
  return Array.isArray(rows) ? rows : [];
}

async function loadQuoteById(env, quoteId) {
  const url = `${env.SUPABASE_URL}/rest/v1/quote_pipeline_items?select=${encodeURIComponent(QUOTE_SELECT)}&id=eq.${encodeURIComponent(quoteId)}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) return null;
  const rows = safeJson(text, []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function handoffResponse(quote, lead, actor, created, reused, reason = null) {
  return json({
    ok: true,
    created,
    reused,
    reason,
    quote,
    quote_url: fleetQuoteAdminUrl(quote?.id),
    fleet_lead: { id: lead?.id || null, status: lead?.status || null, business_name: lead?.business_name || null, full_name: lead?.full_name || null },
    actor: { id: actor?.id || null, name: actor?.full_name || actor?.email || "Staff" },
    changes_lead_status: false,
    creates_customer_profile: false,
    creates_booking: false,
    creates_appointment: false,
    charges_customer: false,
    creates_recurring_commitment: false
  });
}

function safeJson(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}
