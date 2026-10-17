import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ADDON_CODES_572,ADDON_GUIDES_572,addonGuide572,approvedAddonImage572} from "../assets/addon-guides-v572.js";
import {onRequestGet} from "../functions/preview/addons/[code].js";
assert.equal(ADDON_CODES_572.length,24);
assert.equal(new Set(ADDON_CODES_572).size,24);
for(const code of ADDON_CODES_572){
 const guide=addonGuide572(code,{ok:true,addons:[{code,quote_required:true,prices_cad:{small:999}}]},null);
 assert.equal(guide.quote_guidance,"Individual quote required");
 assert.equal(guide.media_status,"approval_missing");
 assert.equal(guide.image,null);
 for(const key of ["price_displayed","booking_created","lead_sent","payment_taken","public_launch_approved"])assert.equal(guide[key],false);
 assert.ok(!JSON.stringify(guide).includes("999"));
 for(const key of ["name","overview","assessment","limitations"])assert.ok(ADDON_GUIDES_572[code][key].length>25 || key==="name");
 const response=await onRequestGet({params:{code}});
 assert.equal(response.status,200);
 assert.match(response.headers.get("X-Robots-Tag"),/noindex/);
 const html=await response.text();
 assert.ok(html.includes("Preview only"));
 assert.ok(html.includes(ADDON_GUIDES_572[code].name));
 assert.ok(!html.includes("<img"));
}
assert.equal((await onRequestGet({params:{code:"invalid"}})).status,404);
const valid={status:"approved_public",consent_status:"approved_public",privacy_status:"approved_public",license_status:"approved",reviewer:"Owner",approval_reference:"approval-ref-123",alt_text:"Detailed view of a real treatment",width:1600,height:1067,src:"/assets/addons/engine_cleaning.png"};
assert.ok(approvedAddonImage572(valid));
assert.equal(approvedAddonImage572({...valid,consent_status:"unverified"}),null);
assert.equal(approvedAddonImage572({...valid,src:"https://bad.example/img.png"}),null);
assert.equal(approvedAddonImage572({...valid,width:1000}),null);
const index=readFileSync(new URL("../preview/addons/index.html",import.meta.url),"utf8");
assert.match(index,/noindex,nofollow,noarchive/);
for(const path of ["pricing.html","services.html","pricing/index.html","services/index.html"]){
 const html=readFileSync(new URL("../"+path,import.meta.url),"utf8");
 assert.ok(html.includes("https://rosiedazzlers.ca/book"));
}
console.log("Build 572 PASS: 24 detailed unindexed pages, consent/license media fail-closed, no live pricing or booking changes");
