import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildServiceGuide571 } from "../assets/service-guide-model-v571.js";
const empty = buildServiceGuide571(null);
assert.equal(empty.status, "catalog_unavailable");
assert.equal(empty.prices_visible, false);
assert.equal(empty.booking_created, false);
const payload = {ok:true, source:"db_or_fallback",packages:[
  {code:"basic_detail",name:"Basic Detail",description:"General detailing",prices_cad:{small:999}},
  {code:"complete_detail",name:"Complete Detail",quote_required:true,prices_cad:{small:123}},
  {code:"malicious_code",name:"Do not publish"}
],addons:[
  {code:"ceramic",name:"Ceramic Coating",quote_required:true,prices_cad:{small:300}},
  {code:"wax",name:"Wax",quote_required:false,prices_cad:{small:50}}
]};
const actual=buildServiceGuide571(payload);
assert.equal(actual.status,"catalog_view_only");
assert.deepEqual(actual.package_cards.map(x=>x.code),["basic_detail","complete_detail"]);
assert.equal(actual.package_cards[1].status,"Scope requires a staff quote");
assert.equal(actual.addon_cards[0].guidance,"Requires individual scope review");
assert.equal(actual.catalog_origin,"unverified_db_or_fallback");
assert.equal(actual.prices_visible,false);
assert.equal(actual.quote_submitted,false);
assert.equal(actual.booking_created,false);
assert.equal(actual.publishing_approved,false);
assert.ok(!JSON.stringify(actual).includes("999"));
assert.ok(!JSON.stringify(actual).includes("123"));
assert.ok(!JSON.stringify(actual).includes("300"));
assert.ok(!JSON.stringify(actual).includes("50"));
assert.ok(Object.isFrozen(actual.package_cards));
const code=readFileSync(new URL("../assets/service-guide-preview-v571.js",import.meta.url),"utf8");
assert.ok(code.includes('"/api/pricing_catalog_public"'));
assert.ok(!/\.post\(|method\s*:\s*["']POST|localStorage|sessionStorage|setCookie/.test(code));
const html=readFileSync(new URL("../preview/services/index.html",import.meta.url),"utf8");
assert.ok(html.includes('noindex,nofollow,noarchive'));
assert.ok(html.includes('/preview/quote-first/'));
for(const path of ["pricing.html","services.html","pricing/index.html","services/index.html"]){
 const content=readFileSync(new URL("../"+path,import.meta.url),"utf8");
 assert.match(content, /<link rel="canonical" href="https:\/\/rosiedazzlers\.ca\/book"/);
 assert.match(content, /url=\/book/);
}
console.log("Build 571 service guide catalog view + SEO route parity: PASS");
