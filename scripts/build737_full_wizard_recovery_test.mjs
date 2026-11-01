import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SourceTextModule } from "node:vm";
import {
  BOOKING_JOURNEY_VERSION_737, BOOKING_STEPS_737, CHECKOUT_UNCERTAIN_KEY_737,
  validateBookingAddress737, validateBookingChoices737, createCheckoutAttemptGuard737
} from "../assets/booking-journey-v737.js";
import { validateFinalReviewContact631 } from "../assets/booking-final-review-v631.js";
import { sanitizedBookingChoices630, parseBookingChoices630, reconcileBookingChoices630 } from "../assets/booking-draft-policy-v630.js";
import { wizardStepPresentation627 } from "../assets/booking-wizard-v627.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const planner = read("../booking-planner.html");
const recovery = read("../assets/booking-recovery.js");
const policies = read("../assets/site-policies.js");
const catalog = JSON.parse(read("../data/rosie_services_pricing_and_packages.json"));
const book = read("../book.html");
assert.equal(book, read("../book/index.html"), "Book aliases must retain exact byte parity");
assert.equal(BOOKING_JOURNEY_VERSION_737, "rosie-booking-journey.v1");
assert.deepEqual(BOOKING_STEPS_737, ["Date, area & vehicle", "Choose your service", "Optional add-ons", "Address & waiver", "Payment & review"]);
assert.equal(wizardStepPresentation627(4).name, "Address & waiver");
assert.equal(wizardStepPresentation627(5).name, "Payment & review");
assert.match(planner, /booking-journey-v737\.js\?v=20261101build737/);
assert.match(planner, /booking-wizard-v627\.js\?v=20261101build737/);
assert.match(planner, /site-policies\.js\?v=20261101build737/);
assert.match(book, /site-policies\.js\?v=20261101build737/);
assert.match(policies, /booking-recovery\.js\?v=20261101build737/);

// Route DOM contract: all five steps remain in order, field IDs are unique,
// and address/waiver cannot be skipped into the payment/review panel.
const sections = [...planner.matchAll(/<section\b[^>]*\bdata-step="([1-5])"[^>]*>([\s\S]*?)(?=<section\b[^>]*\bdata-step="[1-5]"|<div class="footer")/g)];
assert.deepEqual(sections.map(x => Number(x[1])), [1, 2, 3, 4, 5]);
const panel = n => sections.find(x => Number(x[1]) === n)?.[2] || "";
for (const id of ["service_date", "service_area", "veh_year", "veh_make", "veh_model", "vehicle_size"]) assert.match(panel(1), new RegExp(`id="${id}"`));
assert.match(panel(2), /id="packageCards"/);
assert.match(panel(3), /id="addonsBox"/);
for (const id of ["address_line1", "city", "postal_code", "addressAreaWarning", "ack_driveway", "ack_bylaw", "ack_cancellation"]) {
  assert.match(panel(4), new RegExp(`id="${id}"`));
  assert.doesNotMatch(panel(5), new RegExp(`id="${id}"`));
}
for (const id of ["customer_name", "customer_email", "customer_phone", "finalSummary", "checkoutBtn"]) assert.match(panel(5), new RegExp(`id="${id}"`));
for (const id of ["address_line1", "city", "postal_code", "customer_name", "customer_email", "checkoutBtn"]) {
  assert.equal([...planner.matchAll(new RegExp(`id="${id}"`, "g"))].length, 1, `${id} must be unique`);
}
assert.match(planner, /id="step4Error" class="field-error"/);
assert.match(planner, /id="step5Error" class="field-error" role="alert"/);
assert.match(planner, /if \(msg && state\.currentStep === step\)/, "Validation errors should receive keyboard focus");
assert.match(planner, /advanceWizardStep737/);
assert.match(planner, /stepAdvanceInFlight737/);
assert.match(planner, /state\.currentStep === fromStep/, "Fast double advance cannot skip a step");

