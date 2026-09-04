const WRITABLE_STATUSES = new Set(["new", "reviewing", "contacted", "quoted", "closed", "spam"]);
const META_FIELDS = new Set(["lead_id", "id", "staff_user_id", "staff_email", "status", "staff_note"]);

export function normalizeFleetLeadPatch(input = {}) {
  const body = input && typeof input === "object" ? input : {};
  const unknown = Object.keys(body).filter((key) => !META_FIELDS.has(key));
  if (unknown.length) return { ok: false, error: `Unsupported fleet pipeline field: ${unknown[0]}.` };

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = String(body.status || "").trim().toLowerCase();
    if (!WRITABLE_STATUSES.has(status)) {
      if (status === "converted") return { ok: false, error: "Conversion must come from the booking/quote workflow, not the fleet pipeline." };
      return { ok: false, error: "Unsupported fleet pipeline status." };
    }
    patch.status = status;
  }

  if (Object.prototype.hasOwnProperty.call(body, "staff_note")) {
    patch.staff_note = cleanText(body.staff_note, 1200) || null;
  }

  if (!Object.keys(patch).length) return { ok: false, error: "No fleet pipeline fields were supplied." };
  return { ok: true, patch };
}

export function deriveFleetLead(row = {}) {
  const parsed = parseFleetMessage(row.message);
  const status = String(row.status || "new").trim().toLowerCase();
  return {
    id: row.id || null,
    full_name: cleanText(row.full_name, 180) || "Customer",
    business_name: parsed.business_name,
    request_type: parsed.request_type,
    request_details: parsed.request_details,
    email: cleanText(row.email, 220) || null,
    phone: cleanText(row.phone, 60) || null,
    service_area: cleanText(row.service_area, 180) || null,
    vehicle_count: finiteWhole(row.vehicle_count),
    preferred_cadence: cleanText(row.preferred_cadence, 180) || null,
    photo_estimate_links: normalizeLinks(row.photo_estimate_links),
    status,
    staff_note: cleanText(row.staff_note, 1200) || null,
    converted_booking_id: row.converted_booking_id || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    is_open: !["converted", "closed", "spam"].includes(status),
    needs_follow_up: ["new", "reviewing", "contacted", "quoted"].includes(status),
    conversion_locked: true
  };
}

export function fleetPipelineMetrics(leads = []) {
  const list = Array.isArray(leads) ? leads : [];
  const count = (status) => list.filter((lead) => String(lead.status || "") === status).length;
  return {
    total: list.length,
    open: list.filter((lead) => lead.is_open).length,
    new: count("new"),
    reviewing: count("reviewing"),
    contacted: count("contacted"),
    quoted: count("quoted"),
    converted: count("converted"),
    closed: count("closed"),
    spam: count("spam"),
    vehicles_requested: list.reduce((sum, lead) => sum + (finiteWhole(lead.vehicle_count) || 0), 0)
  };
}

export function parseFleetMessage(value) {
  const lines = String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let request_type = null;
  let business_name = null;
  const detailLines = [];
  for (const line of lines) {
    if (/^request type:/i.test(line)) request_type = cleanText(line.replace(/^request type:\s*/i, ""), 180) || null;
    else if (/^business \/ organization:/i.test(line)) business_name = cleanText(line.replace(/^business \/ organization:\s*/i, ""), 180) || null;
    else detailLines.push(line);
  }
  return { request_type, business_name, request_details: cleanText(detailLines.join("\n"), 2200) || null };
}

export function writableFleetLeadStatuses() {
  return [...WRITABLE_STATUSES];
}

function normalizeLinks(value) {
  const list = Array.isArray(value) ? value : [];
  return list.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 20);
}

function finiteWhole(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
