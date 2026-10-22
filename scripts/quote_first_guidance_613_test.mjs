import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildQuoteDiscussion613,CONCERNS_613} from "../assets/quote-first-guidance-v613.js";
import {WIZARD_OPTIONS_570} from "../assets/quote-first-wizard-model-v570.js";

const catalog=JSON.parse(readFileSync(new URL("../data/rosie_services_pricing_and_packages.json",import.meta.url),"utf8"));
const packageCodes=new Set(catalog.packages.map(p=>p.code));
const addons=new Map(catalog.addons.map(item=>[item.code,item]));
for(const item of Object.values(CONCERNS_613)){
 assert.ok(addons.has(item.code),item.code+" missing in bundled catalog");
 assert.equal(addons.get(item.code).quote_required,true,item.code+" must remain staff-reviewed");
}

for(const goal of WIZARD_OPTIONS_570.goal.map(x=>x.id)){
 for(const condition of WIZARD_OPTIONS_570.condition.map(x=>x.id)){
  const input={goal,condition,extras:["pet_hair","salt","salt","odour","paint","coating"]};
  const before=JSON.stringify(input);
  const r=buildQuoteDiscussion613(input);
  assert.equal(JSON.stringify(input),before,"recommendation must not mutate wizard state");
  assert.ok(r.packages.length>=2 && r.packages.length<=3);
  assert.equal(new Set(r.packages.map(x=>x.code)).size,r.packages.length);
  for(const service of r.packages){
   assert.ok(packageCodes.has(service.code),service.code+" missing in fallback catalog");
   assert.match(service.decision,/not confirmed/i);
   assert.ok(Object.isFrozen(service));
  }
  assert.equal(r.concerns.length,5,"duplicate extras must not be added twice");
  assert.equal(r.review_required,true);
  for(const key of ["pricing_confirmed","availability_confirmed","booking_confirmed","payment_authorized","intake_enabled_by_guidance"]){
   assert.equal(r[key],false,key+" cannot be authorized by preview guidance");
  }
  assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.packages)&&Object.isFrozen(r.concerns));
  assert.ok(!/\$\d|deposit|appointment confirmed/i.test(JSON.stringify(r)));
 }
}
const invalid=buildQuoteDiscussion613({goal:"unknown",condition:"wrong",extras:["bad","pet_hair","pet_hair"]});
assert.equal(invalid.packages.length,0);
assert.equal(invalid.concerns.length,1);
assert.equal(buildQuoteDiscussion613(null).review_required,true);
assert.match(buildQuoteDiscussion613({goal:"interior",condition:"heavy",extras:[]}).condition_note,/staff assessment/i);

const renderer=readFileSync(new URL("../assets/quote-first-wizard-v570.js",import.meta.url),"utf8");
assert.ok(renderer.includes("buildQuoteDiscussion613(state)"));
assert.ok(renderer.includes("document.createElement(\"section\")"));
assert.ok(renderer.includes("textContent=concern.name"));
assert.ok(!renderer.includes("innerHTML"));
const html=readFileSync(new URL("../preview/quote-first/index.html",import.meta.url),"utf8");
assert.ok(html.includes("noindex,nofollow,noarchive"));
assert.ok(html.includes("Prototype only:"));
assert.ok(html.includes("quote-first-intake-v573"));
const css=readFileSync(new URL("../assets/quote-first-wizard-v570.css",import.meta.url),"utf8");
assert.ok(css.includes(".qf-guidance-list"));
assert.ok(css.includes("minmax(min(100%,225px),1fr)"));
console.log("Build 613 condition-aware quote discussion preview and manual staff-review boundaries: PASS");
