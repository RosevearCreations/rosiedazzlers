import assert from "node:assert/strict";
import { addonAttachRate, addonEligibleForPackage, addonIncludedByPackage, recommendAddons } from "../assets/addon-eligibility.js";

const pkg = { code: "interior_detail", included_addon_codes: ["included_protectant"] };
const addons = [
  { code: "pet_hair", name: "Pet Hair Removal", category: "Interior", prices_cad: { mid: 45 }, requires_package_codes_any: ["interior_detail", "complete_detail"] },
  { code: "odor", name: "Ozone / Odour Treatment", category: "Interior odor", quote_required: true, prices_cad: { mid: 70 }, requires_package_codes_any: ["interior_detail"] },
  { code: "sealant", name: "High Grade Paint Sealant", category: "Exterior protection", prices_cad: { mid: 40 }, requires_package_codes_any: ["exterior_detail"] },
  { code: "included_protectant", name: "Interior Protectant", category: "Interior protection", prices_cad: { mid: 25 }, requires_package_codes_any: ["interior_detail"] },
  { code: "headlights", name: "Headlight Restoration", category: "Exterior lens oxidation", prices_cad: { mid: 90 }, standalone_allowed: true }
];

assert.equal(addonEligibleForPackage(addons[0], "interior_detail"), true, "compatible add-on should be eligible");
assert.equal(addonEligibleForPackage(addons[2], "interior_detail"), false, "incompatible add-on should be blocked");
assert.equal(addonEligibleForPackage(addons[4], "interior_detail"), true, "standalone add-on should remain eligible");
assert.equal(addonIncludedByPackage(addons[3], pkg), true, "included add-on should be recognized");

const pet = recommendAddons({ addons, pkg, packageCode: pkg.code, vehicleSize: "mid", conditionFlags: ["pet_hair"], selectedCodes: [] });
assert.equal(pet[0]?.addonCode, "pet_hair", "pet-hair condition should recommend pet-hair work first");
assert.equal(pet.some((row) => row.addonCode === "sealant"), false, "incompatible exterior work must not be recommended");
assert.equal(pet.some((row) => row.addonCode === "included_protectant"), false, "already-included work must not be recommended");

const selected = recommendAddons({ addons, pkg, packageCode: pkg.code, conditionFlags: ["pet_hair"], selectedCodes: ["pet_hair"] });
assert.equal(selected.some((row) => row.addonCode === "pet_hair"), false, "already-selected add-on must not be recommended again");

const odor = recommendAddons({ addons, pkg, packageCode: pkg.code, conditionFlags: ["odor"] });
assert.equal(odor[0]?.addonCode, "odor", "odour condition should recommend odour treatment");
assert.equal(odor[0]?.quoteRequired, true, "quote-required work must stay quote-marked");

const headlight = recommendAddons({ addons, pkg, packageCode: pkg.code, conditionFlags: ["headlights"] });
assert.equal(headlight[0]?.addonCode, "headlights", "headlight condition should surface standalone restoration");

const none = recommendAddons({ addons, pkg, packageCode: pkg.code, conditionFlags: [], goal: "unsure" });
assert.deepEqual(none, [], "no positive evidence means no invented upsell");

const cheap = { code: "cheap_wax", name: "Wax Protection", prices_cad: { mid: 25 }, standalone_allowed: true };
const costly = { code: "costly_wax", name: "Wax Protection", prices_cad: { mid: 65 }, standalone_allowed: true };
const tie = recommendAddons({ addons: [costly, cheap], packageCode: pkg.code, vehicleSize: "mid", goal: "quick_exterior" });
assert.equal(tie[0]?.addonCode, "cheap_wax", "lower price may break a relevance tie instead of pushing the costlier option");

assert.deepEqual(addonAttachRate({ exposures: 10, accepts: 4 }), { exposures: 10, accepts: 4, attachRatePct: 40 }, "attach rate should use real exposures and accepts");
assert.deepEqual(addonAttachRate({ exposures: 0, accepts: 2 }), { exposures: 0, accepts: 0, attachRatePct: null }, "zero evidence must not fabricate an attach rate");

console.log("Build 367 add-on eligibility regression tests passed.");
