import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateCapacity738, occupiedSlots738, torontoDate738, CAPACITY_CONTRACT_738 } from "../functions/api/_lib/booking-capacity-v738.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const nowMs = Date.parse("2026-11-01T14:00:00Z");
const date = "2026-11-04";
const check = (bookings, extra = {}) => evaluateCapacity738({ date, bookings, nowMs, ...extra });
const pending = (start_slot, duration_slots, rest = {}) => ({
  id: `${start_slot}-${duration_slots}-${rest.status || "pending"}`, status: "pending", job_status: "scheduled", start_slot, duration_slots, ...rest
});

assert.equal(CAPACITY_CONTRACT_738, "rosie-booking-capacity.v1");
assert.deepEqual(occupiedSlots738(pending("AM", 2)), ["AM", "PM"]);
assert.deepEqual(occupiedSlots738(pending("PM", 1)), ["PM"]);
assert.equal(torontoDate738(Date.parse("2026-11-01T03:30:00Z")), "2026-10-31", "Toronto midnight must be local, not UTC");
assert.equal(torontoDate738(Date.parse("2026-11-01T06:30:00Z")), "2026-11-01", "DST transition must use Toronto calendar day");

const empty = check([]);
assert.equal(empty.AM, true);
assert.equal(empty.PM, true);
assert.equal(empty.policy.max_half_day_bookings, 2);
assert.equal(empty.policy.staffing_verified, false);
assert.match(empty.policy.staffing_note, /owner/);
const full = check([pending("AM", 2)]);
assert.deepEqual([full.AM, full.PM], [false, false], "One full day consumes the whole vehicle");
assert.equal(full.requested_fit, null);
assert.equal(check([pending("AM", 1)], { requestedStartSlot: "PM", requestedDurationSlots: 1 }).requested_fit, true);
assert.equal(check([pending("AM", 1)], { requestedStartSlot: "AM", requestedDurationSlots: 1 }).requested_fit, false);
const twoHalves = check([pending("AM", 1), pending("PM", 1)], { requestedStartSlot: "AM", requestedDurationSlots: 2 });
assert.deepEqual([twoHalves.AM, twoHalves.PM, twoHalves.requested_fit], [false, false, false]);
assert.equal(check([pending("AM", 1)], { requestedStartSlot: "AM", requestedDurationSlots: 2 }).requested_fit, false);
assert.equal(check([pending("AM", 1)], { requestedStartSlot: "PM", requestedDurationSlots: 2 }).requested_fit, null, "Full day must start in AM");

// Pending booking age does not silently release it. Explicit cancellation does.
assert.equal(check([pending("AM", 1, { created_at: "2020-01-01T00:00:00Z" })]).AM, false);
assert.equal(check([pending("AM", 1, { status: "cancelled" })]).AM, true);
assert.equal(check([pending("AM", 1, { job_status: "cancelled" })]).AM, true);
assert.equal(check([pending("AM", 1, { status: "failed" })]).AM, true);
assert.equal(check([pending("AM", 1)], { excludeBookingId: "AM-1-pending", requestedStartSlot: "AM", requestedDurationSlots: 1 }).requested_fit, true,
  "Editing a booking can exclude only that booking's own slot");

assert.deepEqual([check([], { dateBlocks: [{blocked_date:date}] }).AM, check([], { dateBlocks: [{}] }).PM], [false, false]);
assert.deepEqual([check([], { slotBlocks:[{slot:"AM"}] }).AM, check([], { slotBlocks:[{slot:"AM"}] }).PM], [false, true]);
assert.equal(check([], { businessHours:{is_closed:true}, requestedStartSlot:"AM",requestedDurationSlots:1 }).requested_fit, false);
assert.equal(check([], { minimumLeadDays:4 }).AM, false);
assert.equal(check([], { minimumLeadDays:3 }).AM, true);
assert.deepEqual([check([], { staffingVerified:true, staffingWindows:{AM:true,PM:false} }).AM,
  check([], { staffingVerified:true, staffingWindows:{AM:true,PM:false} }).PM], [true, false]);
assert.equal(check([], { staffingWindows:{AM:false,PM:false} }).AM, true, "Unverified staffing windows cannot invent a closure");
assert.equal(evaluateCapacity738({date:"garbage"}).ok, false);

const sql = read("../supabase/migrations/20261101190000_build738_one_car_capacity_and_owner_exceptions.sql");
for (const clause of [
  /pg_advisory_xact_lock\(/, /BEFORE INSERT OR UPDATE OF service_date, start_slot, duration_slots, status, job_status/,
  /NEW\.duration_slots = 2 OR other\.duration_slots = 2 OR NEW\.start_slot = other\.start_slot/,
  /status IN \('pending', 'confirmed'\)/, /SECURITY INVOKER/g, /RAISE EXCEPTION[\s\S]*?ERRCODE = '23505'/,
  /rosie_schedule_exception_audit_738 ENABLE ROW LEVEL SECURITY/,
  /GRANT EXECUTE[\s\S]*?TO service_role/,
  /DELETE FROM public\.slot_blocks/, /DELETE FROM public\.date_blocks/,
  /removed_blocks integer NOT NULL CHECK \(removed_blocks > 0\)/
]) assert.match(sql, clause, `Database capacity and atomic audit contract missing ${clause}`);

const checkout = read("../functions/api/checkout.js");
const availability = read("../functions/api/availability.js");
const adminSave = read("../functions/api/admin/booking_save.js");
const adminDay = read("../functions/api/admin/day_schedule.js");
const adminAvailability = read("../functions/api/admin/booking_availability.js");
const owner = read("../functions/api/_lib/owner-schedule-exception-v738.js");
const blockUi = read("../admin-blocks.html");
const planner = read("../booking-planner.html");
assert.match(checkout, /checkCheckoutCapacity738\(\{ supa, env, pricing, body \}\)/);
assert.match(checkout, /const insertBooking = await insertBookingWithOptionalFields/);
assert.ok(checkout.indexOf("checkCheckoutCapacity738({ supa, env, pricing, body })") < checkout.indexOf("const insertBooking = await"));
assert.doesNotMatch(checkout, /holdSince|created_at\.gte/, "Expiry must not create silent availability mismatch");
assert.match(checkout, /insertBooking\.status === 409/);
assert.match(availability, /capacity_reconciliation_738: capacity/);
assert.match(availability, /select=id,status,job_status,start_slot,duration_slots/);
assert.match(adminSave, /checkAdminCapacity738/);
assert.match(adminSave, /capacity_override: false/);
assert.match(adminSave, /duration_slots: payload\.duration_slots == null \? 2 : payload\.duration_slots/);
assert.match(adminDay, /occupiedSlots738/);
assert.match(adminAvailability, /occupiedSlots738/);
assert.match(owner, /access\.auth_mode !== "session" \|\| access\.actor\?\.is_admin !== true/);
assert.match(owner, /reason\.length < 20/);
assert.match(owner, /rpc\/rosie_owner_release_schedule_block_738/);
assert.match(blockUi, /ownerExceptionReason738/);
assert.equal(blockUi, read("../admin-blocks/index.html"));
assert.match(planner, /One mobile detailing vehicle is available per day/);
console.log("BUILD 738 AVAILABILITY, ONE-CAR CAPACITY AND OWNER EXCEPTIONS: PASS");
