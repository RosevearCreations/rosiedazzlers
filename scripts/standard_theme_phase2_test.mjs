import assert from "node:assert/strict";
import fs from "node:fs";
import {validatedThemeRegistry, DEFAULT_THEME, initThemeRuntime, readThemeRegistry} from "../assets/theme-runtime.js";
import {inspectRenderedVisuals, downloadVisualAudit} from "../assets/visual-audit-inspector.js";
const json=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const registry=json("data/theme_registry.json");
const initial=validatedThemeRegistry(registry);
assert.equal(DEFAULT_THEME,"standard");
assert.equal(initial.defaultTheme,"standard");
assert.equal(initial.themes.standard.stylesheet,"/assets/themes/standard.css");
assert.deepEqual(Object.keys(initial.themes),["standard"]);
const rejected=validatedThemeRegistry({themes:{
 standard:{label:"Standard",stylesheet:"https://bad.example/theme.css",status:"approved"},
 experimental:{label:"Unapproved",stylesheet:"/assets/themes/experimental.css",status:"draft"},
 "../evil":{label:"Not safe",stylesheet:"/assets/themes/standard.css",status:"approved"},
 summer:{label:"Summer",stylesheet:"javascript:alert(1)",status:"approved"}
}});
assert.equal(rejected.themes.standard.stylesheet,"/assets/themes/standard.css");
assert.equal(rejected.themes.experimental,undefined);
assert.equal(rejected.themes["../evil"],undefined);
assert.equal(rejected.themes.summer,undefined);
const unavailable=await readThemeRegistry(async()=>({ok:false}));
assert.deepEqual(Object.keys(unavailable.themes),["standard"]);
const fakeDocument={documentElement:{dataset:{}},getElementById:()=>null};
const manager=initThemeRuntime(fakeDocument);
assert.equal(manager.active,"standard");
assert.equal(await manager.previewTheme("../secret"),false);
assert.equal(typeof inspectRenderedVisuals,"function");
assert.equal(typeof downloadVisualAudit,"function");
const target=json("data/build253_photo_targets.json");
const slots=json("data/standard_theme_image_slots.json");
const pages=json("data/standard_admin_visual_source_inventory.json");
assert.equal(target.targets.length,617);
assert.equal(pages.inspectedPages,17);
assert.equal(pages.pages.length,17);
assert.equal(pages.protectedAdminIllustrations,5);
const processes=slots.entries.filter(x=>x.status==="wired_safe_local_fallback_only");
assert.equal(processes.length,24);
for(const item of processes){
 const slug=item.route.slice(1);
 const html=fs.readFileSync(slug+"/index.html","utf8");
 assert.ok(html.includes('data-standard-filename="'+item.filename+'"'),"Unmapped process artwork: "+slug);
}
const shared=fs.readFileSync("assets/chrome.js","utf8");
assert.ok(shared.includes("installOptInVisualAudit"));
assert.ok(shared.includes("initThemeRuntime"));
for(const file of ["admin-media-health.html","admin-media-health/index.html"]){
 const html=fs.readFileSync(file,"utf8");
 assert.ok(html.includes("visualAuditDownload"),"Admin runtime audit control missing: "+file);
}
const landing=fs.readFileSync("assets/landing-page-build388.js","utf8");
assert.ok(landing.includes('img.dataset.standardHero === "true"'),"Before/after fallback must not use generic themes");
console.log("Standard Theme Phase 2: whitelist, 617 registry, 24 process slots, 17 audited source surfaces, read-only audit hooks PASS");
