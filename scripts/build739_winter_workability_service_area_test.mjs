import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { coldSeasonReview739, evaluateWorkability739 } from "../assets/winter-workability-v739.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const catalog = JSON.parse(read("../data/rosie_services_pricing_and_packages.json"));
const oxford = catalog.service_areas.find((row) => row.county === "Oxford County" && row.travel_tier !== "quote_required");
const norfolk = catalog.service_areas.find((row) => row.county === "Norfolk County" && row.travel_tier !== "quote_required");
assert.ok(oxford && norfolk, "Both counties need managed, non-fallback service zones");
for (const county of ["Oxford County", "Norfolk County"]) {
  const rows = catalog.service_areas.filter((row) => row.county === county);
  assert.ok(rows.length >= 2);
  assert.ok(rows.some((row) => row.official_links?.some((link) => /^https:\/\//.test(link.url))), "County must link to an official bylaw/water source");
  assert.ok(rows.some((row) => /water|runoff/i.test(row.access_rule)), "County worksite rules must preserve water/runoff context");
}

const safe = { access: "private_safe", surface: "clear_level", weather: "suitable", runoff: "compliant" };
const check = (change = {}) => evaluateWorkability739({
  serviceDate: "2026-10-20", serviceArea: oxford.value, county: oxford.county,
  areaVerified: true, worksite: safe, ...change
});
assert.equal(check().status, "request_can_proceed", "Clear non-winter worksite should retain ordinary booking");
assert.equal(check().canAutomaticallyReserve, true);
assert.equal(check({ county: norfolk.county, serviceArea: norfolk.value }).canAutomaticallyReserve, true);
assert.equal(check({ serviceDate: "2026-11-01" }).canAutomaticallyReserve, false, "Start of review season must not guarantee a winter slot");
assert.equal(check({ serviceDate: "2027-02-15" }).seasonReview, true);
assert.equal(check({ serviceDate: "2027-03-31" }).seasonReview, true);
assert.equal(check({ serviceDate: "2027-04-01" }).seasonReview, false);
assert.equal(coldSeasonReview739("not a date"), false);
assert.equal(check({ areaVerified: false }).canAutomaticallyReserve, false, "County fallback is not an approved exact service-zone match");
assert.equal(check({ county: "Outside zone" }).canAutomaticallyReserve, false);
assert.equal(check({ worksite: { ...safe, access: "shared_or_street" } }).canAutomaticallyReserve, false);
assert.equal(check({ worksite: { ...safe, surface: "unsafe" } }).canAutomaticallyReserve, false);
assert.equal(check({ worksite: { ...safe, weather: "hazard" } }).canAutomaticallyReserve, false);
assert.equal(check({ worksite: { ...safe, runoff: "restricted" } }).canAutomaticallyReserve, false);
assert.equal(check({ worksite: {} }).canAutomaticallyReserve, false, "Old/omitted questionnaire cannot bypass server gate");
assert.match(check().utilities, /Rosie supplies water and power/);
assert.ok(!JSON.stringify(check()).includes("°C"), "Unapproved numeric temperature limits must not be inferred");

const planner = read("../booking-planner.html");
for (const field of ["worksite_access_739", "worksite_surface_739", "worksite_weather_739", "worksite_runoff_739", "workabilityStatus739", "winterDateNotice739"]) {
  assert.match(planner, new RegExp(`id="${field}"`));
}
assert.match(planner, /workability_739: workabilityAnswers739\(\)/);
assert.match(planner, /workability\.canAutomaticallyReserve/);
assert.match(planner, /Rosie supplies the normal detailing water and power/);
assert.match(planner, /Indoor service is never assumed/);
assert.match(planner, /href="\/contact" id="workabilityReviewLink739"/);
const checkout = read("../functions/api/checkout.js");
const gate = checkout.indexOf("const workability739 = evaluateWorkability739(");
assert.ok(gate > 0);
assert.ok(checkout.indexOf("resolveCheckoutCustomerIdentity({ request, env, body })") > gate, "Workability gate precedes customer side effects");
assert.ok(checkout.indexOf("const insertBooking = await") > gate, "Workability gate precedes booking inserts");
assert.match(checkout, /review_state: workability739\.status/);
assert.match(checkout, /payment_attempted: false/);
assert.match(checkout, /booking_created: false/);
assert.match(checkout, /return corsJson\(\{[\s\S]*?review_state: workability739\.status[\s\S]*?\}, 422\)/);
console.log("BUILD 739 WINTER WORKABILITY, UTILITIES, SERVICE AREA AND PAYMENT SAFETY: PASS");