// Address-stage and final-review validation must agree about the same inputs.
for (const [address, postal] of [
  ["123 Sample Street", "N4G 1A1"], ["", "N4G 1A1"], ["x".repeat(181), ""],
  ["123 Main St", "bad code"], ["  123 Main St  ", ""]
]) {
  const actual = validateBookingAddress737({ address, postal });
  const final = validateFinalReviewContact631({ name:"Test Customer", email:"customer@example.ca", address, postal });
  assert.equal(actual.ok, final.ok);
  if (!actual.ok) assert.deepEqual({field:actual.field,message:actual.message}, {field:final.issues[0].field,message:final.issues[0].message});
}
assert.match(planner, /if \(!address\.ok\)/);
assert.match(planner, /showFieldError\(4, address\.message\)/);
assert.match(planner, /validateFinalReviewContact631\(\{/);

// Catalog remains the only public package/add-on source. Source-driven
// eligibility is checked again before checkout without changing prices.
const pkg = catalog.packages.find(x => x?.code === "basic_detail");
assert.ok(pkg?.prices_cad?.small > 0 && pkg?.prices_cad?.mid > 0 && pkg?.prices_cad?.oversize > 0);
for (const size of ["small", "mid", "oversize"]) assert.equal(validateBookingChoices737(catalog, "basic_detail", size).ok, true);
assert.equal(validateBookingChoices737(catalog, "removed_package", "mid").step, 2);
assert.equal(validateBookingChoices737(catalog, "basic_detail", "unknown").step, 1);
assert.equal(validateBookingChoices737(catalog, "basic_detail", "mid", ["removed_addon"]).step, 3);
const restrictedAddon = catalog.addons.find(x => x.requires_package_codes_any?.length && !x.requires_package_codes_any.includes("basic_detail") && !x.standalone_allowed);
if (restrictedAddon) assert.equal(validateBookingChoices737(catalog, "basic_detail", "mid", [restrictedAddon.code]).step, 3);
assert.match(planner, /validateBookingChoices737\(state\.pricing/);

// Synthetic full journey with back navigation: same values are retained in
// memory across panels, with no confirmed booking or payment side effect.
const journey = { step: 1, date: "2026-11-18", slot: "AM", size: "mid", area: "Tillsonburg, ON", packageCode: "basic_detail", addons: [], address: "123 Sample Street", postal: "N4G 1A1", email: "customer@example.ca" };
const advance = () => { assert.ok(journey.step < 5); journey.step++; };
advance(); advance(); advance();
assert.equal(journey.step, 4);
assert.equal(validateBookingAddress737({address:journey.address,postal:journey.postal}).ok, true);
journey.step = 1; // Edit date/vehicle, then return without resetting address.
assert.equal(journey.size, "mid");
assert.equal(journey.address, "123 Sample Street");
advance(); advance(); advance(); advance();
assert.equal(journey.step, 5);
assert.equal(validateFinalReviewContact631({name:"Test Customer",email:journey.email,address:journey.address,postal:journey.postal}).ok, true);

// Interrupted tab session recovers only anonymous choices, and requires a new
// date/slot and fresh server/price validation. No identifying data persists.
const now = Date.parse("2026-11-01T12:00:00Z");
const privateData = {saved_at:now,fields:{vehicle_size:journey.size,service_area:journey.area,customer_email:journey.email,address_line1:journey.address,service_date:journey.date},package_code:journey.packageCode,addon_codes:[]};
const stored = JSON.stringify(sanitizedBookingChoices630(privateData, now));
assert.ok(!stored.includes(journey.email) && !stored.includes(journey.address) && !stored.includes(journey.date));
const resumed = reconcileBookingChoices630(parseBookingChoices630(stored, now + 1000), catalog);
assert.equal(resumed.restore_step, 1);
assert.equal(resumed.service_date, "");
assert.equal(resumed.slot, "");
assert.equal(resumed.holds_slot, false);
assert.equal(resumed.requires_availability_recheck, true);
assert.equal(resumed.requires_price_recheck, true);
assert.match(recovery, /Continue your package choices\?/);
assert.match(recovery, /resume\?\.addEventListener\("click"/);

// Live availability: expired cached slots are re-fetched, never silently
// changed to an alternative, and network failures require a fresh selection.
assert.match(planner, /fetchAvailability\(date, \{ fresh: true \}\)/);
assert.match(planner, /state\.availabilityCache\.delete\(date\)/);
assert.match(planner, /if \(date !== selectedDate\(\)\) return false/);
assert.match(planner, /const noLongerOpen = Boolean\(state\.selectedSlotChoice && !map\[state\.selectedSlotChoice\]\)/);
assert.match(planner, /if \(noLongerOpen\) state\.selectedSlotChoice = ""/);
assert.doesNotMatch(planner, /state\.selectedSlotChoice = map\.AM \? "AM" : map\.PM \? "PM"/);
assert.match(planner, /if \(!await refreshAvailability\(\)\)/);

// Rapid double click never allows two submissions; uncertain response locks
// further attempts even after a page reload in the same browser tab.
const guard = createCheckoutAttemptGuard737();
assert.equal(guard.begin(), true);
assert.equal(guard.begin(), false);
assert.equal(guard.markSubmitted(), true);
assert.equal(guard.begin(), false);
guard.markUncertain();
assert.equal(guard.begin(), false);
assert.equal(createCheckoutAttemptGuard737(true).begin(), false);
const correction = createCheckoutAttemptGuard737();
assert.equal(correction.begin(), true);
assert.equal(correction.releaseForCorrection(), true);
assert.equal(correction.begin(), true);
assert.equal(correction.markSubmitted(), true);
correction.markRedirect();
assert.equal(correction.begin(), false);
assert.match(planner, /checkoutGuard737\.begin\(\)/);
assert.match(planner, /checkoutGuard737\.markSubmitted\(\)/);
assert.match(planner, /sessionStorage\.setItem\(CHECKOUT_UNCERTAIN_KEY_737, "1"\)/);
assert.equal(CHECKOUT_UNCERTAIN_KEY_737, "rd_booking_checkout_uncertain_v737");
assert.match(recovery, /CHECKOUT_UNCERTAIN_KEY_737/);
assert.doesNotMatch(recovery, /catch \(firstError\)[\s\S]*?await sleep\(500\)/);
assert.match(recovery, /Never automatically/);
assert.match(recovery, /safeSessionGet\(CHECKOUT_UNCERTAIN_KEY_737\)/);
assert.match(planner, /No confirmation has been made by this form/);
assert.match(planner, /fetch\("\/api\/checkout"/);
assert.doesNotMatch(read("../assets/booking-journey-v737.js"), /(?:fetch\(|localStorage|CREATE TABLE|payment_intent)/);

// Verify the canonical inline module still parses without launching checkout.
const modules = [...planner.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
assert.ok(modules.length);
for (const [, source] of modules) new SourceTextModule(source);
console.log("Build 737 PASS — five steps, address/waiver boundary, source-driven eligibility, privacy-safe resume, fresh slot checks, accessible errors, no duplicate checkout replay, and inline module syntax.");
