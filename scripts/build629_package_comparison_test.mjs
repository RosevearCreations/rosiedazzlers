import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PACKAGE_COMPARISON_SCHEMA_629, PACKAGE_COMPARE_LIMIT_629,
 normalizePackageComparisonSelection629, buildServiceComparison629
} from "../assets/booking-service-comparison-v629.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const catalog=JSON.parse(read("../functions/api/data/rosie_services_pricing_and_packages.json"));
const book=read("../book.html"),mirror=read("../book/index.html");
const planner=read("../booking-planner.html");
const style=read("../assets/booking-service-comparison-v629.css");
const source=read("../assets/booking-service-comparison-v629.js");
assert.equal(PACKAGE_COMPARISON_SCHEMA_629,"rosie-service-package-comparison.v1");
assert.equal(PACKAGE_COMPARE_LIMIT_629,3);
assert.deepEqual(normalizePackageComparisonSelection629(["basic_detail","basic_detail","complete_detail","premium_wash","interior_detail"]),
 ["basic_detail","complete_detail","premium_wash"]);
assert.deepEqual(normalizePackageComparisonSelection629("not an array"),[]);
const expected={small:229,mid:269,oversize:309};
for(const [size,price] of Object.entries(expected)){
 const result=buildServiceComparison629({catalog,codes:["basic_detail","complete_detail"],vehicleSize:size});
 assert.equal(result.vehicle_size,size);
 assert.equal(result.columns.length,2);
 assert.equal(result.columns[0].price_cents,price*100);
 assert.equal(result.columns[0].deposit_cents,5000);
 assert.equal(result.is_checkout,false);
 assert.equal(result.booking_created,false);
 assert.equal(result.deposit_taken,false);
 assert.ok(result.service_rows.some(row=>row.name==="Shampoo Carpets & Mats" &&
   row.included[0]===false && row.included[1]===true));
 assert.ok(result.service_rows.some(row=>row.name==="Full Vacuum (Seats, Carpets, Mats, Trunk)" &&
   row.included[0]===true && row.included[1]===true));
}
const noSize=buildServiceComparison629({catalog,codes:["basic_detail"],vehicleSize:""});
assert.equal(noSize.vehicle_size,null);
assert.equal(noSize.columns[0].price_cents,null,"never make a size-free price claim");
const unknown=buildServiceComparison629({catalog,codes:["unknown","basic_detail"],vehicleSize:"mid"});
assert.deepEqual(unknown.selected_codes,["basic_detail"]);
const missingPriceCatalog={packages:[{code:"test",name:"Test",prices_cad:{small:null},
 deposit_cad:null,included_services:["Vacuum","Vacuum"]}]};
const missing=buildServiceComparison629({catalog:missingPriceCatalog,codes:["test"],vehicleSize:"small"});
assert.equal(missing.columns[0].price_cents,null);
assert.deepEqual(missing.service_rows.map(row=>row.name),["Vacuum"]);
const editable=structuredClone(catalog);
editable.packages.find(p=>p.code==="basic_detail").prices_cad.mid=279;
editable.packages.find(p=>p.code==="basic_detail").included_services.push({name:"Owner-added service"});
const newValues=buildServiceComparison629({catalog:editable,codes:["basic_detail"],vehicleSize:"mid"});
assert.equal(newValues.columns[0].price_cents,27900,"owner catalog edits must be reflected automatically");
assert.ok(newValues.service_rows.some(row=>row.name==="Owner-added service"&&row.included[0]));
assert.equal(book,mirror,"/book and /book/index.html must remain identical");
assert.match(book,/id="packageCompare629"/);
assert.match(book,/id="packageCompareChoices629"/);
assert.match(book,/id="packageCompareTable629"/);
assert.match(book,/buildServiceComparison629/);
assert.match(book,/data-compare-choose/);
assert.match(book,/data-choose-package/);
assert.match(book,/renderPackageComparison629\(\);/);
assert.match(book,/booking-service-comparison-v629\.css/);
assert.match(planner,/target="_blank" rel="noopener"/);
assert.match(planner,/\/book#packageCompare629/);
assert.match(planner,/function validateStep\(step\)/);
assert.match(planner,/fetch\("\/api\/checkout"/);
assert.match(style,/overflow-x:auto/);
assert.match(style,/focus-visible/);
assert.doesNotMatch(source,/(?:fetch\(|localStorage|sessionStorage|\/api\/checkout|stripe|CREATE TABLE)/i);
console.log("Build 629 live-catalog service inclusion, current vehicle prices and comparison UI: PASS");
