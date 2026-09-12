import assert from "node:assert/strict";
import { applyCommercialAccuracy, CANONICAL_PACKAGE_PRICES_CAD } from "../functions/api/_lib/commercial-accuracy.js";

const staleCatalog = {
  packages: [
    { code: "premium_wash", name: "Premium Wash", prices_cad: { small: 1, mid: 2, oversize: 3 } },
    { code: "basic_detail", name: "Basic Detail", prices_cad: { small: 115, mid: 135, oversize: 170 } },
    { code: "complete_detail", name: "Complete Detail", prices_cad: { small: 1, mid: 2, oversize: 3 } },
    { code: "interior_detail", name: "Interior Detail", prices_cad: { small: 1, mid: 2, oversize: 3 } },
    { code: "exterior_detail", name: "Exterior Detail", prices_cad: { small: 1, mid: 2, oversize: 3 } }
  ],
  addons: [
    { code: "headlight_restoration_addon", name: "Headlight Restoration", category: "restoration", price_cad: 90 },
    { code: "carpet_shampoo", name: "Carpet Shampoo", category: "interior", price_cad: 60 },
    { code: "odor_treatment", name: "Odor Treatment", category: "interior", price_cad: 75 },
    { code: "pet_hair_removal", name: "Pet Hair Removal", category: "interior", price_cad: 50 },
    { code: "two_stage_polish", name: "Two-Stage Polish", category: "paint correction", price_cad: 250 },
    { code: "external_ceramic_coating", name: "Ceramic Coating", category: "protection", price_cad: 400 },
    { code: "generic_addon", name: "Generic Add-on", category: "service add-on", price_cad: 25 }
  ]
};

const result = applyCommercialAccuracy(staleCatalog);

assert.deepEqual(result.package_map.premium_wash.prices_cad, CANONICAL_PACKAGE_PRICES_CAD.premium_wash);
assert.deepEqual(result.package_map.basic_detail.prices_cad, { small: 229, mid: 269, oversize: 309 });
assert.deepEqual(result.package_map.complete_detail.prices_cad, { small: 319, mid: 369, oversize: 419 });
assert.deepEqual(result.package_map.interior_detail.prices_cad, { small: 195, mid: 220, oversize: 245 });
assert.deepEqual(result.package_map.exterior_detail.prices_cad, { small: 195, mid: 220, oversize: 245 });

for (const addon of result.addons) {
  assert.ok(addon.pricing_mode, `${addon.code}: pricing_mode`);
  assert.ok(addon.pricing_basis, `${addon.code}: pricing_basis`);
  assert.ok(addon.duration_label, `${addon.code}: duration_label`);
  assert.ok(Array.isArray(addon.scope_includes) && addon.scope_includes.length, `${addon.code}: scope_includes`);
  assert.ok(Array.isArray(addon.scope_excludes) && addon.scope_excludes.length, `${addon.code}: scope_excludes`);
  assert.ok(Array.isArray(addon.customer_prep) && addon.customer_prep.length, `${addon.code}: customer_prep`);
  assert.ok(Array.isArray(addon.aftercare) && addon.aftercare.length, `${addon.code}: aftercare`);
  assert.ok(Array.isArray(addon.quote_triggers) && addon.quote_triggers.length, `${addon.code}: quote_triggers`);
  assert.ok(Array.isArray(addon.condition_pricing) && addon.condition_pricing.length, `${addon.code}: condition_pricing`);
  assert.match(addon.escalation_rule, /authorization/i, `${addon.code}: escalation_rule`);
}

assert.equal(result.addon_map.headlight_restoration_addon.quote_required, true);
assert.equal(result.addon_map.headlight_restoration_addon.pricing_mode, "condition_assessed");
assert.match(result.addon_map.headlight_restoration_addon.pricing_basis, /oxidation|yellowing/i);

assert.match(result.addon_map.carpet_shampoo.duration_label, /full-day/i);
assert.match(result.addon_map.carpet_shampoo.quote_triggers.join(" "), /carpet lifting|floor pan|mold|rust/i);

assert.equal(result.addon_map.odor_treatment.quote_required, true);
assert.match(result.addon_map.odor_treatment.scope_excludes.join(" "), /mold|biohazard|leak/i);

assert.match(result.addon_map.pet_hair_removal.pricing_basis, /hair volume|embedded/i);
assert.equal(result.addon_map.two_stage_polish.quote_required, true);
assert.match(result.addon_map.two_stage_polish.scope_excludes.join(" "), /100%|clear-coat|clear coat/i);
assert.equal(result.addon_map.external_ceramic_coating.quote_required, true);

assert.equal(result.commercial_accuracy.build, 388);
assert.equal(result.commercial_accuracy.currency, "CAD");
assert.equal(result.commercial_accuracy.source_owned_package_matrix, true);

// Input remains untouched: source overlay is read-only transformation, not a catalog mutation.
assert.deepEqual(staleCatalog.packages[1].prices_cad, { small: 115, mid: 135, oversize: 170 });

console.log("Build 388 commercial accuracy behavior: PASS");
