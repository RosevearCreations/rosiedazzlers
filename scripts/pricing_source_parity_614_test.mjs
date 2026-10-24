import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPricingSourceParity614 } from "../functions/api/_lib/pricing-source-parity-614.js";

const catalog = JSON.parse(readFileSync(new URL("../data/rosie_services_pricing_and_packages.json", import.meta.url)));
const backup = JSON.parse(JSON.stringify(catalog));
backup.addons.find((row) => row.code === "engine_cleaning").quote_required = false;
const report = buildPricingSourceParity614({ bundled: catalog, appManagement: backup, checkoutCatalog: backup, dbAvailable: true, updatedAt: "2026-03-25T22:18:30Z" });
assert.equal(report.ok, true);
assert.equal(report.read_only, true);
assert.equal(report.source_status, "app_management_settings");
assert.equal(report.summary.owner_decision_required, true);
assert.equal(report.db_verified, true);
assert.equal(report.updated_at, "2026-03-25T22:18:30Z");
for (const [size, approvedPrice] of [["small",229],["mid",269],["oversize",309]]) {
  const mismatches = report.findings.filter((row) => row.group === "packages" && row.code === "basic_detail" && row.field === `prices_cad.${size}`);
  assert.equal(mismatches.length,0, `Basic Detail ${size} should now have source parity at $${approvedPrice}`);
  assert.equal(catalog.packages.find((row) => row.code === "basic_detail").prices_cad[size], approvedPrice);
}
// Deliberately stale DB values must still show a mismatch, not silently mask it.
const outdated = JSON.parse(JSON.stringify(catalog));
outdated.packages.find((row)=>row.code==="basic_detail").prices_cad={small:115,mid:135,oversize:170};
const staleReport = buildPricingSourceParity614({bundled:catalog,appManagement:outdated,checkoutCatalog:outdated,dbAvailable:true});
assert.ok(staleReport.findings.some((row)=>row.code==="basic_detail" && row.field==="prices_cad.small" && row.differences.includes("app_management_vs_bundled")));

assert.ok(report.findings.some((row) => row.group === "addons" && row.code === "engine_cleaning" && row.field === "quote_required" && row.checkout === false && row.public_api === true));
assert.equal(catalog.addons.find((row) => row.code === "engine_cleaning").quote_required, true, "parity cannot change the bundled catalog");

const unavailable = buildPricingSourceParity614({ bundled: catalog, checkoutCatalog: catalog, warning: "Database inaccessible" });
assert.equal(unavailable.db_verified, false);
assert.equal(unavailable.summary.owner_decision_required, true);
assert.equal(unavailable.updated_at, null);
assert.equal(unavailable.warning, "Database inaccessible");

const custom = JSON.parse(JSON.stringify(catalog));
custom.packages.find((row) => row.code === "premium_wash").prices_cad.small = 99;
const changed = buildPricingSourceParity614({ bundled: catalog, appManagement: custom, checkoutCatalog: custom, dbAvailable: true });
assert.ok(changed.findings.some((row) => row.code === "premium_wash" && row.field === "prices_cad.small" && row.differences.includes("app_management_vs_bundled")));
assert.deepEqual(custom.packages.find((row) => row.code === "premium_wash").prices_cad, { small: 99, mid: 105, oversize: 125 });

// Protect the route's authorization and no-write boundary with a source guard.
// The route imports the legacy bundled JSON syntax used by Cloudflare Pages;
// it cannot be directly imported into Node 22/24 without changing the bundler.
const endpoint = readFileSync(new URL("../functions/api/admin/pricing_source_parity_614.js", import.meta.url), "utf8");
assert.match(endpoint, /requireStaffAccess\(\{ request, env, capability: "manage_staff"/);
assert.match(endpoint, /if \(!access\.ok\) return noStore\(access\.response\)/);
assert.match(endpoint, /method: "GET"/);
assert.match(endpoint, /mergeCatalog\(row\.value, bundled\)/);
assert.match(endpoint, /"Cache-Control", "no-store"/);
for (const name of ["Post", "Put", "Patch", "Delete"]) {
  assert.match(endpoint, new RegExp(`export function onRequest${name}\\(\\) \\{ return noStore\\(methodNotAllowed\\(\\)\\)`));
}
assert.ok(!/\b(PATCH|DELETE|PUT|POST)\b/.test(endpoint.slice(endpoint.indexOf("const response = await fetch"), endpoint.indexOf("export function onRequestPost"))), "DB read path must not contain a mutating verb");

const rootHtml = readFileSync(new URL("../admin.html", import.meta.url), "utf8");
const routeHtml = readFileSync(new URL("../admin/index.html", import.meta.url), "utf8");
assert.equal(rootHtml, routeHtml, "admin route mirrors must remain identical");
assert.match(rootHtml, /pricingSourceParity614/);
assert.match(rootHtml, /loadPricingSourceParity614/);
assert.match(rootHtml, /OWNER PRICE REVIEW REQUIRED/);
assert.match(rootHtml, /guardedLoad\('Pricing parity owner review'/);
console.log("Build 614 read-only pricing source, public/checkout mismatch and owner hold: PASS");
