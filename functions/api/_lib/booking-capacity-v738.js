// Build 738: deterministic one-vehicle/full-day or two-half-day occupancy.
// Never treat expired-looking pending payments as free: only an explicit
// cancelled/failed/refunded state can release a held slot.
export const CAPACITY_CONTRACT_738 = "rosie-booking-capacity.v1";

export function occupiedSlots738(booking) {
  const start = String(booking?.start_slot || "").trim().toUpperCase();
  if (start === "FULL" || start === "FULL_DAY" || start === "BOTH" || Number(booking?.duration_slots) === 2) return ["AM", "PM"];
  return ["AM", "PM"].includes(start) ? [start] : [];
}

export function isActiveBookingHold738(booking) {
  const status = String(booking?.status || "").toLowerCase();
  const job = String(booking?.job_status || "").toLowerCase();
  return ["pending", "confirmed"].includes(status) && job !== "cancelled";
}

export function torontoDate738(nowMs = Date.now()) {
  const fields = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(nowMs));
  const part = key => fields.find(x => x.type === key)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function evaluateCapacity738({
  date, bookings = [], dateBlocks = [], slotBlocks = [], businessHours = null,
  minimumLeadDays = 0, nowMs = Date.now(), requestedStartSlot = "", requestedDurationSlots = null,
  excludeBookingId = null, staffingVerified = false, staffingWindows = null
} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { ok: false, reason: "Invalid date", AM: false, PM: false };
  const active = (Array.isArray(bookings) ? bookings : []).filter(row =>
    isActiveBookingHold738(row) && String(row.id || "") !== String(excludeBookingId || "__no_exclusion__"));
  const busy = new Set(active.flatMap(occupiedSlots738));
  const blockedSlots = new Set((Array.isArray(slotBlocks) ? slotBlocks : []).map(x => String(x?.slot || "").toUpperCase()));
  const fullDayBlock = (Array.isArray(dateBlocks) ? dateBlocks : []).length > 0;
  const closedByHours = businessHours?.is_closed === true;
  const today = torontoDate738(nowMs);
  const startOrdinal = Date.parse(`${date}T00:00:00Z`);
  const todayOrdinal = Date.parse(`${today}T00:00:00Z`);
  const leadDays = Math.max(0, Math.min(90, Math.ceil(Number(minimumLeadDays) || 0)));
  const leadBlocked = !Number.isFinite(startOrdinal) || !Number.isFinite(todayOrdinal) || startOrdinal - todayOrdinal < leadDays * 86400000;
  const windowOpen = slot => !staffingVerified || staffingWindows?.[slot] === true;
  const AM = !fullDayBlock && !closedByHours && !leadBlocked && !blockedSlots.has("AM") && !busy.has("AM") && windowOpen("AM");
  const PM = !fullDayBlock && !closedByHours && !leadBlocked && !blockedSlots.has("PM") && !busy.has("PM") && windowOpen("PM");
  const requestSlots = Number(requestedDurationSlots) === 2 ? ["AM", "PM"] : [String(requestedStartSlot).toUpperCase()];
  const requestValid = (Number(requestedDurationSlots) === 1 && ["AM", "PM"].includes(requestSlots[0])) ||
    (Number(requestedDurationSlots) === 2 && String(requestedStartSlot).toUpperCase() === "AM");
  const available = requestValid ? requestSlots.every(slot => slot === "AM" ? AM : PM) : null;
  const reasons = [
    fullDayBlock ? "date_blocked" : null,
    closedByHours ? "business_hours_closed" : null,
    leadBlocked ? "lead_time_not_met" : null,
    blockedSlots.size ? "slot_blocked" : null,
    busy.size ? "existing_booking_hold" : null,
    staffingVerified && (!windowOpen("AM") || !windowOpen("PM")) ? "staffing_window_closed" : null
  ].filter(Boolean);
  return {
    ok: true, date, AM, PM, requested_fit: available,
    busy_slots: [...busy].sort(), active_bookings: active.length, reasons,
    policy: { full_day_uses_both_slots: true, max_half_day_bookings: 2, pending_hold_requires_explicit_release: true,
      minimum_lead_days: leadDays, staffing_verified: staffingVerified,
      staffing_note: staffingVerified ? "Verified configured staffing windows applied" : "Staff coverage must be confirmed by the owner before dispatch" }
  };
}
