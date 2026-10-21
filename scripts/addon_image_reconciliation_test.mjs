import fs from "node:fs";
import assert from "node:assert/strict";
const missing=JSON.parse(fs.readFileSync("data/standard_missing_addon_assets.json","utf8"));
assert.equal(missing.originalMissingReferences,73);
assert.equal(missing.originalUniqueMissingFilenames,17);
assert.equal(missing.verifiedExistingSvgReplacements,5);
assert.equal(missing.awaitingOriginalPngArtwork,12);
const sourcePaths=["assets/site.js","data/landing_pages_content.json","data/rosie_services_pricing_and_packages.json","functions/api/data/landing_pages_content.json","functions/api/data/rosie_services_pricing_and_packages.json"];
for(const row of missing.assets) {
 assert.ok(row.originalMissingLocalPath.startsWith("/assets/addons/"));
 if(row.status==="staged-svg-replacement"){
  const vector=row.resolvedSvgPath;
  assert.ok(vector?.endsWith(".svg"));
  assert.ok(fs.existsSync(vector.slice(1)),"Missing committed SVG "+vector);
  const markup=fs.readFileSync(vector.slice(1),"utf8");
  assert.match(markup,/<svg\b/i,"Not an SVG "+vector);
  for(const file of sourcePaths){
   const source=fs.readFileSync(file,"utf8");
   assert.ok(!source.includes(row.originalMissingLocalPath),"Missing old PNG still used by "+file);
   assert.ok(source.includes(vector),"Vector fallback not used by "+file);
  }
 } else {
  assert.equal(row.status,"awaiting-owned-png");
  assert.ok(!fs.existsSync(row.originalMissingLocalPath.slice(1)),
    "Artwork now exists; update manifest after checking permissions: "+row.originalMissingLocalPath);
 }
}
console.log("5 genuine SVG equivalents wired across 5 sources; 12 exact PNG upload names reserved. PASS");
