import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SERVICE_GUIDANCE_SCHEMA_736, VEHICLE_TIERS_736,
  priceTiers736, packageScope736, addonGuidance736
} from "../assets/service-addon-guidance-v736.js";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const catalog = JSON.parse(read("data/rosie_services_pricing_and_packages.json"));
const fallback = JSON.parse(read("functions/api/data/rosie_services_pricing_and_packages.json"));
assert.deepEqual(catalog, fallback, "Read-only guidance must use source-identical public/server catalogues");
assert.equal(SERVICE_GUIDANCE_SCHEMA_736, "rosie-service-addon-guidance.v1");
assert.deepEqual(VEHICLE_TIERS_736.map(tier=>tier.key), ["small", "mid", "oversize"]);

const baseline = JSON.stringify(catalog);
for(const pkg of catalog.packages){
  const scope = packageScope736(catalog, pkg);
  assert.equal(scope.source, "current_catalog");
  assert.equal(scope.has_automatic_addons, false);
  assert.ok(scope.included.length > 0);
  assert.deepEqual(scope.included.map(row=>row.name), pkg.included_services.map(row=>row.name));
  for(const missing of scope.not_listed){
    assert.ok(!scope.included.some(row=>row.name===missing), `Not-listed services cannot be included in ${pkg.code}`);
    assert.ok(catalog.packages.some(other=>other.included_services.some(row=>row.name===missing)), "Exclusions derive from another package");
  }
  for(const tier of scope.tiers){
    assert.equal(tier.cents, Math.round(pkg.prices_cad[tier.size]*100), `Active ${pkg.code}/${tier.size} amount, never hard-coded`);
  }
}
const basic = packageScope736(catalog, catalog.packages.find(pkg=>pkg.code==="basic_detail"));
assert.deepEqual(basic.tiers.map(tier=>tier.cents), [22900,26900,30900], "Existing owner-approved Basic Detail schedule stays unchanged");
assert.ok(basic.included.some(row=>row.name==="Clean Leather / Vinyl Seats" && row.note==="Where equipped"));
assert.ok(basic.not_listed.includes("Shampoo Carpets & Mats"));
assert.ok(basic.not_listed.includes("Hand Wash & Dry"));
assert.equal(packageScope736(catalog,catalog.packages.find(pkg=>pkg.code==="complete_detail")).not_listed.length,0);

let quoteCount=0, tierCount=0;
for(const addon of catalog.addons){
  const guidance = addonGuidance736(addon,"small");
  assert.equal(guidance.code,addon.code);
  assert.equal(guidance.quote_required, addon.quote_required===true || addon.pricing_mode==="condition_assessed");
  assert.equal(guidance.is_diagnosed,false,"No customer condition is inferred");
  assert.equal(guidance.is_selected,false,"Nothing is auto-added");
  assert.equal(guidance.is_checkout,false,"Display never charges or books");
  assert.deepEqual(guidance.tiers.map(row=>row.size),["small","mid","oversize"]);
  if(guidance.quote_required){
    quoteCount++;
    assert.equal(guidance.pricing_kind,"assessment_quote");
    assert.match(guidance.guidance,/quote before approval/i);
    assert.ok(guidance.assessment_basis || addon.notes?.length,`Assessment reason must be explainable for ${addon.code}`);
  }else assert.equal(guidance.pricing_kind,"starting_price");
  for(const tier of guidance.tiers){
    if(tier.cents!==null){
      tierCount++;
      assert.ok(tier.cents>0);
      assert.equal(tier.cents,Math.round(addon.prices_cad[tier.size]*100));
    }
  }
  if(guidance.has_size_tiers) assert.equal(guidance.selected_cents,guidance.tiers[0].cents);
  else assert.equal(guidance.selected_cents,guidance.base_cents);
}
for(const code of ["external_ceramic_coating","external_graphene_fine_finish","window_tinting"]){
  const addon = catalog.addons.find(addon=>addon.code===code);
  assert.ok(addon,code);
  assert.equal(addonGuidance736(addon).quote_required,true);
  assert.equal(addonGuidance736(addon).selected_cents,null,"Never silently show mid-price with no vehicle selected");
}
assert.ok(quoteCount>=15 && tierCount>=50);
assert.equal(addonGuidance736({code:"unknown",quote_required:true,prices_cad:{small:0,mid:null,oversize:"oops"}}).tiers.every(row=>row.cents===null),true,"Missing prices never become free or fixed");
assert.equal(addonGuidance736({price_cad:79,quote_required:true}).base_cents,7900,"Non-tiered starting guidance is still a quote");
assert.deepEqual(priceTiers736({prices_cad:{small:20.55,mid:40.99,oversize:0}}).map(row=>row.cents),[2055,4099,null]);
assert.equal(JSON.stringify(catalog),baseline,"Guidance is pure and never alters the canonical schedule");

const book = read("book.html"), mirror = read("book/index.html"), planner = read("booking-planner.html");
const rich = read("assets/booking-specialty-cards.js"), policies = read("assets/site-policies.js");
const css = read("assets/service-addon-guidance-v736.css");
assert.equal(book,mirror,"Both public /book routes must be source-identical");
for(const markup of [book,planner]){
  assert.match(markup,/service-addon-guidance-v736\.js\?v=20261101build736/);
  assert.match(markup,/service-addon-guidance-v736\.css\?v=20261101build736/);
  assert.match(markup,/site-policies\.js\?v=20261101build736/);
  assert.match(markup,/quote.required|quote_required/i);
  assert.match(markup,/Starting at:/);
}
assert.match(book,/packageScope736\(state\.catalog,pkg\)/);
assert.match(book,/Included work &amp; exclusions/);
assert.match(book,/Not listed in this package/);
assert.match(book,/for\(const tier of VEHICLE_TIERS_736\)/);
assert.match(book,/No add-on is selected for you/);
assert.match(book,/state = \{ catalog:null, size:"", packageCode:"", addons:new Set\(\)/);
assert.match(book,/if \(addon\.quote_required\) \{ quoteOnly = true; return; \}/);
assert.match(book,/const raw = state\.size \? \(prices\[state\.size\] \?\? addon\?\.price_cad\) : addon\?\.price_cad/);
assert.match(book,/addonGuidance736\(addon,state\.size\)/);
assert.match(planner,/addonGuidance736\(addon, selectedSize\(\)\)/);
assert.match(planner,/quoteOnly = true/);
assert.match(planner,/No fixed amount published/);
assert.match(rich,/addonGuidance736/);
assert.match(rich,/Add for quote review/);
assert.match(rich,/overflow-wrap:anywhere/);
assert.match(rich,/Quote required · assessment/);
assert.match(policies,/booking-specialty-cards\.js\?v=20261101build736/);
assert.match(css,/max-width:340px/);
assert.match(css,/overflow-wrap:anywhere/);
assert.doesNotMatch(read("assets/service-addon-guidance-v736.js"), /fetch\(|localStorage|sessionStorage|\.click\(|stripe|createBooking|window\./i);

console.log(`Build 736 PASS — ${catalog.packages.length} package inclusion/exclusion cards, ${VEHICLE_TIERS_736.length} catalog price tiers, ${catalog.addons.length} optional addons (${quoteCount} condition-quoted), ${tierCount} size-based add-on prices, canonical source parity, no upsell/condition inference, mobile and route safety.`);
