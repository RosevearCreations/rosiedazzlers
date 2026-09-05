import { deriveFleetLead } from "./fleet-account-pipeline.js";

const BLOCKED_STATUSES = new Set(["converted", "closed", "spam"]);

export function validateFleetQuoteLead(row = {}) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return { ok: false, code: "fleet_lead_missing", error: "Fleet lead was not found." };
  }
  if (String(row.topic || "").trim().toLowerCase() !== "fleet") {
    return { ok: false, code: "fleet_topic_required", error: "Quote handoff is limited to fleet inquiries." };
  }
  const id = cleanText(row.id, 80);
  if (!isUuid(id)) {
    return { ok: false, code: "fleet_lead_id_invalid", error: "Fleet lead identity is invalid." };
  }
  const status = String(row.status || "new").trim().toLowerCase();
  if (BLOCKED_STATUSES.has(status)) {
    return {
      ok: false,
      code: `fleet_lead_${status}_locked`,
      error: `A ${status} fleet lead cannot create a new draft quote. Reopen the lead through the fleet pipeline first.`
    };
  }
  return { ok: true, id, status };
}

export function buildFleetDraftQuote(row = {}) {
  const validation = validateFleetQuoteLead(row);
  if (!validation.ok) return validation;
  const lead = deriveFleetLead(row);
  const vehicleCount = positiveWhole(lead.vehicle_count);
  const subject = vehicleCount
    ? `Fleet detailing assessment — ${vehicleCount} vehicle${vehicleCount === 1 ? "" : "s"}`
    : "Fleet detailing assessment";
  return {
    ok: true,
    quote_id: validation.id,
    payload: {
      id: validation.id,
      lead_id: validation.id,
      customer_id: null,
      booking_id: null,
      quote_number: `FLEET-${validation.id.slice(0, 8).toUpperCase()}`,
      customer_name: cleanText(lead.business_name || lead.full_name, 240) || "Fleet inquiry",
      town: cleanText(lead.service_area, 160) || null,
      service_label: subject,
      status: "draft",
      source_channel: "fleet_public_inquiry",
      quoted_amount_cents: 0,
      accepted_amount_cents: 0,
      probability: 25,
      follow_up_stage: "prepare_quote",
      next_follow_up_at: null,
      sent_at: null,
      accepted_at: null,
      declined_at: null
    },
    lead
  };
}

export function classifyFleetLinkedQuotes(rows, leadId) {
  const id = cleanText(leadId, 80);
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!isUuid(id)) {
    return { ok: false, code: "fleet_lead_id_invalid", error: "Fleet lead identity is invalid." };
  }
  if (list.length > 1) {
    return {
      ok: false,
      code: "fleet_quote_handoff_ambiguous",
      error: "More than one quote is linked to this fleet lead. Resolve the duplicate quote records before continuing."
    };
  }
  if (!list.length) return { ok: true, found: false, quote: null };
  const quote = list[0];
  if (String(quote.lead_id || "").trim() !== id) {
    return { ok: false, code: "fleet_quote_link_mismatch", error: "The linked quote does not match this fleet lead." };
  }
  return { ok: true, found: true, quote };
}

export function fleetQuoteAdminUrl(quoteId) {
  const id = cleanText(quoteId, 80);
  return isUuid(id) ? `/admin-quotes.html?quote_id=${encodeURIComponent(id)}` : "/admin-quotes.html";
}

export function isDeterministicFleetQuote(row, leadId) {
  const id = cleanText(leadId, 80);
  return Boolean(isUuid(id) && row && String(row.id || "").trim() === id && String(row.lead_id || "").trim() === id);
}

function positiveWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}
