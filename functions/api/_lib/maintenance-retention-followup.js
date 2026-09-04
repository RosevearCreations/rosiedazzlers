const INTEREST_STATUSES = new Set(["new", "contacted", "interested", "closed", "unsubscribed"]);
const REVIEW_ACTIONS = new Set(["reviewed", "contacted", "no_contact_needed"]);
const INPUT_FIELDS = new Set(["kind", "interest_id", "status", "latest_booking_id", "action", "note", "staff_user_id", "staff_email"]);

export function normalizeMaintenanceFollowupAction(input = {}) {
  const body = input && typeof input === "object" ? input : {};
  const unknown = Object.keys(body).filter((key) => !INPUT_FIELDS.has(key));
  if (unknown.length) return { ok: false, error: `Unsupported maintenance follow-up field: ${unknown[0]}.` };

  const kind = cleanText(body.kind, 40).toLowerCase();
  if (kind === "interest_status") {
    const interestId = cleanText(body.interest_id, 80);
    if (!isUuid(interestId)) return { ok: false, error: "A valid maintenance interest id is required." };
    const status = cleanText(body.status, 40).toLowerCase();
    if (["scheduled", "converted"].includes(status)) {
      return { ok: false, error: "Scheduling and conversion must come from the approved booking workflow." };
    }
    if (!INTEREST_STATUSES.has(status)) return { ok: false, error: "Unsupported maintenance interest status." };
    return { ok: true, kind, interest_id: interestId, status };
  }

  if (kind === "candidate_review") {
    const bookingId = cleanText(body.latest_booking_id, 80);
    if (!isUuid(bookingId)) return { ok: false, error: "A valid latest booking id is required." };
    const action = cleanText(body.action, 40).toLowerCase();
    if (!REVIEW_ACTIONS.has(action)) return { ok: false, error: "Unsupported maintenance review action." };
    return { ok: true, kind, latest_booking_id: bookingId, action, note: cleanText(body.note, 800) || null };
  }

  return { ok: false, error: "Choose a supported maintenance follow-up action." };
}

export function buildMaintenanceReviewEvent(candidate = {}, actor = {}, action = "reviewed", note = null, now = new Date()) {
  if (!REVIEW_ACTIONS.has(action)) throw new Error("Unsupported maintenance review action.");
  if (!isUuid(candidate.latest_booking_id)) throw new Error("Candidate latest booking id is required.");
  const stamp = now instanceof Date && !Number.isNaN(now.getTime()) ? now.toISOString() : new Date().toISOString();
  const actorLabel = cleanText(actor.email || actor.full_name || "staff", 220);
  const safeNote = cleanText(note, 800);
  const suffix = safeNote ? ` — ${safeNote}` : "";
  return {
    customer_id: isUuid(candidate.customer_profile_id) ? candidate.customer_profile_id : null,
    vehicle_id: isUuid(candidate.customer_vehicle_id) ? candidate.customer_vehicle_id : null,
    booking_id: candidate.latest_booking_id,
    event_type: `maintenance_followup_${action}`,
    event_title: maintenanceReviewTitle(action),
    event_note: `Recorded by ${actorLabel || "staff"}${suffix}`.slice(0, 1000),
    recommended_next_service: null,
    customer_visible: false,
    event_at: stamp
  };
}

export function deriveMaintenanceReviewState(events = []) {
  const map = new Map();
  for (const row of Array.isArray(events) ? events : []) {
    const bookingId = cleanText(row?.booking_id, 80);
    if (!bookingId || map.has(bookingId)) continue;
    const eventType = cleanText(row?.event_type, 80);
    const action = eventType.replace(/^maintenance_followup_/, "");
    if (!REVIEW_ACTIONS.has(action)) continue;
    map.set(bookingId, {
      action,
      event_type: eventType,
      event_title: cleanText(row?.event_title, 180) || maintenanceReviewTitle(action),
      event_note: cleanText(row?.event_note, 1000) || null,
      event_at: row?.event_at || row?.created_at || null
    });
  }
  return map;
}

export function maintenanceFollowupMetrics(interestRows = [], candidates = []) {
  const interests = Array.isArray(interestRows) ? interestRows : [];
  const reminders = Array.isArray(candidates) ? candidates : [];
  return {
    interest_total: interests.length,
    interest_new: interests.filter((row) => cleanText(row?.status, 40).toLowerCase() === "new").length,
    interest_contacted: interests.filter((row) => cleanText(row?.status, 40).toLowerCase() === "contacted").length,
    interest_interested: interests.filter((row) => cleanText(row?.status, 40).toLowerCase() === "interested").length,
    reminder_candidates: reminders.length,
    due_reminders: reminders.filter((row) => row?.due === true).length,
    identity_blocked: reminders.filter((row) => row?.vehicle_identity_reliable === false).length,
    reviewed_candidates: reminders.filter((row) => row?.latest_review).length
  };
}

export function writableMaintenanceInterestStatuses() { return [...INTEREST_STATUSES]; }
export function maintenanceReviewActions() { return [...REVIEW_ACTIONS]; }

function maintenanceReviewTitle(action) {
  if (action === "contacted") return "Maintenance follow-up contact recorded";
  if (action === "no_contact_needed") return "Maintenance follow-up marked no contact needed";
  return "Maintenance follow-up reviewed";
}

function cleanText(value, max = 500) { return String(value ?? "").trim().slice(0, max); }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim()); }
